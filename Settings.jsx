import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { showToast } from "@vendetta/ui/toasts";
import { Forms, General } from "@vendetta/ui/components";
import plugin from "./index";

const { FormSection, FormRow, FormInput, FormSwitch, FormDivider, FormText } = Forms;
const { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } = RN;

const { useState, useEffect, useCallback } = React;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    card: {
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    cardTitle: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
    },
    cardSubtitle: {
        color: "#B5BAC1",
        fontSize: 12,
        marginBottom: 10,
    },
    input: {
        backgroundColor: "rgba(0,0,0,0.3)",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
        color: "#fff",
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        marginBottom: 8,
        fontFamily: "monospace",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 4,
    },
    rowLabel: {
        color: "#B5BAC1",
        fontSize: 13,
    },
    btn: {
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    btnPrimary: {
        backgroundColor: "#5865F2",
    },
    btnDanger: {
        backgroundColor: "rgba(237,66,69,0.2)",
        borderWidth: 1,
        borderColor: "#ED4245",
    },
    btnText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 13,
    },
    btnDangerText: {
        color: "#ED4245",
        fontWeight: "600",
        fontSize: 13,
    },
    addCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: "rgba(88,101,242,0.1)",
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(88,101,242,0.4)",
    },
    addTitle: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
        marginBottom: 4,
    },
    hint: {
        color: "#72767D",
        fontSize: 11,
        marginTop: 2,
    },
    sectionHeader: {
        color: "#B5BAC1",
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 32,
        opacity: 0.5,
    },
    emptyText: {
        color: "#B5BAC1",
        fontSize: 14,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        fontSize: 11,
        fontWeight: "700",
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 12,
        padding: 14,
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    toggleLabel: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    toggleSub: {
        color: "#72767D",
        fontSize: 12,
        marginTop: 2,
    },
});

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
function Switch({ value, onValueChange }) {
    return (
        <RN.Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: "#4E5058", true: "#5865F2" }}
            thumbColor="#fff"
        />
    );
}

// ─── Single swap card ──────────────────────────────────────────────────────────
function SwapCard({ sourceId, swap, onUpdate, onDelete }) {
    const [editing, setEditing] = useState(false);
    const [localTarget, setLocalTarget] = useState(swap.targetId ?? "");
    const [localAlias, setLocalAlias] = useState(swap.alias ?? "");
    const [fetching, setFetching] = useState(false);

    const opts = ["replaceAvatar", "replaceBanner", "replaceDecorations", "replaceAccentColor", "replaceBio"];
    const labels = {
        replaceAvatar: "Avatar",
        replaceBanner: "Banner",
        replaceDecorations: "Accessories & effects",
        replaceAccentColor: "Accent color",
        replaceBio: "Bio",
    };

    const handleSave = useCallback(async () => {
        if (!localTarget.match(/^\d{17,20}$/)) {
            showToast("Target ID must be a valid Discord snowflake (17–20 digits)");
            return;
        }
        setFetching(true);
        try {
            await plugin._fetchAndCache(localTarget);
            onUpdate({ ...swap, targetId: localTarget, alias: localAlias });
            setEditing(false);
            showToast("Swap saved & profile cached!");
        } catch (e) {
            showToast("Failed to fetch target profile. Check the ID.");
        } finally {
            setFetching(false);
        }
    }, [localTarget, localAlias, swap]);

    const cached = plugin._profileCache[swap.targetId];
    const targetName = cached?.user?.global_name ?? cached?.user?.username ?? swap.targetId ?? "—";

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardTitle}>
                        {swap.alias ? swap.alias : `Source: ${sourceId}`}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                        → {swap.targetId ? `${targetName} (${swap.targetId})` : "No target set"}
                    </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 10 }]}
                        onPress={() => setEditing(!editing)}
                    >
                        <Text style={[styles.btnText, { fontSize: 12 }]}>{editing ? "Cancel" : "Edit"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btn, styles.btnDanger, { paddingHorizontal: 10 }]}
                        onPress={() => {
                            Alert.alert("Remove swap", `Remove swap for ${sourceId}?`, [
                                { text: "Cancel", style: "cancel" },
                                { text: "Remove", style: "destructive", onPress: onDelete },
                            ]);
                        }}
                    >
                        <Text style={[styles.btnDangerText, { fontSize: 12 }]}>Remove</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {editing && (
                <View>
                    <Text style={[styles.hint, { marginBottom: 6, color: "#B5BAC1" }]}>Target Discord ID</Text>
                    <TextInput
                        style={styles.input}
                        value={localTarget}
                        onChangeText={setLocalTarget}
                        placeholder="Target user ID (e.g. 298454268287369217)"
                        placeholderTextColor="#72767D"
                        keyboardType="numeric"
                        maxLength={20}
                    />
                    <Text style={[styles.hint, { marginBottom: 6, color: "#B5BAC1" }]}>Label (optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={localAlias}
                        onChangeText={setLocalAlias}
                        placeholder="Friendly name for this swap"
                        placeholderTextColor="#72767D"
                    />

                    <Text style={[styles.sectionHeader, { marginHorizontal: 0, marginTop: 10, marginBottom: 6 }]}>
                        Replace
                    </Text>
                    {opts.map((opt) => (
                        <View key={opt} style={styles.row}>
                            <Text style={styles.rowLabel}>{labels[opt]}</Text>
                            <Switch
                                value={swap[opt] ?? true}
                                onValueChange={(v) => onUpdate({ ...swap, [opt]: v })}
                            />
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[styles.btn, styles.btnPrimary, { marginTop: 12 }]}
                        onPress={handleSave}
                        disabled={fetching}
                    >
                        <Text style={styles.btnText}>{fetching ? "Fetching profile…" : "Save swap"}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!editing && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {opts.filter((o) => swap[o] !== false).map((o) => (
                        <View
                            key={o}
                            style={{
                                backgroundColor: "rgba(88,101,242,0.2)",
                                borderRadius: 6,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderWidth: 1,
                                borderColor: "rgba(88,101,242,0.4)",
                            }}
                        >
                            <Text style={{ color: "#949CF7", fontSize: 11, fontWeight: "600" }}>
                                {labels[o]}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

// ─── Add new swap form ─────────────────────────────────────────────────────────
function AddSwapForm({ onAdd }) {
    const [sourceId, setSourceId] = useState("");
    const [expanded, setExpanded] = useState(false);

    const handleAdd = () => {
        if (!sourceId.match(/^\d{17,20}$/)) {
            showToast("Source ID must be a valid Discord snowflake (17–20 digits)");
            return;
        }
        if (storage.swaps[sourceId]) {
            showToast("A swap for this ID already exists");
            return;
        }
        onAdd(sourceId, {
            targetId: "",
            alias: "",
            replaceAvatar: true,
            replaceBanner: true,
            replaceDecorations: true,
            replaceAccentColor: true,
            replaceBio: false,
        });
        setSourceId("");
        setExpanded(false);
        showToast("Swap added — tap Edit to set the target ID");
    };

    return (
        <View style={styles.addCard}>
            <TouchableOpacity onPress={() => setExpanded(!expanded)} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View>
                    <Text style={styles.addTitle}>+ Add new swap</Text>
                    <Text style={[styles.hint, { color: "#949CF7" }]}>Replace one user's profile with another's</Text>
                </View>
                <Text style={{ color: "#949CF7", fontSize: 20, lineHeight: 24 }}>{expanded ? "−" : "+"}</Text>
            </TouchableOpacity>

            {expanded && (
                <View style={{ marginTop: 12 }}>
                    <Text style={[styles.hint, { marginBottom: 6, color: "#B5BAC1" }]}>
                        Source Discord ID (the user you want to disguise)
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={sourceId}
                        onChangeText={setSourceId}
                        placeholder="Source user ID (e.g. 123456789012345678)"
                        placeholderTextColor="#72767D"
                        keyboardType="numeric"
                        maxLength={20}
                    />
                    <Text style={styles.hint}>
                        Tip: long-press a user in Discord → Copy ID (developer mode must be on)
                    </Text>
                    <TouchableOpacity
                        style={[styles.btn, styles.btnPrimary, { marginTop: 10 }]}
                        onPress={handleAdd}
                    >
                        <Text style={styles.btnText}>Add swap</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

// ─── Main Settings screen ──────────────────────────────────────────────────────
export default function Settings() {
    useProxy(storage);
    const [, forceUpdate] = useState(0);
    const refresh = () => forceUpdate((n) => n + 1);

    const swapEntries = Object.entries(storage.swaps ?? {});

    const handleAdd = (sourceId, defaults) => {
        storage.swaps[sourceId] = defaults;
        refresh();
    };

    const handleUpdate = (sourceId, updated) => {
        storage.swaps[sourceId] = updated;
        refresh();
    };

    const handleDelete = (sourceId) => {
        delete storage.swaps[sourceId];
        refresh();
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}>
            {/* Global enable toggle */}
            <View style={styles.toggleRow}>
                <View>
                    <Text style={styles.toggleLabel}>ProfileSwap enabled</Text>
                    <Text style={styles.toggleSub}>
                        {storage.enabled ? "Swaps are active" : "All swaps paused"}
                    </Text>
                </View>
                <Switch
                    value={storage.enabled ?? true}
                    onValueChange={(v) => {
                        storage.enabled = v;
                        refresh();
                    }}
                />
            </View>

            {/* Add new swap */}
            <AddSwapForm onAdd={handleAdd} />

            {/* Active swaps list */}
            <Text style={styles.sectionHeader}>
                Active swaps ({swapEntries.length})
            </Text>

            {swapEntries.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No swaps yet</Text>
                    <Text style={[styles.hint, { marginTop: 4 }]}>Add one above to get started</Text>
                </View>
            ) : (
                swapEntries.map(([sourceId, swap]) => (
                    <SwapCard
                        key={sourceId}
                        sourceId={sourceId}
                        swap={swap}
                        onUpdate={(updated) => handleUpdate(sourceId, updated)}
                        onDelete={() => handleDelete(sourceId)}
                    />
                ))
            )}

            {/* Cache info */}
            <Text style={[styles.hint, { textAlign: "center", marginTop: 16 }]}>
                {Object.keys(plugin._profileCache ?? {}).length} profile(s) cached this session
            </Text>
        </ScrollView>
    );
}
