// Lightweight REST client for Gemini to avoid bundling an SDK
// Reads the API key from Vite env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

if (!API_KEY) {
  // eslint-disable-next-line no-console
  console.warn("VITE_GEMINI_API_KEY is not set. Chatbot will be disabled.");
}

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

export async function askGemini(prompt: string, context?: string) {
  if (!API_KEY) {
    return {
      text: () =>
        Promise.resolve(
          "Gemini API key is not configured. Please add VITE_GEMINI_API_KEY in frontend/.env."
        ),
    } as unknown as { text: () => Promise<string> };
  }

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
    encodeURIComponent(API_KEY);

  const fullPrompt = context ? `${context}\n\nUser: ${prompt}` : prompt;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return {
      text: () =>
        Promise.resolve(
          `Gemini request failed (${res.status}). ${errText || "Please try again later."}`
        ),
    } as unknown as { text: () => Promise<string> };
  }

  const data = (await res.json()) as GeminiResponse;
  const answer =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
    "(No response)";

  return { text: () => Promise.resolve(answer) } as unknown as {
    text: () => Promise<string>;
  };
}
