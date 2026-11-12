import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import client from "../api/client";
import { C, errorText } from "../theme";

export default function CategoriesScreen({ navigation, route }) {
  const role = route?.params?.user?.role;
  const isOwner = !role || role === "owner";

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await client.get("/categories");
      setCategories(res.data);
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

  function openAdd() {
    setEditing(null);
    setName("");
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(c) {
    setEditing(c);
    setName(c.name);
    setFormError("");
    setModalOpen(true);
  }

  async function save() {
    if (!name.trim()) return setFormError("Enter a category name");
    try {
      setSaving(true);
      setFormError("");
      if (editing) await client.put(`/categories/${editing._id}`, { name: name.trim() });
      else await client.post("/categories", { name: name.trim() });
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Delete category", `Delete ${editing.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await client.delete(`/categories/${editing._id}`);
            setModalOpen(false);
            await load();
          } catch (err) {
            setFormError(errorText(err));
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        {isOwner ? (
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addText}>Add category</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 100 }} />
        )}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={C.green} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(c) => c._id}
          contentContainerStyle={{ padding: 20, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {isOwner
                ? "No categories yet. Tap Add category to create one."
                : "No categories yet."}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={isOwner ? 0.7 : 1}
              onPress={() => isOwner && openEdit(item)}
            >
              <Text style={styles.name}>{item.name}</Text>
              {isOwner && <Text style={styles.edit}>Edit</Text>}
            </TouchableOpacity>
          )}
        />
      )}

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>
              {editing ? "Rename category" : "Add category"}
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Category name"
              autoFocus
            />
            {!!formError && <Text style={styles.formError}>{formError}</Text>}

            <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Save category</Text>
              )}
            </TouchableOpacity>

            {editing && (
              <TouchableOpacity style={styles.linkBtn} onPress={confirmDelete}>
                <Text style={{ color: C.red, fontWeight: "600" }}>Delete category</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.linkBtn} onPress={() => setModalOpen(false)}>
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
  back: { color: C.green, fontSize: 16, fontWeight: "600", width: 100 },
  title: { fontSize: 20, fontWeight: "700", color: C.ink },
  addBtn: { backgroundColor: C.green, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  addText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  error: {
    backgroundColor: C.redBg,
    color: C.red,
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 8,
    fontSize: 14,
  },
  empty: { textAlign: "center", color: C.muted, marginTop: 40, fontSize: 15 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: "600", color: C.ink },
  edit: { color: C.green, fontWeight: "600" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-start",
    paddingTop: 120,
    paddingHorizontal: 20,
  },
  dialog: { backgroundColor: C.card, borderRadius: 16, padding: 20 },
  dialogTitle: { fontSize: 18, fontWeight: "700", color: C.ink, marginBottom: 14 },
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