import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  Share,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import client from "../api/client";
import { C, errorText } from "../theme";

export default function StaffScreen({ navigation }) {
  const [code, setCode] = useState("");
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [selected, setSelected] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([
        client.get("/auth/store-code"),
        client.get("/auth/staff"),
      ]);
      setCode(c.data.code);
      setStaff(s.data);
      setError("");
    } catch (err) {
      setError(errorText(err));
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  function shareCode() {
    Share.share({
      message: `Join our store on SarInventory. Register as a helper and use this store code: ${code}`,
    });
  }

  function openReset(helper) {
    setSelected(helper);
    setNewPassword("");
    setFormError("");
    setMessage("");
  }

  async function resetPassword() {
    if (newPassword.length < 6) {
      return setFormError("Password must be at least 6 characters");
    }
    try {
      setSaving(true);
      setFormError("");
      await client.put(`/auth/staff/${selected._id}/password`, { newPassword });
      setMessage(`Password reset for ${selected.name}. Tell them the new password.`);
      setSelected(null);
      setNewPassword("");
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Staff</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={C.green} />
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(h) => h._id}
          contentContainerStyle={{ padding: 20, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <View>
              {!!error && <Text style={styles.error}>{error}</Text>}
              {!!message && <Text style={styles.ok}>{message}</Text>}

              <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>Store code</Text>
                <Text style={styles.code}>{code || "..."}</Text>
                <Text style={styles.codeHint}>
                  Helpers enter this code when they register.
                </Text>
                <TouchableOpacity style={styles.shareBtn} onPress={shareCode} disabled={!code}>
                  <Text style={styles.shareText}>Share code</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.section}>Helpers</Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              No helpers yet. Share the store code above so they can register.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>@{item.username}</Text>
              </View>
              <TouchableOpacity onPress={() => openReset(item)}>
                <Text style={styles.reset}>Reset password</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Reset password</Text>
            <Text style={styles.dialogSub}>
              Set a temporary password for {selected?.name}. Tell it to them in person.
            </Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password (6+ characters)"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {!!formError && <Text style={styles.formError}>{formError}</Text>}

            <TouchableOpacity style={styles.saveBtn} onPress={resetPassword} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Reset password</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={() => setSelected(null)}>
              <Text style={{ color: C.muted }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  back: { color: C.green, fontSize: 16, fontWeight: "600", width: 60 },
  title: { fontSize: 20, fontWeight: "700", color: C.ink },
  error: {
    backgroundColor: C.redBg,
    color: C.red,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  ok: {
    backgroundColor: "#DDF1E8",
    color: C.green,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  codeCard: { backgroundColor: C.green, borderRadius: 18, padding: 22, marginBottom: 8 },
  codeLabel: { color: "#BFE3D8", fontSize: 15 },
  code: { color: "#fff", fontSize: 34, fontWeight: "700", letterSpacing: 4, marginVertical: 6 },
  codeHint: { color: "#BFE3D8", fontSize: 14 },
  shareBtn: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 14,
  },
  shareText: { color: C.green, fontWeight: "700" },
  section: { fontSize: 17, fontWeight: "700", color: C.ink, marginTop: 20, marginBottom: 10 },
  empty: { color: C.muted, fontSize: 15, textAlign: "center", marginTop: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: "700", color: C.ink },
  meta: { fontSize: 13, color: C.muted, marginTop: 2 },
  reset: { color: C.green, fontWeight: "600" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-start",
    paddingTop: 120,
    paddingHorizontal: 20,
  },
  dialog: { backgroundColor: C.card, borderRadius: 16, padding: 20 },
  dialogTitle: { fontSize: 18, fontWeight: "700", color: C.ink, marginBottom: 6 },
  dialogSub: { fontSize: 14, color: C.muted, marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  formError: { color: C.red, marginBottom: 10, fontSize: 14 },
  saveBtn: { backgroundColor: C.green, borderRadius: 12, padding: 14, alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  linkBtn: { padding: 12, alignItems: "center" },
});