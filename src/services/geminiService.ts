interface ContentPlanItem {
  id: string;
  date: string;
  channel: "Email" | "Telegram" | "ВКонтакте" | "VKontakte";
  time: string;
  topic: string;
}

export const generateContentPlan = async (niche: string, channels: string[], period: string, lang: "ru" | "en" = "ru"): Promise<ContentPlanItem[]> => {
  const response = await fetch("/api/gemini/content-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ niche, channels, period, lang }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const defaultMsg = lang === "en" ? "Failed to generate content plan" : "Ошибка генерации контент-плана";
    throw new Error(errData.error || defaultMsg);
  }
  return response.json();
};

export const detectVariables = async (prompt: string, lang: "ru" | "en" = "ru") => {
  const response = await fetch("/api/gemini/detect-variables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, lang }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const defaultMsg = lang === "en" ? "Failed to detect variables" : "Ошибка определения переменных";
    throw new Error(errData.error || defaultMsg);
  }
  const data = await response.json();
  return data.variables;
};

export const generateText = async (basePrompt: string, variables: Record<string, string>, lang: "ru" | "en" = "ru"): Promise<string> => {
  const response = await fetch("/api/gemini/generate-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ basePrompt, variables, lang }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const defaultMsg = lang === "en" ? "Failed to generate text" : "Ошибка генерации текста";
    throw new Error(errData.error || defaultMsg);
  }
  const data = await response.json();
  return data.text;
};

export const generateImage = async (prompt: string, aspectRatio: "1:1" | "16:9" | "9:16" = "1:1", lang: "ru" | "en" = "ru"): Promise<string | null> => {
  const response = await fetch("/api/gemini/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, aspectRatio, lang }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const defaultMsg = lang === "en" ? "Failed to generate image" : "Ошибка генерации изображения";
    throw new Error(errData.error || defaultMsg);
  }
  const data = await response.json();
  return data.imageUrl;
};

export const generateSpeech = async (text: string, voice: string = 'Kore', lang: "ru" | "en" = "ru"): Promise<string> => {
  const response = await fetch("/api/gemini/generate-speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice, lang }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const defaultMsg = lang === "en" ? "Failed to generate speech" : "Ошибка генерации озвучки";
    throw new Error(errData.error || defaultMsg);
  }
  const data = await response.json();
  return data.audioUrl;
};
