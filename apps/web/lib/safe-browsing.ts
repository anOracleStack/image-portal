import "server-only";

/** Optional Google Safe Browsing lookup (requires GOOGLE_SAFE_BROWSING_API_KEY). */
export async function checkSafeBrowsing(url: string): Promise<{
  safe: boolean;
  threats: string[];
}> {
  const key = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!key) return { safe: true, threats: [] };

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: {
            clientId: "image-portal",
            clientVersion: "1.0.0",
          },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
      }
    );

    if (!res.ok) return { safe: true, threats: [] };

    const data = (await res.json()) as { matches?: { threatType: string }[] };
    const threats = (data.matches ?? []).map((m) => m.threatType);
    return { safe: threats.length === 0, threats };
  } catch {
    return { safe: true, threats: [] };
  }
}
