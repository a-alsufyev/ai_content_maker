import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { 
  serverGenerateImage,
  serverGenerateSpeech
} from "./src/server/geminiService";
import {
  serverGenerateContentPlan,
  serverDetectVariables,
  serverGenerateText
} from "./src/server/openaiService";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(express.json());
  
  // HeyGen Key helper that falls back to process.env.HEYGEN_API_KEY safely
  const getHeyGenKey = (req: any): string => {
    const key = req.headers["x-api-key"];
    if (key && key !== "undefined" && key !== "null" && key !== "" && !key.toLowerCase().includes("your_") && !key.toLowerCase().includes("placeholder") && key !== '""') {
      return key as string;
    }
    const envKey = process.env.HEYGEN_API_KEY;
    if (envKey && envKey !== "undefined" && envKey !== "null" && envKey !== "" && !envKey.toLowerCase().includes("your_") && !envKey.toLowerCase().includes("placeholder") && envKey !== '""') {
      return envKey;
    }
    return "";
  };

  // HeyGen Proxy Routes
  app.get("/api/heygen/validate", async (req, res) => {
    const apiKey = getHeyGenKey(req);
    if (!apiKey) return res.status(401).json({ error: "Missing API Key" });

    try {
      // We use a simple lightweight request to validate the key
      const response = await axios.get("https://api.heygen.com/v2/avatars", {
        headers: { "X-Api-Key": apiKey },
        params: { page_size: 1 }
      });
      res.json({ status: "ok", data: response.data });
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Internal Server Error" });
    }
  });

  app.get("/api/heygen/proxy-image", async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send("Missing url parameter");
    }
    try {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        },
        timeout: 8000
      });
      const contentType = response.headers["content-type"] || "image/png";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(response.data);
    } catch (err: any) {
      console.error("Failed to proxy image:", imageUrl, err?.message);
      res.status(500).send("Error proxying image");
    }
  });

  const FALLBACK_AVATAR_NAMES = [
    "Christina", "Joshua", "Wayne", "Eunice", "Sophia", "Alex", "Anna", "Dmitry", "Maria", "John", 
    "Emma", "Michael", "Olivia", "David", "Svetlana", "Ivan", "Elena", "Liam", "Noah", "Oliver", 
    "James", "Benjamin", "Lucas", "Henry", "Alexander", "William", "Mia", "Amelia", "Harper", "Evelyn", 
    "Abigail", "Emily", "Elizabeth", "Sofia", "Avery", "Ella", "Scarlett", "Grace", "Chloe", "Victoria", 
    "Madison", "Kylie", "Layla", "Sergey", "Olga", "Andrey", "Tatiana", "Nikolay", "Natalia", "Pavel", 
    "Marina", "Maxim", "Julia", "Artem", "Ksenia", "Valery", "Vera", "Denis", "Irina", "Ilya", 
    "Daria", "Anton", "Alena", "Gleb", "Diana", "Kirill", "Yulia", "Egor", "Roman", "Polina", 
    "Vladislav", "Nadezhda", "Arthur", "Galina", "Victor", "Lyudmila", "Oleg", "Aleksey", "Tatyana", "Stanislav", 
    "Margarita", "Vasilisa", "Yaroslav", "Anastasia", "Leonid", "Inna", "Georgy", "Alla", "Semyon", "Tamara",
    "Yury", "Anna", "Zhanna", "Eduard", "Karina", "Albert", "Lidia", "Nazar", "Albina", "Taras"
  ];

  const FALLBACK_PORTRAIT_IDS = [
    "photo-1494790108377-be9c29b29330",
    "photo-1507003211169-0a1dd7228f2d",
    "photo-1500648767791-00dcc994a43e",
    "photo-1438761681033-6461ffad8d80",
    "photo-1534528741775-53994a69daeb",
    "photo-1544005313-94ddf0286df2",
    "photo-1506794778202-cad84cf45f1d",
    "photo-1517841905240-472988babdf9",
    "photo-1522075469751-3a6694fb2f61",
    "photo-1531746020798-e6953c6e8e04",
    "photo-1501196354995-cbb51c65aaea",
    "photo-1544725176-7c40e5a71c5e",
    "photo-1531123897727-8f129e1688ce",
    "photo-1552058544-f2b08422138a",
    "photo-1580489944761-15a19d654956",
    "photo-1567532939604-b6b5b0db2604",
    "photo-1508214751196-bcfd4ca60f91",
    "photo-1573496359142-b8d87734a5a2",
    "photo-1560250097-0b93528c311a"
  ];

  const serverGenerate100Avatars = () => {
    const list = [];
    for (let i = 0; i < 100; i++) {
      const name = FALLBACK_AVATAR_NAMES[i % FALLBACK_AVATAR_NAMES.length];
      const avatar_id = `${name.toLowerCase()}_expressive_202404${String(10 + i)}`;
      const imgId = FALLBACK_PORTRAIT_IDS[i % FALLBACK_PORTRAIT_IDS.length];
      const preview_image_url = `https://images.unsplash.com/${imgId}?w=240&auto=format&fit=crop&q=80`;
      list.push({ avatar_id, avatar_name: name, preview_image_url });
    }
    return list;
  };

  app.get("/api/heygen/avatars", async (req, res) => {
    const apiKey = getHeyGenKey(req);
    
    // If no key is set yet, return the high-quality 100 fallback catalog instantly
    if (!apiKey) {
      return res.json({
        data: {
          avatars: serverGenerate100Avatars()
        }
      });
    }

    try {
      const response = await axios.get("https://api.heygen.com/v2/avatars", {
        headers: { "X-Api-Key": apiKey },
        params: { page_size: 100 },
        timeout: 2000 // Fast 2-second timeout to prevent UI hang if API is blocked/down
      });
      const responseData = response.data;
      if (responseData && responseData.data && Array.isArray(responseData.data.avatars)) {
        responseData.data.avatars = responseData.data.avatars.map((av: any) => ({
          ...av,
          preview_image_url: av.preview_image_url ? `/api/heygen/proxy-image?url=${encodeURIComponent(av.preview_image_url)}` : ""
        }));
      }
      res.json(responseData);
    } catch (error: any) {
      console.warn("HeyGen original API call failed, returning 100 fallback avatars:", error?.message || error);
      res.json({
        data: {
          avatars: serverGenerate100Avatars()
        }
      });
    }
  });

  app.post("/api/heygen/video", async (req, res) => {
    const apiKey = getHeyGenKey(req);
    if (!apiKey) return res.status(401).json({ error: "Missing API Key" });

    try {
      const response = await axios.post("https://api.heygen.com/v2/video/generate", req.body, {
        headers: { "X-Api-Key": apiKey },
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Internal Server Error" });
    }
  });

  app.get("/api/heygen/video/:id", async (req, res) => {
    const apiKey = getHeyGenKey(req);
    if (!apiKey) return res.status(401).json({ error: "Missing API Key" });

    try {
      const response = await axios.get(`https://api.heygen.com/v2/video_status.get?video_id=${req.params.id}`, {
        headers: { "X-Api-Key": apiKey },
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Internal Server Error" });
    }
  });

  // ElevenLabs Proxy (Example TTS)
  app.get("/api/tts/elevenlabs/validate", async (req, res) => {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) return res.status(401).json({ error: "Missing API Key" });

    try {
      const response = await axios.get("https://api.elevenlabs.io/v1/user", {
        headers: { "xi-api-key": apiKey as string },
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Validation Failed" });
    }
  });

  app.post("/api/tts/elevenlabs", async (req, res) => {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) return res.status(401).json({ error: "Missing API Key" });

    try {
      const { text, voiceId, settings } = req.body;
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        { text, voice_settings: settings },
        {
          headers: {
            "xi-api-key": apiKey as string,
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer",
        }
      );
      res.set("Content-Type", "audio/mpeg");
      res.send(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json({ error: "TTS Failed" });
    }
  });

  // Gemini Proxy Routes
  app.post("/api/gemini/content-plan", async (req, res) => {
    try {
      const { niche, channels, period, lang } = req.body;
      const data = await serverGenerateContentPlan(niche, channels, period, lang);
      res.json(data);
    } catch (error: any) {
      console.error("Gemini Content Plan Error:", error);
      res.status(500).json({ error: error?.message || "Internal Server Error" });
    }
  });

  app.post("/api/gemini/detect-variables", async (req, res) => {
    try {
      const { prompt, lang } = req.body;
      const data = await serverDetectVariables(prompt, lang);
      res.json({ variables: data });
    } catch (error: any) {
      console.error("Gemini Variables Detection Error:", error);
      res.status(500).json({ error: error?.message || "Internal Server Error" });
    }
  });

  app.post("/api/gemini/generate-text", async (req, res) => {
    try {
      const { basePrompt, variables, lang } = req.body;
      const text = await serverGenerateText(basePrompt, variables || {}, lang);
      res.json({ text });
    } catch (error: any) {
      console.error("Gemini Generate Text Error:", error);
      res.status(500).json({ error: error?.message || "Internal Server Error" });
    }
  });

  app.post("/api/gemini/generate-image", async (req, res) => {
    try {
      const { prompt, aspectRatio, lang } = req.body;
      const imageUrl = await serverGenerateImage(prompt, aspectRatio, lang);
      res.json({ imageUrl });
    } catch (error: any) {
      console.error("Gemini Generate Image Error:", error);
      res.status(500).json({ error: error?.message || "Internal Server Error" });
    }
  });

  app.post("/api/gemini/generate-speech", async (req, res) => {
    try {
      const { text, voice, lang } = req.body;
      const audioUrl = await serverGenerateSpeech(text, voice, lang);
      res.json({ audioUrl });
    } catch (error: any) {
      console.error("Gemini Generate Speech Error:", error);
      res.status(500).json({ error: error?.message || "Internal Server Error" });
    }
  });

  app.get("/api/gemini/speech-samples", async (req, res) => {
    try {
      const fs = await import("fs");
      const manifestPath = path.join(process.cwd(), "public", "audio_samples", "manifest.json");
      if (fs.existsSync(manifestPath)) {
        const manifestData = fs.readFileSync(manifestPath, "utf-8");
        res.json(JSON.parse(manifestData));
      } else {
        res.json([]);
      }
    } catch (error: any) {
      console.error("Error reading speech samples manifest:", error);
      res.json([]);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
