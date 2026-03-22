import { findByProps, findByStoreName } from "@vendetta/metro";
import { after, before } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import Settings from "./Settings";

// Ensure storage defaults
storage.swaps ??= {};
storage.enabled ??= true;

// Metro module lookups
const UserStore = findByStoreName("UserStore");
const RelationshipStore = findByStoreName("RelationshipStore");
const AvatarUtils = findByProps("getUserAvatarURL", "getAvatarURL");
const BannerUtils = findByProps("getUserBannerURL");
const UserProfileStore = findByStoreName("UserProfileStore");

const patches = [];

// Build CDN avatar URL for a given user ID + avatar hash
function buildAvatarURL(userId, avatarHash, size = 256) {
    if (!avatarHash) return null;
    const ext = avatarHash.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}?size=${size}`;
}

// Build CDN banner URL for a given user ID + banner hash
function buildBannerURL(userId, bannerHash, size = 600) {
    if (!bannerHash) return null;
    const ext = bannerHash.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/banners/${userId}/${bannerHash}.${ext}?size=${size}`;
}

// Fetch full profile data from Discord API
async function fetchUserProfile(targetId) {
    const token = findByProps("getToken")?.getToken?.();
    if (!token) throw new Error("No token available");

    const res = await fetch(`https://discord.com/api/v10/users/${targetId}/profile`, {
        headers: {
            Authorization: token,
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

// Cache for fetched profiles to avoid repeated API calls
const profileCache = {};

async function ensureProfileCached(targetId) {
    if (profileCache[targetId]) return profileCache[targetId];
    try {
        const data = await fetchUserProfile(targetId);
        profileCache[targetId] = data;
        return data;
    } catch (e) {
        console.error("[ProfileSwap] Failed to fetch profile:", e);
        return null;
    }
}

// Apply swap overrides to a user object (mutates a copy)
function applySwap(user, swap) {
    if (!user || !swap?.targetId) return user;

    const cached = profileCache[swap.targetId];
    if (!cached) {
        // Trigger background fetch and return original for now
        ensureProfileCached(swap.targetId);
        return user;
    }

    const targetUser = cached.user ?? {};
    const targetProfile = cached.user_profile ?? {};

    const overridden = { ...user };

    if (swap.replaceAvatar && targetUser.avatar !== undefined) {
        overridden.avatar = targetUser.avatar;
        overridden._swapAvatarUserId = swap.targetId;
    }

    if (swap.replaceBanner && targetUser.banner !== undefined) {
        overridden.banner = targetUser.banner;
        overridden._swapBannerUserId = swap.targetId;
    }

    if (swap.replaceAccentColor && targetUser.accent_color !== undefined) {
        overridden.accent_color = targetUser.accent_color;
    }

    if (swap.replaceDecorations) {
        const deco = targetProfile.profile_effect ?? null;
        const avatarDeco = targetProfile.avatar_decoration_data ?? null;
        overridden._swapProfileEffect = deco;
        overridden._swapAvatarDecoration = avatarDeco;
    }

    if (swap.replaceBio && targetProfile.bio !== undefined) {
        overridden.bio = targetProfile.bio;
    }

    return overridden;
}

// Patch UserStore.getUser to intercept user objects
function patchUserStore() {
    if (!UserStore?.getUser) return;

    patches.push(
        after("getUser", UserStore, ([userId], user) => {
            if (!storage.enabled || !user) return user;
            const swap = storage.swaps[userId];
            if (!swap) return user;
            return applySwap(user, swap);
        })
    );
}

// Patch avatar URL builder
function patchAvatarURL() {
    if (!AvatarUtils?.getUserAvatarURL) return;

    patches.push(
        after("getUserAvatarURL", AvatarUtils, ([user, ...rest], originalURL) => {
            if (!storage.enabled || !user) return originalURL;
            const swap = storage.swaps[user.id];
            if (!swap?.replaceAvatar || !swap.targetId) return originalURL;

            const cached = profileCache[swap.targetId];
            if (!cached) {
                ensureProfileCached(swap.targetId);
                return originalURL;
            }

            const targetUser = cached.user ?? {};
            const built = buildAvatarURL(swap.targetId, targetUser.avatar);
            return built ?? originalURL;
        })
    );
}

// Patch banner URL builder
function patchBannerURL() {
    if (!BannerUtils?.getUserBannerURL) return;

    patches.push(
        after("getUserBannerURL", BannerUtils, ([user, ...rest], originalURL) => {
            if (!storage.enabled || !user) return originalURL;
            const swap = storage.swaps[user.id];
            if (!swap?.replaceBanner || !swap.targetId) return originalURL;

            const cached = profileCache[swap.targetId];
            if (!cached) {
                ensureProfileCached(swap.targetId);
                return originalURL;
            }

            const targetUser = cached.user ?? {};
            const built = buildBannerURL(swap.targetId, targetUser.banner);
            return built ?? originalURL;
        })
    );
}

// Patch UserProfileStore for decorations / profile effects
function patchProfileStore() {
    if (!UserProfileStore?.getUserProfile) return;

    patches.push(
        after("getUserProfile", UserProfileStore, ([userId], profile) => {
            if (!storage.enabled) return profile;
            const swap = storage.swaps[userId];
            if (!swap?.replaceDecorations || !swap.targetId) return profile;

            const cached = profileCache[swap.targetId];
            if (!cached || !profile) return profile;

            const targetProfile = cached.user_profile ?? {};

            return {
                ...profile,
                profileEffect: targetProfile.profile_effect ?? profile.profileEffect,
                avatarDecorationData: targetProfile.avatar_decoration_data ?? profile.avatarDecorationData,
            };
        })
    );
}

export default {
    onLoad() {
        patchUserStore();
        patchAvatarURL();
        patchBannerURL();
        patchProfileStore();
        showToast("ProfileSwap loaded", { source: { uri: "https://cdn.discordapp.com/emojis/1079829975572140124.webp" } });
    },

    onUnload() {
        patches.forEach((p) => p());
        patches.length = 0;
        Object.keys(profileCache).forEach((k) => delete profileCache[k]);
    },

    settings: Settings,

    // Expose helpers for Settings UI
    _fetchAndCache: ensureProfileCached,
    _profileCache: profileCache,
    _storage: storage,
};
