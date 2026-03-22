# ProfileSwap — Vendetta Plugin

Replace any Discord user's **avatar, banner, profile accessories, accent color, and bio** with another user's profile — all client-side, using Discord IDs.

---

## Installation

1. Open **Vendetta** in your Discord client
2. Go to **Settings → Plugins → Install plugin**
3. Paste the URL to this plugin's hosted `manifest.json`
4. Tap **Install**

> If self-hosting: place all files in a publicly accessible directory. The `manifest.json` URL is your install URL.

---

## Usage

1. Enable **Developer Mode** in Discord (Settings → Advanced → Developer Mode)
2. Open **Settings → Plugins → ProfileSwap → Settings**
3. Tap **+ Add new swap**
4. Enter the **Source Discord ID** — the user whose profile you want to disguise
5. Tap **Add swap**, then tap **Edit** on the new card
6. Enter the **Target Discord ID** — the user whose profile data will be shown instead
7. Toggle which elements to replace: Avatar · Banner · Accessories & effects · Accent color · Bio
8. Tap **Save swap** — ProfileSwap will fetch and cache the target's profile

The swap is applied everywhere that user appears in the client: messages, member list, profile popout, DMs.

---

## What gets replaced

| Field | Description |
|-------|-------------|
| Avatar | Profile picture (animated if target has Nitro GIF) |
| Banner | Profile banner image |
| Accessories & effects | Avatar decoration frame + profile effect |
| Accent color | Profile accent/nitro color |
| Bio | About Me text |

---

## Notes

- **Client-side only** — only you see the swapped profiles. Other users are unaffected.
- Profile data is fetched once per session and cached in memory. Reload Discord to refresh.
- Requires a valid Discord token (automatic — uses your own session).
- Works with any public Discord user ID.
- Multiple swaps can be active simultaneously.

---

## File structure

```
ProfileSwap/
├── index.js        — Core patching logic
├── Settings.jsx    — Settings UI
└── manifest.json   — Vendetta plugin manifest
```

---

## Troubleshooting

**Swap not applying?**
- Make sure the plugin is enabled (global toggle at the top of Settings)
- Check that both IDs are valid 17–20 digit Discord snowflakes
- Try reloading Discord to re-fetch the profile cache

**"Failed to fetch target profile"?**
- The target ID may be invalid or the account may be deleted
- Ensure you have network access and are logged in

**Accessories not showing?**
- The target user must have an active avatar decoration or profile effect on their account
