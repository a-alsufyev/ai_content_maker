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
  
  // Serve public folder statically (for dynamically generated audio files)
  app.use(express.static(path.join(process.cwd(), "public")));

  // HeyGen Proxy Routes
  app.get("/api/heygen/validate", async (req, res) => {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) return res.status(401).json({ error: "Missing API Key" });

    try {
      // We use a simple lightweight request to validate the key
      const response = await axios.get("https://api.heygen.com/v2/avatars", {
        headers: { "X-Api-Key": apiKey as string },
        params: { page_size: 1 }
      });
      res.json({ status: "ok", data: response.data });
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Internal Server Error" });
    }
  });

  app.get("/api/heygen/avatars", async (req, res) => {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) return res.status(401).json({ error: "Missing API Key" });

    try {
      const response = await axios.get("https://api.heygen.com/v2/avatars", {
        headers: { "X-Api-Key": apiKey as string },
        params: { page_size: 100 }
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Internal Server Error" });
    }
  });

  app.post("/api/heygen/video", async (req, res) => {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) return res.status(401).json({ error: "Missing API Key" });

    try {
      const response = await axios.post("https://api.heygen.com/v2/video/generate", req.body, {
        headers: { "X-Api-Key": apiKey as string },
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Internal Server Error" });
    }
  });

  app.get("/api/heygen/video/:id", async (req, res) => {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) return res.status(401).json({ error: "Missing API Key" });

    try {
      const response = await axios.get(`https://api.heygen.com/v2/video_status.get?video_id=${req.params.id}`, {
        headers: { "X-Api-Key": apiKey as string },
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
    const { lang } = req.body;
    const isEn = lang === 'en';
    const msg = isEn 
      ? "In the demo version, generating audio is disabled. You can listen to ready-made examples instead."
      : "В демо-версии генерация аудио отключена. Вместо этого вы можете прослушать готовые примеры.";
    return res.status(403).json({ error: msg });
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
