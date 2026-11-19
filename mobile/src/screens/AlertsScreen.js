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
import { C } from "../theme";

function expiryText(iso) {
  const days = Math.ceil((new Date(iso) - new Date()) / (24 * 60 * 60 * 1000));
  if (days < 0) return `Expired ${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} ago`;
  if (days === 0) return "Expires today";
  return `Expires in ${days} ${days === 1 ? "day" : "days"}`;
}

export default function AlertsScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await client.get("/alerts");
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
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const lowCount = data ? data.lowStock.length : 0;
  const expCount = data ? data.expiring.length : 0;

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={C.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Alerts</Text>
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
            <View style={styles.summaryRow}>
              <View style={[styles.summary, { marginRight: 6 }, lowCount > 0 && styles.summaryWarn]}>
                <Text style={[styles.summaryValue, lowCount > 0 && { color: C.warnText }]}>
                  {lowCount}
                </Text>
                <Text style={styles.summaryLabel}>Low on stock</Text>
              </View>
              <View style={[styles.summary, { marginLeft: 6 }, expCount > 0 && styles.summaryWarn]}>
                <Text style={[styles.summaryValue, expCount > 0 && { color: C.warnText }]}>
                  {expCount}
                </Text>
                <Text style={styles.summaryLabel}>Near expiry</Text>
              </View>
            </View>

            <Text style={styles.section}>Low on stock</Text>
            <View style={styles.card}>
              {data.lowStock.length === 0 ? (
                <Text style={styles.muted}>Everything is well stocked.</Text>
              ) : (
                data.lowStock.map((p, i) => (
                  <View key={p.id} style={[styles.row, i > 0 && styles.rowBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={styles.sub}>Alert level: {p.level}</Text>
                    </View>
                    <Text style={[styles.warn, p.quantity === 0 && { color: C.red }]}>
                      {p.quantity === 0 ? "Out of stock" : `${p.quantity} left`}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <Text style={styles.section}>Near expiry</Text>
            <View style={styles.card}>
              {data.expiring.length === 0 ? (
                <Text style={styles.muted}>
                  Nothing expires in the next {data.settings.expiryAlertDays} days.
                </Text>
              ) : (
                data.expiring.map((p, i) => (
                  <View key={p.id} style={[styles.row, i > 0 && styles.rowBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={styles.sub}>{p.quantity} in stock</Text>
                    </View>
                    <Text style={[styles.warn, p.expired && { color: C.red }]}>
                      {expiryText(p.expiryDate)}
                    </Text>
                  </View>
                ))
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
  error: {
    backgroundColor: C.redBg,
    color: C.red,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  summaryRow: { flexDirection: "row" },
  summary: { flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 16 },
  summaryWarn: { backgroundColor: C.warnBg },
  summaryValue: { fontSize: 28, fontWeight: "700", color: C.ink },
  summaryLabel: { fontSize: 14, color: C.muted, marginTop: 2 },
  section: { fontSize: 17, fontWeight: "700", color: C.ink, marginTop: 22, marginBottom: 10 },
  card: { backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4 },
  muted: { color: C.muted, fontSize: 15, paddingVertical: 12 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: C.line },
  name: { fontSize: 15, fontWeight: "600", color: C.ink },
  sub: { fontSize: 13, color: C.muted, marginTop: 2 },
  warn: { fontSize: 14, fontWeight: "600", color: C.warnText, marginLeft: 12 },
});