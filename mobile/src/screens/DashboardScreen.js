import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import client from "../api/client";

// Change these if your backend routes are named differently.
const ENDPOINTS = { products: "/products", sales: "/sales" };
// An item counts as "low" at or below this many units.
const LOW_STOCK_LEVEL = 5;

const toList = (data) =>
  Array.isArray(data)
    ? data
    : data?.products ?? data?.sales ?? data?.data ?? [];

// Adjust the field names below to match your models.
const stockOf = (p) => Number(p.stock ?? p.quantity ?? 0);
const saleTotal = (s) =>
  Number(s.total ?? s.totalAmount ?? s.amount ?? (s.price ?? 0) * (s.quantity ?? 1));
const isToday = (value) =>
  !!value && new Date(value).toDateString() === new Date().toDateString();
const peso = (n) =>
  "₱" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const ACTIONS = [
  { label: "Products", hint: "View and edit items", screen: "Products" },
  { label: "Record a sale", hint: "Log what was sold", screen: "Sales" },
  { label: "Restock", hint: "Add new stock", screen: "Restock" },
  { label: "Categories", hint: "Organize your items", screen: "Categories" },
];

export default function DashboardScreen({ navigation, route }) {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [p, s] = await Promise.allSettled([
      client.get(ENDPOINTS.products),
      client.get(ENDPOINTS.sales),
    ]);
    if (p.status === "fulfilled") setProducts(toList(p.value.data));
    if (s.status === "fulfilled") setSales(toList(s.value.data));
    setError(
      p.status === "rejected" && s.status === "rejected"
        ? "Can't reach the server. Pull down to try again."
        : ""
    );
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const go = (screen) => {
    if (navigation.getState().routeNames.includes(screen)) {
      navigation.navigate(screen);
    } else {
      Alert.alert("Not connected yet", `Add the ${screen} screen in App.js first.`);
    }
  };

  const todaySales = sales.filter((s) => isToday(s.createdAt ?? s.date));
  const todayTotal = todaySales.reduce((sum, s) => sum + saleTotal(s), 0);
  const lowStock = products
    .filter((p) => stockOf(p) <= LOW_STOCK_LEVEL)
    .sort((a, b) => stockOf(a) - stockOf(b));

  const name = route?.params?.user?.name ?? route?.params?.user?.username;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.green} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.greeting}>{name ? `Welcome, ${name}` : "Welcome"}</Text>
      <Text style={styles.date}>
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </Text>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Sales today</Text>
        <Text style={styles.heroValue}>{peso(todayTotal)}</Text>
        <Text style={styles.heroSub}>
          {todaySales.length} {todaySales.length === 1 ? "sale" : "sales"} recorded
        </Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.tile, { marginRight: 6 }]}>
          <Text style={styles.tileValue}>{products.length}</Text>
          <Text style={styles.tileLabel}>Products</Text>
        </View>
        <View
          style={[
            styles.tile,
            { marginLeft: 6 },
            lowStock.length > 0 && styles.tileWarn,
          ]}
        >
          <Text style={[styles.tileValue, lowStock.length > 0 && { color: C.warnText }]}>
            {lowStock.length}
          </Text>
          <Text style={styles.tileLabel}>Low on stock</Text>
        </View>
      </View>

      <Text style={styles.section}>Running low</Text>
      <View style={styles.card}>
        {lowStock.length === 0 ? (
          <Text style={styles.muted}>Everything is well stocked.</Text>
        ) : (
          lowStock.slice(0, 5).map((p, i) => (
            <View
              key={p._id ?? p.id ?? i}
              style={[styles.lowRow, i > 0 && styles.lowRowBorder]}
            >
              <Text style={styles.lowName} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={[styles.lowQty, stockOf(p) === 0 && { color: C.red }]}>
                {stockOf(p) === 0 ? "Out of stock" : `${stockOf(p)} left`}
              </Text>
            </View>
          ))
        )}
        {lowStock.length > 5 && (
          <Text style={styles.more}>and {lowStock.length - 5} more</Text>
        )}
      </View>

      <Text style={styles.section}>Quick actions</Text>
      <View style={styles.grid}>
        {ACTIONS.map((a) => (
          <TouchableOpacity
            key={a.screen}
            style={styles.action}
            activeOpacity={0.7}
            onPress={() => go(a.screen)}
          >
            <Text style={styles.actionLabel}>{a.label}</Text>
            <Text style={styles.actionHint}>{a.hint}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const C = {
  bg: "#F2F5F3",
  card: "#FFFFFF",
  ink: "#16231D",
  muted: "#66756D",
  line: "#E1E8E4",
  green: "#0F5C4D",
  warnBg: "#FFF4DE",
  warnText: "#9A5B00",
  red: "#B3372A",
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg },
  greeting: { fontSize: 24, fontWeight: "700", color: C.ink },
  date: { fontSize: 14, color: C.muted, marginTop: 2, marginBottom: 16 },
  error: {
    backgroundColor: "#FBE7E4",
    color: C.red,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  hero: { backgroundColor: C.green, borderRadius: 18, padding: 22, marginBottom: 12 },
  heroLabel: { color: "#BFE3D8", fontSize: 15 },
  heroValue: { color: "#FFFFFF", fontSize: 38, fontWeight: "700", marginTop: 4 },
  heroSub: { color: "#BFE3D8", fontSize: 14, marginTop: 4 },
  row: { flexDirection: "row", marginBottom: 8 },
  tile: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 16 },
  tileWarn: { backgroundColor: C.warnBg },
  tileValue: { fontSize: 28, fontWeight: "700", color: C.ink },
  tileLabel: { fontSize: 14, color: C.muted, marginTop: 2 },
  section: { fontSize: 17, fontWeight: "700", color: C.ink, marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 6 },
  muted: { color: C.muted, fontSize: 15, paddingVertical: 12 },
  lowRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 },
  lowRowBorder: { borderTopWidth: 1, borderTopColor: C.line },
  lowName: { flex: 1, fontSize: 15, color: C.ink, marginRight: 12 },
  lowQty: { fontSize: 15, fontWeight: "600", color: C.warnText },
  more: { color: C.muted, fontSize: 14, paddingVertical: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  action: {
    width: "48%",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  actionLabel: { fontSize: 16, fontWeight: "700", color: C.ink },
  actionHint: { fontSize: 13, color: C.muted, marginTop: 4 },
});