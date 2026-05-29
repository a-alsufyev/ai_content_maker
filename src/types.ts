export interface ContentPlanItem {
  id: string;
  date: string;
  channel: "Email" | "Telegram" | "ВКонтакте";
  time: string;
  topic: string;
}

export interface GeneratedContent {
  id: string;
  type: "newsletter" | "longread" | "podcast" | "video";
  title: string;
  text: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  timestamp: number;
}

export interface Settings {
  heygenApiKey: string;
  ttsProvider: "gemini" | "elevenlabs" | "yandex";
  ttsApiKey: string;
}
