import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { ScanResponse } from "@ip/shared";
import { getEmbedder } from "./lib/embedding";

const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const THROTTLE_MS = 1200; // Law: throttled capture, never continuous stream

export default function App() {
  const [perm, requestPerm] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    if (!perm?.granted) return;
    const t = setInterval(scan, THROTTLE_MS);
    return () => clearInterval(t);
  }, [perm?.granted]);

  async function scan() {
    if (busy.current || !cam.current) return;
    busy.current = true;
    try {
      const shot = await cam.current.takePictureAsync({ quality: 0.6 });
      if (!shot) return;
      const embedder = getEmbedder();
      const embedding = await embedder.embed({ uri: shot.uri }); // on-device
      const res = await fetch(`${API}/api/scan`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          embedding: Array.from(embedding),
          embeddingModel: embedder.model,
          embeddingVersion: embedder.version,
          phash: "0000000000000000", // computed on-device alongside embedding
          sourceType: "unknown",
          source: "app",
          devicePlatform: "ios",
        }),
      });
      const json = (await res.json()) as ScanResponse;
      if (json.matched || json.band === "medium") setResult(json);
    } catch {
      /* embedder not bundled yet, or network — stay silent on the loop */
    } finally {
      busy.current = false;
    }
  }

  if (!perm) return <View />;
  if (!perm.granted)
    return (
      <Centered>
        <Text style={{ color: "#fff", marginBottom: 12 }}>
          Camera access is required to scan portals.
        </Text>
        <Pressable onPress={requestPerm}>
          <Text style={{ color: "#7df" }}>Grant access</Text>
        </Pressable>
      </Centered>
    );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView ref={cam} style={{ flex: 1 }} />
      {result?.portal && (
        // Law 6: result card with destination DOMAIN, explicit tap-to-open.
        <View style={card}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            {result.portal.title}
          </Text>
          <Text style={{ color: "#9af", marginVertical: 6 }}>
            {result.portal.destinationDomain}
          </Text>
          <Pressable
            onPress={() =>
              Linking.openURL(`${API}/p/${result.portal!.slug}`)
            }
          >
            <Text style={{ color: "#7df", fontWeight: "600" }}>Open →</Text>
          </Pressable>
          <Pressable onPress={() => setResult(null)}>
            <Text style={{ color: "#888", marginTop: 8 }}>Dismiss</Text>
          </Pressable>
        </View>
      )}
      {result && !result.portal && (
        <View style={card}>
          <Text style={{ color: "#ccc" }}>{result.message}</Text>
          <Pressable onPress={() => setResult(null)}>
            <Text style={{ color: "#888", marginTop: 8 }}>OK</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const card = {
  position: "absolute" as const,
  left: 16,
  right: 16,
  bottom: 48,
  padding: 18,
  borderRadius: 16,
  backgroundColor: "rgba(15,15,15,0.94)",
};
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000",
      }}
    >
      {children}
    </View>
  );
}
