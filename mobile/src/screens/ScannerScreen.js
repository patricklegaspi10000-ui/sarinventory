import { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../theme";

export default function ScannerScreen({ navigation, route }) {
  const returnTo = route.params?.returnTo;
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState(false);
  const [typed, setTyped] = useState("");
  const last = useRef({ code: "", time: 0 });
  const done = useRef(false);

  function finish(raw) {
    const value = String(raw || "").trim();
    if (!value || done.current) return;
    const now = Date.now();
    // ignore repeated reads of the same code for a short time
    if (last.current.code === value && now - last.current.time < 2000) return;
    last.current = { code: value, time: now };
    done.current = true;

    if (!returnTo) {
      navigation.goBack();
      return;
    }
    navigation.navigate({
      name: returnTo,
      params: { scannedCode: value, scannedAt: now },
      merge: true,
    });
  }

  const header = (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={22} color={C.ink} />
      </TouchableOpacity>
      <Text style={styles.title}>Scan a code</Text>
    </View>
  );

  if (manual) {
    return (
      <View style={styles.plain}>
        {header}
        <Text style={styles.label}>Type the barcode number</Text>
        <TextInput
          style={styles.input}
          value={typed}
          onChangeText={setTyped}
          placeholder="e.g. 4901234567890"
          keyboardType="number-pad"
          autoFocus
        />
        <TouchableOpacity style={styles.primary} onPress={() => finish(typed)}>
          <Text style={styles.primaryText}>Use this code</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setManual(false)}>
          <Text style={styles.link}>Back to camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!permission) {
    return <View style={styles.plain}>{header}</View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.plain}>
        {header}
        <Text style={styles.heading}>Camera access is needed</Text>
        <Text style={styles.body}>
          SarInventory uses the camera only to read product barcodes and QR codes, so you
          don't have to type them.
        </Text>
        {permission.canAskAgain ? (
          <TouchableOpacity style={styles.primary} onPress={requestPermission}>
            <Text style={styles.primaryText}>Allow camera</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primary} onPress={() => Linking.openSettings()}>
            <Text style={styles.primaryText}>Open Settings</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setManual(true)}>
          <Text style={styles.link}>Enter manually</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.camera}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"],
        }}
        onBarcodeScanned={({ data }) => finish(data)}
      />
      <View style={styles.overlayTop}>{header}</View>
      <View style={styles.frameWrap} pointerEvents="none">
        <View style={styles.frame} />
        <Text style={styles.hint}>Point the camera at the barcode</Text>
      </View>
      <TouchableOpacity style={styles.manualBtn} onPress={() => setManual(true)}>
        <Text style={styles.manualText}>Enter manually</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  plain: { flex: 1, backgroundColor: C.bg, padding: 20, paddingTop: 56 },
  camera: { flex: 1, backgroundColor: "#000" },
  overlayTop: { position: "absolute", top: 0, left: 0, right: 0, padding: 20, paddingTop: 56 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: { fontSize: 22, fontWeight: "700", color: C.ink },
  heading: { fontSize: 20, fontWeight: "700", color: C.ink, marginBottom: 8 },
  body: { fontSize: 15, color: C.muted, marginBottom: 20 },
  label: { fontSize: 14, color: C.muted, marginBottom: 8 },
  input: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    marginBottom: 16,
  },
  primary: { backgroundColor: C.green, borderRadius: 12, padding: 14, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { color: C.green, fontWeight: "600", textAlign: "center", marginTop: 20, fontSize: 16 },
  frameWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  frame: {
    width: 270,
    height: 170,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 16,
  },
  hint: { color: "#FFFFFF", marginTop: 16, fontSize: 15 },
  manualBtn: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  manualText: { color: C.green, fontWeight: "700", fontSize: 15 },
});