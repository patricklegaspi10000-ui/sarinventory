import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import client from "../api/client";
import { C, money, errorText } from "../theme";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "low", label: "Low stock" },
  { key: "expiring", label: "Expiring soon" },
];

const EMPTY = {
  name: "",
  barcode: "",
  price: "",
  quantity: "",
  lowStockLevel: "",
  expiryDate: "",
};

export default function ProductsScreen({ navigation, route }) {
  const role = route?.params?.user?.role;
  const isOwner = !role || role === "owner";

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await client.get("/products", {
        params: {
          search: search.trim() || undefined,
          filter: filter === "all" ? undefined : filter,
        },
      });
      setProducts(res.data);
      setError("");
    } catch (err) {
      setError(errorText(err));
    }
  }, [search, filter]);

  useEffect(() => {
    const t = setTimeout(() => load().finally(() => setLoading(false)), 300);
    return () => clearTimeout(t);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const setField = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  function openAdd() {
    setEditing(null);
    setForm(EMPTY);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      name: p.name,
      barcode: p.barcode ?? "",
      price: String(p.price),
      quantity: String(p.quantity),
      lowStockLevel: p.lowStockLevel != null ? String(p.lowStockLevel) : "",
      expiryDate: p.expiryDate ? p.expiryDate.slice(0, 10) : "",
    });
    setFormError("");
    setModalOpen(true);
  }

  async function save() {
    setFormError("");
    if (!form.name.trim()) return setFormError("Enter the product name");
    if (form.price.trim() === "" || isNaN(form.price))
      return setFormError("Enter a valid price");
    if (form.quantity.trim() !== "" && isNaN(form.quantity))
      return setFormError("Enter a valid quantity");
    if (form.lowStockLevel.trim() !== "" && isNaN(form.lowStockLevel))
      return setFormError("Enter a valid low stock level");
    if (
      form.expiryDate.trim() !== "" &&
      !/^\d{4}-\d{2}-\d{2}$/.test(form.expiryDate.trim())
    )
      return setFormError("Use the date format YYYY-MM-DD");

    const body = {
      name: form.name.trim(),
      barcode: form.barcode.trim(),
      price: Number(form.price),
      quantity: form.quantity.trim() === "" ? 0 : Number(form.quantity),
      lowStockLevel:
        form.lowStockLevel.trim() === "" ? "" : Number(form.lowStockLevel),
      expiryDate: form.expiryDate.trim(),
    };

    try {
      setSaving(true);
      if (editing) await client.put(`/products/${editing._id}`, body);
      else await client.post("/products", body);
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Delete product", `Delete ${editing.name}? This can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await client.delete(`/products/${editing._id}`);
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
        <Text style={styles.title}>Products</Text>
        {isOwner ? (
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addText}>Add product</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 90 }} />
        )}
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search products"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      <View style={styles.chips}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && { color: "#fff" }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={C.green} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p._id}
          contentContainerStyle={{ padding: 20, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {search || filter !== "all"
                ? "No products match."
                : isOwner
                ? "No products yet. Tap Add product to create one."
                : "No products yet."}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={isOwner ? 0.7 : 1}
              onPress={() => isOwner && openEdit(item)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{money(item.price)}</Text>
                {item.categoryId?.name ? (
                  <Text style={styles.meta}>{item.categoryId.name}</Text>
                ) : null}
                {item.expiryDate ? (
                  <Text style={styles.meta}>
                    Expires {item.expiryDate.slice(0, 10)}
                  </Text>
                ) : null}
              </View>
              <View style={styles.qtyBox}>
                <Text style={[styles.qty, item.quantity === 0 && { color: C.red }]}>
                  {item.quantity}
                </Text>
                <Text style={styles.meta}>
                  {item.quantity === 0 ? "out of stock" : "in stock"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <ScrollView
          style={styles.modal}
          contentContainerStyle={{ padding: 20, paddingTop: 56 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.modalTitle}>{editing ? "Edit product" : "Add product"}</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={setField("name")} />

          <Text style={styles.label}>Price</Text>
          <TextInput
            style={styles.input}
            value={form.price}
            onChangeText={setField("price")}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Quantity in stock</Text>
          <TextInput
            style={styles.input}
            value={form.quantity}
            onChangeText={setField("quantity")}
            keyboardType="number-pad"
            placeholder="0"
          />

          <Text style={styles.label}>Barcode (optional)</Text>
          <TextInput
            style={styles.input}
            value={form.barcode}
            onChangeText={setField("barcode")}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Low stock level (optional)</Text>
          <TextInput
            style={styles.input}
            value={form.lowStockLevel}
            onChangeText={setField("lowStockLevel")}
            keyboardType="number-pad"
            placeholder="Uses the store default if empty"
          />

          <Text style={styles.label}>Expiry date (optional)</Text>
          <TextInput
            style={styles.input}
            value={form.expiryDate}
            onChangeText={setField("expiryDate")}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
          />

          {!!formError && <Text style={styles.error}>{formError}</Text>}

          <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Save product</Text>
            )}
          </TouchableOpacity>

          {editing && (
            <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
              <Text style={styles.deleteText}>Delete product</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
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
  back: { color: C.green, fontSize: 16, fontWeight: "600", width: 90 },
  title: { fontSize: 20, fontWeight: "700", color: C.ink },
  addBtn: { backgroundColor: C.green, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  addText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  search: {
    backgroundColor: C.card,
    borderRadius: 12,
    marginHorizontal: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  chips: { flexDirection: "row", paddingHorizontal: 20, paddingVertical: 12 },
  chip: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    marginRight: 8,
  },
  chipActive: { backgroundColor: C.green, borderColor: C.green },
  chipText: { color: C.ink, fontSize: 14 },
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
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: "700", color: C.ink },
  meta: { fontSize: 13, color: C.muted, marginTop: 2 },
  qtyBox: { alignItems: "flex-end", justifyContent: "center", marginLeft: 12 },
  qty: { fontSize: 22, fontWeight: "700", color: C.ink },
  modal: { flex: 1, backgroundColor: C.bg },
  modalTitle: { fontSize: 22, fontWeight: "700", color: C.ink, marginBottom: 20 },
  label: { fontSize: 13, color: C.muted, marginBottom: 6 },
  input: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  saveBtn: { backgroundColor: C.green, borderRadius: 12, padding: 14, alignItems: "center", marginTop: 4 },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  deleteBtn: { padding: 14, alignItems: "center", marginTop: 8 },
  deleteText: { color: C.red, fontWeight: "600", fontSize: 15 },
  cancelBtn: { padding: 14, alignItems: "center" },
  cancelText: { color: C.muted, fontSize: 15 },
});