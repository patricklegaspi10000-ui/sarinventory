import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import client from "../api/client";

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
    <View style={styles.container}>
      <Text style={styles.title}>SarInventory</Text>

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter username"
        autoCapitalize="none"
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

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 30 },
  label: { marginBottom: 6, fontSize: 13 },
  input: {
    borderWidth: 1, borderColor: "#999", borderRadius: 6,
    padding: 10, marginBottom: 16,
  },
  button: {
    backgroundColor: "#2e7d32", padding: 14,
    borderRadius: 6, alignItems: "center", marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  error: { color: "red", textAlign: "center", marginTop: 16 },
});