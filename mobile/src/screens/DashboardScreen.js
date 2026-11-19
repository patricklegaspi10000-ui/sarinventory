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
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import client from "../api/client";
import { C, money } from "../theme";
import LiveClock from "../components/LiveClock";

const ACTIONS = [
  { label: "Products", hint: "View and edit items", screen: "Products", icon: "cube-outline" },
  { label: "Restock", hint: "Add new stock", screen: "Restock", icon: "add-circle-outline" },
  { label: "Sales history", hint: "Past sales and totals", screen: "SalesHistory", icon: "receipt-outline" },
  { label: "Categories", hint: "Organize items", screen: "Categories", icon: "pricetags-outline" },
  { label: "Reports", hint: "Sales and stock summary", screen: "Reports", icon: "bar-chart-outline", ownerOnly: true },
  { label: "Staff", hint: "Helpers and code", screen: "Staff", icon: "people-outline", ownerOnly: true },
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

  function confirmLogout() {
    Alert.alert("Log out", "Log out of SarInventory?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("token");
          navigation.replace("Login");
        },
      },
    ]);
  }

  const { salesToday, salesCount, productCount, lowStock } = summary;
  const name = route?.params?.user?.name ?? route?.params?.user?.username;
  const role = route?.params?.user?.role;
  const isOwner = !role || role === "owner";

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
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{name ? `Hi, ${name}` : "Welcome"}</Text>
          <LiveClock style={styles.date} />
        </View>
        <TouchableOpacity style={styles.logout} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={22} color={C.ink} />
        </TouchableOpacity>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{isOwner ? "Owner" : "Helper"}</Text>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Sales today</Text>
        <Text style={styles.heroValue}>{money(salesToday)}</Text>
        <Text style={styles.heroSub}>
          {salesCount} {salesCount === 1 ? "sale" : "sales"} recorded
        </Text>
        <TouchableOpacity style={styles.cta} onPress={() => go("Sales")} activeOpacity={0.85}>
          <Ionicons name="cart-outline" size={20} color={C.green} />
          <Text style={styles.ctaText}>Record a sale</Text>
        </TouchableOpacity>
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
        {ACTIONS.filter((a) => !a.ownerOnly || isOwner).map((a) => (
          <TouchableOpacity
            key={a.screen}
            style={styles.action}
            activeOpacity={0.7}
            onPress={() => go(a.screen)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={a.icon} size={22} color={C.green} />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
            <Text style={styles.actionHint}>{a.hint}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg },
  top: { flexDirection: "row", alignItems: "center" },
  greeting: { fontSize: 24, fontWeight: "700", color: C.ink },
  date: { fontSize: 14, color: C.muted, marginTop: 2 },
  logout: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: C.greenSoft,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 16,
  },
  badgeText: { color: C.green, fontSize: 13, fontWeight: "700" },
  error: {
    backgroundColor: C.redBg,
    color: C.red,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  hero: { backgroundColor: C.green, borderRadius: 20, padding: 22, marginBottom: 12 },
  heroLabel: { color: "#BFE3D8", fontSize: 15 },
  heroValue: { color: "#FFFFFF", fontSize: 38, fontWeight: "700", marginTop: 4 },
  heroSub: { color: "#BFE3D8", fontSize: 14, marginTop: 4 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 18,
  },
  ctaText: { color: C.green, fontWeight: "700", fontSize: 16, marginLeft: 8 },
  row: { flexDirection: "row", marginBottom: 8 },
  tile: { flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 16 },
  tileWarn: { backgroundColor: C.warnBg },
  tileValue: { fontSize: 28, fontWeight: "700", color: C.ink },
  tileLabel: { fontSize: 14, color: C.muted, marginTop: 2 },
  section: { fontSize: 17, fontWeight: "700", color: C.ink, marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 6 },
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.greenSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionLabel: { fontSize: 16, fontWeight: "700", color: C.ink },
  actionHint: { fontSize: 13, color: C.muted, marginTop: 4 },
});