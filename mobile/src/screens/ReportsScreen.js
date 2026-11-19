import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import client from "../api/client";
import { C, money } from "../theme";

const PERIODS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
];

function fmtDay(id) {
  return new Date(id + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReportsScreen({ navigation }) {
  const [period, setPeriod] = useState("daily");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (p) => {
    try {
      const res = await client.get("/reports", { params: { period: p } });
      setData(res.data);
      setError("");
    } catch (err) {
      const status = err.response?.status;
      setError(
        status === 403
          ? "Only the store owner can view reports."
          : status
          ? `Request failed (${status}). ${err.response.data?.message ?? ""}`
          : "Can't reach the server. Pull down to try again."
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(period).finally(() => setLoading(false));
    }, [load, period])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load(period);
    setRefreshing(false);
  };

  const inv = data?.inventory;

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={C.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Reports</Text>
      </View>

      <View style={styles.filters}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[styles.chip, period === p.value && styles.chipActive]}
            onPress={() => setPeriod(p.value)}
          >
            <Text style={[styles.chipText, period === p.value && styles.chipTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator size="large" color={C.green} style={{ marginTop: 40 }} />
      ) : (
        data && (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>
                {period === "daily" ? "Sales today" : "Sales, last 7 days"}
              </Text>
              <Text style={styles.heroValue}>{money(data.sales.revenue)}</Text>
              <Text style={styles.heroSub}>
                {data.sales.count} {data.sales.count === 1 ? "sale" : "sales"} ·{" "}
                {data.sales.units} {data.sales.units === 1 ? "item" : "items"} sold
              </Text>
            </View>

            <Text style={styles.section}>Best sellers</Text>
            <View style={styles.card}>
              {data.bestSellers.length === 0 ? (
                <Text style={styles.muted}>No sales in this period.</Text>
              ) : (
                data.bestSellers.map((b, i) => (
                  <View key={b.id} style={[styles.row, i > 0 && styles.rowBorder]}>
                    <Text style={styles.rank}>{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name} numberOfLines={1}>
                        {b.name}
                      </Text>
                      <Text style={styles.sub}>{b.units} sold</Text>
                    </View>
                    <Text style={styles.amount}>{money(b.revenue)}</Text>
                  </View>
                ))
              )}
            </View>

            {period === "weekly" && (
              <>
                <Text style={styles.section}>Sales by day</Text>
                <View style={styles.card}>
                  {data.byDay.length === 0 ? (
                    <Text style={styles.muted}>No sales in this period.</Text>
                  ) : (
                    data.byDay.map((d, i) => (
                      <View key={d.date} style={[styles.row, i > 0 && styles.rowBorder]}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.name}>{fmtDay(d.date)}</Text>
                          <Text style={styles.sub}>
                            {d.count} {d.count === 1 ? "sale" : "sales"}
                          </Text>
                        </View>
                        <Text style={styles.amount}>{money(d.revenue)}</Text>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}

            <Text style={styles.section}>Inventory</Text>
            <View style={styles.tiles}>
              <View style={[styles.tile, { marginRight: 6 }]}>
                <Text style={styles.tileValue}>{inv.productCount}</Text>
                <Text style={styles.tileLabel}>Products</Text>
              </View>
              <View style={[styles.tile, { marginLeft: 6 }]}>
                <Text style={styles.tileValue}>{inv.totalUnits}</Text>
                <Text style={styles.tileLabel}>Units in stock</Text>
              </View>
            </View>
            <View style={styles.valueCard}>
              <Text style={styles.valueLabel}>Stock value (at selling price)</Text>
              <Text style={styles.valueAmount}>{money(inv.stockValue)}</Text>
            </View>

            <Text style={styles.section}>Low on stock</Text>
            <View style={styles.card}>
              {inv.lowStock.length === 0 ? (
                <Text style={styles.muted}>Everything is well stocked.</Text>
              ) : (
                inv.lowStock.map((p, i) => (
                  <View key={p.id} style={[styles.row, i > 0 && styles.rowBorder]}>
                    <Text style={[styles.name, { flex: 1 }]} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={[styles.warn, p.quantity === 0 && { color: C.red }]}>
                      {p.quantity === 0 ? "Out of stock" : `${p.quantity} left`}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <Text style={styles.section}>Expiring or expired</Text>
            <View style={styles.card}>
              {inv.expiring.length === 0 ? (
                <Text style={styles.muted}>Nothing is close to expiry.</Text>
              ) : (
                inv.expiring.map((p, i) => {
                  const expired = new Date(p.expiryDate) < new Date();
                  return (
                    <View key={p.id} style={[styles.row, i > 0 && styles.rowBorder]}>
                      <Text style={[styles.name, { flex: 1 }]} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={[styles.warn, expired && { color: C.red }]}>
                        {expired ? "Expired " : ""}
                        {fmtDate(p.expiryDate)}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 20, paddingTop: 56 },
  top: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: { fontSize: 24, fontWeight: "700", color: C.ink },
  filters: { flexDirection: "row", marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: C.green,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  chipActive: { backgroundColor: C.green },
  chipText: { color: C.green, fontWeight: "600" },
  chipTextActive: { color: "#FFFFFF" },
  error: {
    backgroundColor: C.redBg,
    color: C.red,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  hero: { backgroundColor: C.green, borderRadius: 20, padding: 22 },
  heroLabel: { color: "#BFE3D8", fontSize: 15 },
  heroValue: { color: "#FFFFFF", fontSize: 36, fontWeight: "700", marginTop: 4 },
  heroSub: { color: "#BFE3D8", fontSize: 14, marginTop: 4 },
  section: { fontSize: 17, fontWeight: "700", color: C.ink, marginTop: 22, marginBottom: 10 },
  card: { backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4 },
  muted: { color: C.muted, fontSize: 15, paddingVertical: 12 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: C.line },
  rank: { width: 26, fontSize: 16, fontWeight: "700", color: C.green },
  name: { fontSize: 15, fontWeight: "600", color: C.ink },
  sub: { fontSize: 13, color: C.muted, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: "700", color: C.ink },
  warn: { fontSize: 14, fontWeight: "600", color: C.warnText, marginLeft: 12 },
  tiles: { flexDirection: "row" },
  tile: { flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 16 },
  tileValue: { fontSize: 26, fontWeight: "700", color: C.ink },
  tileLabel: { fontSize: 14, color: C.muted, marginTop: 2 },
  valueCard: {
    backgroundColor: C.greenSoft,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  valueLabel: { color: C.green, fontSize: 14 },
  valueAmount: { color: C.green, fontSize: 24, fontWeight: "700", marginTop: 4 },
});