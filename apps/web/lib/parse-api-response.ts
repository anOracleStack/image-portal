type ApiErrorBody = { error?: string; message?: string };

/**
 * Parse a fetch Response as JSON when possible; surface readable errors for
 * non-JSON bodies (e.g. Vercel 413 "Request Entity Too Large").
 */
export async function readApiJson<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = (await res.json()) as T & ApiErrorBody;
    if (!res.ok) {
      throw new Error(data.error ?? data.message ?? "Request failed");
    }
    return data;
  }

  const text = (await res.text()).trim();
  if (res.status === 413 || /entity too large/i.test(text)) {
    throw new Error(
      "Image too large for upload — try a smaller photo (under 10 MB).",
    );
  }
  if (!res.ok) {
    throw new Error(text.slice(0, 160) || res.statusText || "Request failed");
  }
  throw new Error("Unexpected response from server.");
}
