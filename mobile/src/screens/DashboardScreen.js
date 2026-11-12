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

const peso = (n) =>
  "₱" + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const ACTIONS = [
  { label: "Products", hint: "View and edit items", screen: "Products" },
  { label: "Record a sale", hint: "Log what was sold", screen: "Sales" },
  { label: "Restock", hint: "Add new stock", screen: "Restock" },
  { label: "Categories", hint: "Organize your items", screen: "Categories" },
];

export default function DashboardScreen({ navigation, route }) {
  const [summary, setSummary] = useState({
    salesToday: 0,
    salesCount: 0,
    productCount: 0,
    lowStock: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await client.get("/dashboard");
      setSummary(res.data);
      setError("");
    } catch (err) {
      const status = err.response?.status;
      setError(
        status
          ? `Request failed (${status}). ${err.response.data?.message ?? ""}`
          : "Can't reach the server. Pull down to try again."
      );
    }
  }, []);

    useEffect(() => {
    load().finally(() => setLoading(false));
    const unsubscribe = navigation.addListener("focus", load);
    return unsubscribe;
  }, [load, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const go = (screen) => {
    if (navigation.getState().routeNames.includes(screen)) {
            navigation.navigate(screen, { user: route?.params?.user });
    } else {
      Alert.alert("Not connected yet", `Add the ${screen} screen in App.js first.`);
    }
  };

  const { salesToday, salesCount, productCount, lowStock } = summary;
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
        <Text style={styles.heroValue}>{peso(salesToday)}</Text>
        <Text style={styles.heroSub}>
          {salesCount} {salesCount === 1 ? "sale" : "sales"} recorded
        </Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.tile, { marginRight: 6 }]}>
          <Text style={styles.tileValue}>{productCount}</Text>
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
            <View key={p.id ?? i} style={[styles.lowRow, i > 0 && styles.lowRowBorder]}>
              <Text style={styles.lowName} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={[styles.lowQty, p.quantity === 0 && { color: C.red }]}>
                {p.quantity === 0 ? "Out of stock" : `${p.quantity} left`}
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