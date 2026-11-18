import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import client from "../api/client";
import { C, errorText } from "../theme";

export default function RegisterScreen({ navigation }) {
  const [mode, setMode] = useState("helper");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [storeCode, setStoreCode] = useState("");
  const [storeName, setStoreName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    if (!name.trim() || !username.trim() || !password) {
      return setError("Fill in all fields");
    }
    if (mode === "helper" && !storeCode.trim()) {
      return setError("Enter the store code from your owner");
    }
    if (mode === "owner" && !storeName.trim()) {
      return setError("Enter your store name");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    try {
      setLoading(true);
      const res =
        mode === "helper"
          ? await client.post("/auth/register-helper", {
              name: name.trim(),
              username: username.trim(),
              password,
              storeCode: storeCode.trim(),
            })
          : await client.post("/auth/register", {
              storeName: storeName.trim(),
              ownerName: name.trim(),
              username: username.trim(),
              password,
            });
      await SecureStore.setItemAsync("token", res.data.token);
      navigation.replace("Dashboard", { user: res.data });
    } catch (err) {
      setError(errorText(err));
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
      <Text style={styles.title}>Create account</Text>

      <View style={styles.switchRow}>
        {[
          { key: "helper", label: "I'm a helper" },
          { key: "owner", label: "New store owner" },
        ].map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.switchBtn, mode === m.key && styles.switchActive]}
            onPress={() => {
              setMode(m.key);
              setError("");
            }}
          >
            <Text style={[styles.switchText, mode === m.key && { color: "#fff" }]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === "helper" ? (
        <>
          <Text style={styles.label}>Store code</Text>
          <TextInput
            style={styles.input}
            value={storeCode}
            onChangeText={setStoreCode}
            placeholder="Ask your store owner"
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Store name</Text>
          <TextInput
            style={styles.input}
            value={storeName}
            onChangeText={setStoreName}
            placeholder="Your store's name"
          />
        </>
      )}

      <Text style={styles.label}>Your name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="At least 6 characters"
      />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.link} onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Back to login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingTop: 70, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 24, color: C.ink },
  switchRow: { flexDirection: "row", marginBottom: 20 },
  switchBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
  },
  switchActive: { backgroundColor: C.green, borderColor: C.green },
  switchText: { color: C.ink, fontWeight: "600" },
  label: { marginBottom: 6, fontSize: 13, color: C.muted },
  input: {
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  error: { color: C.red, textAlign: "center", marginBottom: 12 },
  button: {
    backgroundColor: C.green,
    padding: 14,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  link: { padding: 16, alignItems: "center" },
  linkText: { color: C.green, fontWeight: "600" },
});