import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import client from "../api/client";
import { C, money } from "../theme";

const FILTERS = [
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "All", value: "all" },
];

function formatWhen(iso) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

export default function SalesHistoryScreen({ navigation }) {
  const [period, setPeriod] = useState("today");
  const [data, setData] = useState({ sales: [], count: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (p) => {
    try {
      const res = await client.get("/sales", { params: { period: p } });
      setData(res.data);
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

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={C.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Sales history</Text>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.chip, period === f.value && styles.chipActive]}
            onPress={() => setPeriod(f.value)}
          >
            <Text style={[styles.chipText, period === f.value && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>
          {data.count} {data.count === 1 ? "sale" : "sales"}
        </Text>
        <Text style={styles.summaryValue}>{money(data.revenue)}</Text>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator size="large" color={C.green} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data.sales}
          keyExtractor={(s) => s._id}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.empty}>No sales yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text style={styles.sub}>
                  {item.quantity} × {money(item.unitPrice)}
                </Text>
                <Text style={styles.sub}>
                  {formatWhen(item.createdAt)}
                  {item.soldBy ? ` · ${item.soldBy.name}` : ""}
                </Text>
              </View>
              <Text style={styles.total}>{money(item.total)}</Text>
            </View>
          )}
        />
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
    paddingHorizontal: 14,
    marginRight: 8,
  },
  chipActive: { backgroundColor: C.green },
  chipText: { color: C.green, fontWeight: "600" },
  chipTextActive: { color: "#FFFFFF" },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.greenSoft,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  summaryLabel: { color: C.green, fontSize: 15, fontWeight: "600" },
  summaryValue: { color: C.green, fontSize: 20, fontWeight: "700" },
  error: {
    backgroundColor: C.redBg,
    color: C.red,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  empty: { textAlign: "center", color: C.muted, marginTop: 40, fontSize: 15 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  name: { fontSize: 16, fontWeight: "700", color: C.ink },
  sub: { fontSize: 13, color: C.muted, marginTop: 2 },
  total: { fontSize: 16, fontWeight: "700", color: C.ink },
});