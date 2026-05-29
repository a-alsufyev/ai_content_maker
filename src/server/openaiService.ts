import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

const getOpenAI = (): OpenAI => {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set in the server environment. Please set it in the Secrets/Settings menu.");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
};

const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1500): Promise<T> => {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      console.error("OpenAI Server Service API Error:", error?.message || error);
      if (retries < maxRetries) {
        const delay = initialDelay * Math.pow(2, retries) + Math.random() * 1000;
        console.warn(`[OpenAI Server] Retry in ${Math.round(delay)}ms... (Attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
        continue;
      }
      throw error;
    }
  }
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

  const response = await withRetry(() => getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "content_plan",
        strict: true,
        schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              description: "List of posts matching structural requirements",
              items: {
                type: "object",
                properties: {
                  date: { type: "string", description: "YYYY-MM-DD" },
                  channel: { type: "string", description: "Target channel" },
                  time: { type: "string", description: "HH:MM" },
                  topic: { type: "string", description: "Generated topic text" }
                },
                required: ["date", "channel", "time", "topic"],
                additionalProperties: false
              }
            }
          },
          required: ["items"],
          additionalProperties: false
        }
      }
    }
  }));

  const textOutput = response.choices[0]?.message?.content;
  if (!textOutput) {
    throw new Error("No text returned from OpenAI for Content Plan");
  }

  const parsed = JSON.parse(textOutput.trim());
  return parsed.items;
};

export const serverDetectVariables = async (prompt: string, lang: string = "ru") => {
  const isEn = lang === 'en';
  const detectionPrompt = isEn
    ? `Analyze the following prompt and identify any personalized variables needed (like company details, specific dates, offer amounts, sender names) that are not provided.
  IMPORTANT: Do NOT include variables for individual subscribers (like 'subscriber name', 'user name', 'client name'). The content must be universal and ready for a mass broadcast.
  
  CRITICAL: All labels and descriptions for variables MUST be in English. 
  The response must be a JSON array of objects with 'key', 'label', 'description', and 'placeholder' properties, all in English.
  
  Prompt: "${prompt}"
  Return a list of variables with keys and labels.`
    : `Analyze the following prompt and identify any personalized variables needed (like company details, specific dates, offer amounts, sender names) that are not provided.
  IMPORTANT: Do NOT include variables for individual subscribers (like 'subscriber name', 'user name', 'client name'). The content must be universal and ready for a mass broadcast.
  
  CRITICAL: All labels and descriptions for variables MUST be in Russian. 
  The response must be a JSON array of objects with 'key', 'label', 'description', and 'placeholder' properties, all in Russian.
  
  Prompt: "${prompt}"
  Return a list of variables with keys and labels.`;

  const response = await withRetry(() => getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: detectionPrompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "variables_detection",
        strict: true,
        schema: {
          type: "object",
          properties: {
            variables: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  key: { type: "string", description: "Technical key like 'company_name'" },
                  label: { type: "string", description: "Display name like 'Company Name' or 'Название компании'" },
                  description: { type: "string", description: "Help text for the input" },
                  placeholder: { type: "string", description: "Example input value" }
                },
                required: ["key", "label", "description", "placeholder"],
                additionalProperties: false
              }
            }
          },
          required: ["variables"],
          additionalProperties: false
        }
      }
    }
  }));

  const textOutput = response.choices[0]?.message?.content;
  if (!textOutput) {
    throw new Error("No text returned from OpenAI for variables detection");
  }

  const parsed = JSON.parse(textOutput.trim());
  return parsed.variables;
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

  const response = await withRetry(() => getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: finalPrompt }
    ]
  }));

  return response.choices[0]?.message?.content || "";
};
