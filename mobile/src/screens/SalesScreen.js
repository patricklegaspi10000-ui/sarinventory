import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import client from "../api/client";
import { C, money, errorText } from "../theme";

export default function SalesScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [qtyText, setQtyText] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await client.get("/products", {
        params: { search: search.trim() || undefined },
      });
      setProducts(res.data);
    } catch (err) {
      setMessage({ type: "error", text: errorText(err) });
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => load().finally(() => setLoading(false)), 300);
    return () => clearTimeout(t);
  }, [load]);

  function pick(p) {
    setSelected(p);
    setQtyText("1");
    setMessage(null);
  }

  function step(delta) {
    const next = Math.max(1, (parseInt(qtyText, 10) || 1) + delta);
    setQtyText(String(next));
  }

  async function record() {
    const qty = Number(qtyText);
    if (!Number.isInteger(qty) || qty < 1) {
      return setMessage({ type: "error", text: "Enter a valid quantity" });
    }
    try {
      setSubmitting(true);
      setMessage(null);
      const res = await client.post("/sales", {
        productId: selected._id,
        quantity: qty,
      });
      const { remaining, lowStock } = res.data;
      setMessage({
        type: lowStock ? "warn" : "ok",
        text: `Sold ${qty} x ${selected.name} for ${money(qty * selected.price)}. ${remaining} left.${
          lowStock ? " Running low, time to restock." : ""
        }`,
      });
      setSelected(null);
      setQtyText("1");
      await load();
    } catch (err) {
      setMessage({ type: "error", text: errorText(err) });
    } finally {
      setSubmitting(false);
    }
  }

  const qty = parseInt(qtyText, 10) || 0;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Record a sale</Text>
        <View style={{ width: 60 }} />
      </View>

      {message && (
        <Text
          style={[
            styles.banner,
            message.type === "ok" && styles.bannerOk,
            message.type === "warn" && styles.bannerWarn,
            message.type === "error" && styles.bannerError,
          ]}
        >
          {message.text}
        </Text>
      )}

      <TextInput
        style={styles.search}
        placeholder="Search for the product sold"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={C.green} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p._id}
          contentContainerStyle={{ padding: 20, paddingTop: 12 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.empty}>
              {search ? "No products match." : "No products yet. Add one in Products first."}
            </Text>
          }
          renderItem={({ item }) => {
            const out = item.quantity === 0;
            const active = selected?._id === item._id;
            return (
              <TouchableOpacity
                style={[styles.row, active && styles.rowActive, out && { opacity: 0.5 }]}
                disabled={out}
                onPress={() => pick(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>{money(item.price)} each</Text>
                </View>
                <Text style={[styles.stock, out && { color: C.red }]}>
                  {out ? "Out of stock" : `${item.quantity} left`}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {selected && (
        <View style={styles.panel}>
          <Text style={styles.panelName}>{selected.name}</Text>
          <View style={styles.stepRow}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => step(-1)}>
              <Text style={styles.stepText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.qtyInput}
              value={qtyText}
              onChangeText={setQtyText}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.stepBtn} onPress={() => step(1)}>
              <Text style={styles.stepText}>+</Text>
            </TouchableOpacity>
            <Text style={styles.total}>{money(qty * selected.price)}</Text>
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={record} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Record sale</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  banner: { marginHorizontal: 20, marginBottom: 10, padding: 12, borderRadius: 10, fontSize: 14 },
  bannerOk: { backgroundColor: "#DDF1E8", color: C.green },
  bannerWarn: { backgroundColor: C.warnBg, color: C.warnText },
  bannerError: { backgroundColor: C.redBg, color: C.red },
  search: {
    backgroundColor: C.card,
    borderRadius: 12,
    marginHorizontal: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  empty: { textAlign: "center", color: C.muted, marginTop: 40, fontSize: 15 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  rowActive: { borderColor: C.green },
  name: { fontSize: 16, fontWeight: "700", color: C.ink },
  meta: { fontSize: 13, color: C.muted, marginTop: 2 },
  stock: { fontSize: 14, fontWeight: "600", color: C.muted, marginLeft: 12 },
  panel: {
    backgroundColor: C.card,
    padding: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: C.line,
  },
  panelName: { fontSize: 17, fontWeight: "700", color: C.ink, marginBottom: 12 },
  stepRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { fontSize: 22, fontWeight: "700", color: C.ink },
  qtyInput: {
    width: 70,
    height: 44,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  total: { flex: 1, textAlign: "right", fontSize: 22, fontWeight: "700", color: C.green },
  saveBtn: { backgroundColor: C.green, borderRadius: 12, padding: 14, alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});