import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import client from "../api/client";
import { C } from "../theme";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    if (!username || !password) {
      setError("Fill in all fields");
      return;
    }
    try {
      setLoading(true);
      const res = await client.post("/auth/login", { username, password });
      await SecureStore.setItemAsync("token", res.data.token);
      navigation.replace("Dashboard", { user: res.data });
    } catch (err) {
      if (err.response) setError(err.response.data.message);
      else setError("The server is not responding");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.brand}>SarInventory</Text>
      <Text style={styles.subtitle}>Sign in to your store</Text>

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter username"
        autoCapitalize="none"
        autoCorrect={false}
        value={username}
        onChangeText={setUsername}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>No account yet? Register</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>
        Forgot your password? Ask your store owner to reset it.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { flexGrow: 1, justifyContent: "center", padding: 24 },
  brand: { fontSize: 32, fontWeight: "800", color: C.green, textAlign: "center" },
  subtitle: { fontSize: 15, color: C.muted, textAlign: "center", marginBottom: 32, marginTop: 4 },
  label: { marginBottom: 6, fontSize: 13, color: C.muted },
  input: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  error: {
    backgroundColor: C.redBg,
    color: C.red,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    backgroundColor: C.green,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { color: C.green, textAlign: "center", marginTop: 22, fontWeight: "600" },
  hint: { color: C.muted, textAlign: "center", marginTop: 12, fontSize: 13 },
});