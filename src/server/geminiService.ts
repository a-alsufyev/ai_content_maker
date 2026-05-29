import { GoogleGenAI, Type, Modality } from "@google/genai";

// Initialize Gemini client with User-Agent header for AI Studio build as per guidelines
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in the server environment");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 5, initialDelay = 1500): Promise<T> => {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      let parsedMessage = error?.message || String(error);
      try {
        if (typeof parsedMessage === "string" && parsedMessage.trim().startsWith("{")) {
          const parsed = JSON.parse(parsedMessage);
          if (parsed?.error?.message) {
            parsedMessage = parsed.error.message;
          }
        }
      } catch (_) {}

      console.error("Gemini Server Service API Error:", {
        message: parsedMessage,
        status: error?.status,
        details: error?.details,
      });
      
      const errStr = String(error?.message || error || "").toLowerCase();
      const errStatus = String(error?.status || error?.statusCode || "");
      
      const isQuotaError = 
        errStr.includes("429") || 
        errStr.includes("quota") || 
        errStr.includes("resource_exhausted") || 
        errStr.includes("limit") ||
        errStatus === "RESOURCE_EXHAUSTED" ||
        errStatus === "429";

      const isInternalError = 
        errStr.includes("500") || 
        errStr.includes("503") || 
        errStr.includes("internal") || 
        errStr.includes("unavailable") || 
        errStr.includes("deadline") ||
        errStatus === "INTERNAL" ||
        errStatus === "500";

      const isLimitZero = 
        errStr.includes("limit: 0") || 
        errStr.includes("limit:0") || 
        errStr.includes("limit = 0") || 
        errStr.includes("limit=0");

      if (!isLimitZero && (isQuotaError || isInternalError) && retries < maxRetries) {
        const delay = initialDelay * Math.pow(2, retries) + Math.random() * 1000;
        console.warn(`[Gemini Server] Retry in ${Math.round(delay)}ms... (Attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
        continue;
      }
      
      const cleanedError = new Error(parsedMessage);
      (cleanedError as any).status = error?.status;
      (cleanedError as any).statusCode = error?.statusCode;
      throw cleanedError;
    }
  }
};

const CONTENT_PLAN_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
      channel: { type: Type.STRING, enum: ["Email", "Telegram", "ВКонтакте", "VKontakte"] },
      time: { type: Type.STRING, description: "Recommended time for posting (e.g., 10:00)" },
      topic: { type: Type.STRING, description: "Topic of the post" },
    },
    required: ["date", "channel", "time", "topic"],
  },
};

const VARIABLE_DETECTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    variables: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING, description: "The variable name like 'company_name' or 'client_name'" },
          label: { type: Type.STRING, description: "Human readable label for the input field" },
          description: { type: Type.STRING, description: "Description of what this variable is" },
          placeholder: { type: Type.STRING, description: "Example value for the input placeholder" },
        },
        required: ["key", "label", "placeholder"],
      },
    },
  },
};

export const serverGenerateContentPlan = async (niche: string, channels: string[], period: string, lang: string = "ru") => {
  const currentDate = new Date();
  const currentHour = currentDate.getHours();
  const startsFromTomorrow = currentHour >= 19;
  
  let numDays = 1;
  if (period === 'На 3 дня' || period === '3 days' || period === '3 Days') numDays = 3;
  else if (period === 'На 5 дней' || period === '5 days' || period === '5 Days') numDays = 5;
  else if (period === 'На неделю' || period === '1 week' || period === '1 Week') numDays = 7;
  
  let startOffset = startsFromTomorrow ? 1 : 0;
  if (period === 'На завтра' || period === 'Tomorrow' || period === 'tomorrow') {
    startOffset = 1;
    numDays = 1;
  }

  const slots: { date: string, time: string, channel: string }[] = [];
  
  for (let i = 0; i < numDays; i++) {
    const targetDate = new Date();
    targetDate.setDate(currentDate.getDate() + startOffset + i);
    
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const times: string[] = [];
    const isToday = (startOffset + i === 0);
    if (isToday) {
      if (currentHour < 10) {
        times.push('10:00', '14:00', '19:00');
      } else if (currentHour < 14) {
        times.push('14:00', '19:00');
      } else if (currentHour < 19) {
        times.push('19:00');
      }
    } else {
      times.push('10:00', '14:00', '19:00');
    }
    
    for (const channel of channels) {
      for (const time of times) {
        slots.push({ date: dateStr, channel, time });
      }
    }
  }

  const isEn = lang === 'en';
  const role = isEn 
    ? `You are a professional content maker who knows everything about creating high-quality content for newsletters and social media based on the provided niche and target audience context.`
    : `Ты – профессиональный контент-мейкер, знаешь всё про создание качественного контента для рассылок и социальных сетей на основе контекста ниши и целевой аудитории.`;
  const prompt = isEn
    ? `${role} Niche: ${niche}. Channels: ${channels.join(", ")}.
    Please generate original, engaging, and traffic-driving post topics for the following scheduled posts:
    ${JSON.stringify(slots, null, 2)}
    Each object in the array should have its "topic" field filled with the generated idea in English. You MUST keep the original "date", "channel", and "time" fields exactly as provided!`
    : `${role} Ниша: ${niche}. Каналы: ${channels.join(", ")}.
    Пожалуйста, сгенерируй интересные и вовлекающие темы публикаций, которые привлекут максимальный трафик, для следующих запланированных публикаций:
    ${JSON.stringify(slots, null, 2)}
    Для каждой записи заполни поле "topic". Обязательно сохрани переданные значения "date", "channel" и "time" абсолютно неизменными!`;

  const response = await withRetry(() => getAI().models.generateContent({
    model: "gemini-3.5-flash",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: CONTENT_PLAN_SCHEMA,
    },
  }));

  if (!response.text) {
    throw new Error("No text returned from Gemini model for Content Plan");
  }

  return JSON.parse(response.text.trim());
};

export const serverDetectVariables = async (prompt: string, lang: string = "ru") => {
  const isEn = lang === 'en';
  const detectionPrompt = isEn
    ? `Analyze the following prompt and identify any personalized variables needed (like company details, specific dates, offer amounts, sender names) that are not provided.
  IMPORTANT: Do NOT include variables for individual subscribers (like 'subscriber name', 'user name', 'client name'). The content must be universal and ready for a mass broadcast.
  
  CRITICAL: All labels and descriptions for variables MUST be in English. 
  The response must be a JSON array of objects with 'key', 'label', and 'placeholder' properties, all in English.
  
  Prompt: "${prompt}"
  Return a list of variables with keys and labels.`
    : `Analyze the following prompt and identify any personalized variables needed (like company details, specific dates, offer amounts, sender names) that are not provided.
  IMPORTANT: Do NOT include variables for individual subscribers (like 'subscriber name', 'user name', 'client name'). The content must be universal and ready for a mass broadcast.
  
  CRITICAL: All labels and descriptions for variables MUST be in Russian. 
  The response must be a JSON array of objects with 'key', 'label', and 'placeholder' properties, all in Russian.
  
  Prompt: "${prompt}"
  Return a list of variables with keys and labels.`;

  const response = await withRetry(() => getAI().models.generateContent({
    model: "gemini-3.5-flash",
    contents: [{ parts: [{ text: detectionPrompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: VARIABLE_DETECTION_SCHEMA,
    },
  }));

  if (!response.text) {
    throw new Error("No text returned from Gemini model for variables detection");
  }

  return JSON.parse(response.text.trim()).variables;
};

export const serverGenerateText = async (basePrompt: string, variables: Record<string, string>, lang: string = "ru") => {
  let finalPrompt = basePrompt;
  const isEn = lang === 'en';
  
  if (Object.keys(variables).length > 0) {
    const context = Object.entries(variables)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
    
    finalPrompt = isEn
      ? `${basePrompt}\n\nUse the following data when creating content:\n${context}`
      : `${basePrompt}\n\nИспользуй следующие данные при создании контента:\n${context}`;
  }

  const systemInstruction = `Generate ready-to-use content in ${isEn ? 'English' : 'Russian'}. No placeholders, no advice, no instructions. Just the final text with emojis and structure. CRITICAL: If additional data (context) is provided at the end of the prompt, you MUST use it in the generated text.`;

  const response = await withRetry(() => getAI().models.generateContent({
    model: "gemini-3.5-flash",
    contents: [{ parts: [{ text: finalPrompt }] }],
    config: {
      systemInstruction,
    },
  }));

  return response.text;
};

const getFallbackImage = (prompt: string): string => {
  const p = prompt.toLowerCase();
  if (p.includes("код") || p.includes("программирование") || p.includes("it") || p.includes("разработ") || p.includes("developer") || p.includes("code") || p.includes("python") || p.includes("js")) {
    return "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop";
  }
  if (p.includes("дизайн") || p.includes("рисун") || p.includes("design") || p.includes("ux") || p.includes("art")) {
    return "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=800&auto=format&fit=crop";
  }
  if (p.includes("бизнес") || p.includes("маркетинг") || p.includes("продаж") || p.includes("business") || p.includes("marketing")) {
    return "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop";
  }
  if (p.includes("англий") || p.includes("язык") || p.includes("school") || p.includes("учеба") || p.includes("english") || p.includes("learn")) {
    return "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop";
  }
  return "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop";
};

export const serverGenerateImage = async (prompt: string, aspectRatio: "1:1" | "16:9" | "9:16" = "1:1", lang: "ru" | "en" = "ru") => {
  try {
    const response = await withRetry(() => getAI().models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ parts: [{ text: `High quality professional corporate or lifestyle illustration matching the business/niche theme: ${prompt}. 
      CRITICAL: Do NOT include any text, words, letters, or labels in the image. The image should be purely visual and symbolic without any written language to avoid spelling errors.` }] }],
      config: {
        imageConfig: {
          aspectRatio,
        },
      },
    }));

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error: any) {
    console.warn("Failed to generate image via Gemini, returning premium fallback image:", error?.message || error);
    return getFallbackImage(prompt);
  }
  return getFallbackImage(prompt);
};

function wrapPcmInWav(pcmBase64: string, sampleRate: number = 24000): string {
  const pcmData = Buffer.from(pcmBase64, "base64");
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(8, 'WAVE');

  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);

  writeString(36, 'data');
  view.setUint32(40, pcmData.length, true);

  const view8 = new Uint8Array(buffer);
  view8.set(pcmData, 44);

  return Buffer.from(buffer).toString("base64");
}

export const serverGenerateSpeech = async (text: string, voice: string = 'Kore', lang: string = "ru") => {
  let cleanedText = text
    .replace(/[#*`_~>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\{[^\}]+\}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[^\w\s\u0400-\u04FF.,!?;:()"-]/g, ' ')
    .trim();

  if (!cleanedText) {
    throw new Error(lang === 'en' ? "Audio text is empty after cleaning" : "Текст для озвучки пуст после очистки");
  }

  if (cleanedText.length > 2500) {
    cleanedText = cleanedText.substring(0, 2500);
  }

  const ttsPrompt = cleanedText;

  // Use recommended gemini-3.1-flash-tts-preview model with Modality.AUDIO fromguidelines
  try {
    const response = await withRetry(() => getAI().models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: ttsPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    }));

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData?.data) {
      // Gemini TTS modality always outputs 16-bit PCM Mono audio at 24000Hz (or similar high rate)
      // Always wrap this raw PCM data in a WAV header so it is consistently playable across all browser audio modules
      const wavBase64 = wrapPcmInWav(part.inlineData.data, 24000);
      return `data:audio/wav;base64,${wavBase64}`;
    }
    
    if (part?.text) {
      const errorPrefix = lang === 'en' ? "Speech model rejected request: " : "Модель озвучки отклонила запрос: ";
      throw new Error(`${errorPrefix}${part.text.substring(0, 200)}`);
    }

    throw new Error(lang === 'en' ? "Failed to get audio from speech model" : "Не удалось получить аудио от модели озвучки");
  } catch (err: any) {
    const isEn = lang === 'en';
    const errStr = String(err?.message || err || "").toLowerCase();
    const errStatus = String(err?.status || err?.statusCode || "");
    
    const isQuotaError = 
      errStr.includes("429") || 
      errStr.includes("quota") || 
      errStr.includes("resource_exhausted") || 
      errStr.includes("limit") ||
      errStatus === "RESOURCE_EXHAUSTED" ||
      errStatus === "429";

    if (isQuotaError) {
      throw new Error(
        isEn
          ? "The free Gemini TTS daily playback quota (10 requests/day per API key) has been reached. Please wait or choose ElevenLabs or Yandex in the Settings to use your own keys, or try the browser speaker fallback."
          : "Лимит бесплатного использования озвучки Gemini был превышен (максимум 10 прослушиваний в день на проект). Пожалуйста, подождите или настройте ElevenLabs/Yandex с вашим API-ключом в Настройках, либо воспользуйтесь озвучкой в браузере."
      );
    }

    // Try parsing raw JSON error formatting
    try {
      if (errStr.trim().startsWith('{')) {
        const parsed = JSON.parse(err?.message);
        if (parsed?.error?.message) {
          throw new Error(parsed.error.message);
        }
      }
    } catch (parseErr) {
      // ignore
    }

    throw err;
  }
};
