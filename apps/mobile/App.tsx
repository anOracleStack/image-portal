import { useRef, useState } from "react";
import { View, Text, Pressable, Linking, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { ScanResponse } from "@ip/shared";
import { EMBED_MODEL, EMBED_VERSION } from "@ip/shared";

const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const MIN_EDGE = 480;

type Phase = "ready" | "analyzing" | "success" | "retry";

export default function App() {
  const [perm, requestPerm] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const busy = useRef(false);

  async function capturePhoto() {
    if (busy.current || !cam.current || phase === "analyzing") return;
    busy.current = true;
    setPhase("analyzing");
    setRetryMessage(null);
    setResult(null);

    try {
      const shot = await cam.current.takePictureAsync({ quality: 0.88 });
      if (!shot?.uri) {
        setPhase("retry");
        setRetryMessage("Could not take photo — capture again.");
        return;
      }

      const w = shot.width ?? 0;
      const h = shot.height ?? 0;
      if (w < MIN_EDGE || h < MIN_EDGE) {
        setPhase("retry");
        setRetryMessage(
          "Move closer so the image fills the frame, then capture again.",
        );
        return;
      }

      const form = new FormData();
      form.append("file", {
        uri: shot.uri,
        type: "image/jpeg",
        name: "scan.jpg",
      } as unknown as Blob);

      const embedRes = await fetch(`${API}/api/embed/query`, {
        method: "POST",
        body: form,
      });
      if (!embedRes.ok) {
        setPhase("retry");
        setRetryMessage("Analysis failed — capture again.");
        return;
      }
      const embedData = (await embedRes.json()) as {
        embedding: number[];
        phash: string;
      };

      const res = await fetch(`${API}/api/scan`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          embedding: embedData.embedding,
          phash: embedData.phash,
          sourceType: "print",
          source: "app",
          devicePlatform: "ios",
          embeddingModel: EMBED_MODEL,
          embeddingVersion: EMBED_VERSION,
        }),
      });
      const json = (await res.json()) as ScanResponse;

      if (json.matched && json.portal) {
        setResult(json);
        setPhase("success");
      } else {
        setResult(json);
        setPhase("retry");
        setRetryMessage(
          json.message ?? "Capture again — center the image & hold steady.",
        );
      }
    } catch {
      setPhase("retry");
      setRetryMessage("Network error — capture again.");
    } finally {
      busy.current = false;
    }
  }

  function resetCapture() {
    setPhase("ready");
    setResult(null);
    setRetryMessage(null);
  }

  if (!perm) return <View />;
  if (!perm.granted)
    return (
      <Centered>
        <Text style={{ color: "#fff", marginBottom: 12 }}>
          Camera access is required to open linked visuals.
        </Text>
        <Pressable onPress={requestPerm}>
          <Text style={{ color: "#7df" }}>Grant access</Text>
        </Pressable>
      </Centered>
    );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView ref={cam} style={{ flex: 1 }} />
      <View style={hud}>
        <Text style={hudLabel}>
          {phase === "analyzing"
            ? "Analyzing…"
            : phase === "success"
              ? "Link found"
              : phase === "retry"
                ? "Try again"
                : "Ready"}
        </Text>
        {phase === "analyzing" ? (
          <ActivityIndicator color="#7df" style={{ marginTop: 8 }} />
        ) : (
          <Pressable onPress={capturePhoto} style={captureBtn}>
            <Text style={{ color: "#000", fontWeight: "700" }}>
              {phase === "ready" ? "Capture photo" : "Capture again"}
            </Text>
          </Pressable>
        )}
      </View>

      {phase === "success" && result?.portal && (
        <View style={card}>
          <Text style={{ color: "#9af", fontSize: 18, fontWeight: "700" }}>
            {result.portal.destinationDomain}
          </Text>
          <Text style={{ color: "#fff", marginVertical: 6 }}>
            {result.portal.title}
          </Text>
          <Pressable
            onPress={() => Linking.openURL(`${API}/p/${result.portal!.slug}/go`)}
          >
            <Text style={{ color: "#7df", fontWeight: "600", fontSize: 16 }}>
              Open link →
            </Text>
          </Pressable>
          <Pressable onPress={resetCapture}>
            <Text style={{ color: "#888", marginTop: 8 }}>Dismiss</Text>
          </Pressable>
        </View>
      )}

      {phase === "retry" && (
        <View style={card}>
          <Text style={{ color: "#fcc" }}>{retryMessage}</Text>
        </View>
      )}
    </View>
  );
}

const hud = {
  position: "absolute" as const,
  bottom: 120,
  left: 0,
  right: 0,
  alignItems: "center" as const,
};

const hudLabel = {
  color: "#aaa",
  fontSize: 12,
  letterSpacing: 1,
  textTransform: "uppercase" as const,
  marginBottom: 12,
};

const captureBtn = {
  backgroundColor: "#fff",
  paddingHorizontal: 28,
  paddingVertical: 14,
  borderRadius: 999,
};

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
