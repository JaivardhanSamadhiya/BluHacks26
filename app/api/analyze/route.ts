import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const EMOTION_ART_MAP: Record<string, { color: string; colorRgb: number[]; shape: string }> = {
  calm: { color: "#5B8DB8", colorRgb: [91, 141, 184], shape: "circle" },
  tension: { color: "#E63946", colorRgb: [230, 57, 70], shape: "triangle" },
  joy: { color: "#FFD166", colorRgb: [255, 209, 102], shape: "star" },
  sadness: { color: "#6B7FD7", colorRgb: [107, 127, 215], shape: "teardrop" },
  anger: { color: "#C1121F", colorRgb: [193, 18, 31], shape: "spike" },
  fear: { color: "#7B2D8B", colorRgb: [123, 45, 139], shape: "zigzag" },
  love: { color: "#FF6B9D", colorRgb: [255, 107, 157], shape: "heart" },
  gratitude: { color: "#06D6A0", colorRgb: [6, 214, 160], shape: "bloom" },
  confusion: { color: "#F4A261", colorRgb: [244, 162, 97], shape: "dot" },
  anxious: { color: "#F4A261", colorRgb: [244, 162, 97], shape: "dot" },
  hope: { color: "#06AED4", colorRgb: [6, 174, 212], shape: "wave" },
  // Map to existing frontend emotions
  happy: { color: "#FFD166", colorRgb: [255, 209, 102], shape: "circle" },
  sad: { color: "#9B72CF", colorRgb: [155, 114, 207], shape: "arc" },
  angry: { color: "#EF233C", colorRgb: [239, 35, 60], shape: "triangle" },
  excited: { color: "#FF6B9D", colorRgb: [255, 107, 157], shape: "starburst" },
  overwhelmed: { color: "#8ECAE6", colorRgb: [142, 202, 230], shape: "squares" },
};

// Tuned constants
const BASE_SHAPE_COUNT = 18;
const SHAPE_COUNT_SCALE = 8;
const BASE_SIZE_MIN = 12;
const SIZE_MIN_SCALE = 8;
const BASE_SIZE_MAX = 40;
const SIZE_MAX_SCALE = 30;
const BASE_OPACITY_MIN = 0.2;
const OPACITY_MIN_SCALE = 0.108;
const BASE_OPACITY_MAX = 0.5;
const OPACITY_MAX_SCALE = 0.28;

interface EmotionResult {
  name: string;
  confidence: number;
  intensity: number;
}

function buildArtOutput(dominantEmotion: string, intensity: number, emotions: EmotionResult[]) {
  const primary = EMOTION_ART_MAP[dominantEmotion] || EMOTION_ART_MAP["calm"];

  let conflict = false;
  let conflictBlend = 0.0;
  let secondaryArt = primary;

  for (const e of emotions) {
    if (e.name !== dominantEmotion && e.confidence > 0.4) {
      conflict = true;
      conflictBlend = Math.round(Math.min(e.confidence * 0.6, 0.49) * 100) / 100;
      secondaryArt = EMOTION_ART_MAP[e.name] || EMOTION_ART_MAP["calm"];
      break;
    }
  }

  return {
    emotion: dominantEmotion,
    intensity: Math.round(intensity * 100) / 100,
    conflict,
    conflict_blend: conflictBlend,
    art: {
      primary,
      secondary: secondaryArt,
      shapeCount: Math.round(BASE_SHAPE_COUNT + intensity * SHAPE_COUNT_SCALE),
      sizeMin: Math.round(BASE_SIZE_MIN + intensity * SIZE_MIN_SCALE),
      sizeMax: Math.round(BASE_SIZE_MAX + intensity * SIZE_MAX_SCALE),
      opacityMin: Math.round(Math.min(BASE_OPACITY_MIN + intensity * OPACITY_MIN_SCALE, 0.95) * 100) / 100,
      opacityMax: Math.round(Math.min(BASE_OPACITY_MAX + intensity * OPACITY_MAX_SCALE, 0.95) * 100) / 100,
      secondaryRatio: conflictBlend,
    },
  };
}

// Map API emotions to frontend EmotionKey
function mapToFrontendEmotion(emotion: string): string {
  const mapping: Record<string, string> = {
    joy: "happy",
    sadness: "sad",
    anger: "angry",
    fear: "anxious",
    tension: "anxious",
    confusion: "anxious",
    love: "happy",
    gratitude: "happy",
    hope: "excited",
  };
  return mapping[emotion] || emotion;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || !body.text) {
      return NextResponse.json({ error: "Missing 'text' field" }, { status: 400 });
    }

    if (typeof body.text !== "string" || !body.text.trim()) {
      return NextResponse.json({ error: "'text' must be a non-empty string" }, { status: 400 });
    }

    const text = body.text;

    const prompt = `Analyze the emotional content of this text and return ONLY valid JSON.

Text to analyze:
"""${text}"""

Emotions to detect: calm, tension, joy, sadness, anger, fear, love, gratitude, confusion, hope, happy, sad, angry, anxious, excited, overwhelmed

Return format:
{
  "emotions": [
    {"name": "string", "confidence": number, "intensity": number}
  ],
  "dominant_emotion": "string",
  "overall_valence": number,
  "overall_arousal": number
}

Rules:
- confidence and intensity are 0.0 to 1.0
- overall_valence is -1.0 (negative) to 1.0 (positive)
- overall_arousal is 0.0 (calm) to 1.0 (energetic)
- only include emotions with confidence > 0.3
- order by confidence descending
- return ONLY the JSON object, no markdown, no explanation`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1024,
    });

    let responseText = completion.choices[0]?.message?.content?.trim() || "";

    // Strip markdown code fences if present
    if (responseText.startsWith("```")) {
      const lines = responseText.split("\n");
      responseText = lines.slice(1, -1).join("\n");
    }

    const result = JSON.parse(responseText);

    const emotions: EmotionResult[] = (result.emotions || [])
      .filter((e: { name?: string }) => e.name && (EMOTION_ART_MAP[e.name] || EMOTION_ART_MAP[mapToFrontendEmotion(e.name)]))
      .map((e: { name: string; confidence?: number; intensity?: number }) => ({
        name: e.name,
        confidence: Math.max(0, Math.min(1, e.confidence || 0.5)),
        intensity: Math.max(0, Math.min(1, e.intensity || 0.5)),
      }));

    let dominant = result.dominant_emotion || "calm";
    if (!EMOTION_ART_MAP[dominant] && !EMOTION_ART_MAP[mapToFrontendEmotion(dominant)]) {
      dominant = emotions[0]?.name || "calm";
    }

    const dominantIntensity = emotions.find((e) => e.name === dominant)?.intensity || 0.5;

    // Map dominant emotion to frontend emotion key
    const frontendEmotion = mapToFrontendEmotion(dominant);

    return NextResponse.json({
      emotions,
      dominant_emotion: dominant,
      frontend_emotion: frontendEmotion,
      overall_valence: Math.max(-1, Math.min(1, result.overall_valence || 0)),
      overall_arousal: Math.max(0, Math.min(1, result.overall_arousal || 0.5)),
      art_output: buildArtOutput(dominant, dominantIntensity, emotions),
      confidence: Math.round((emotions[0]?.confidence || 0.5) * 100),
    });
  } catch (error) {
    console.error("Error analyzing text:", error);
    
    // Fallback to keyword-based analysis
    return NextResponse.json(fallbackAnalysis((await request.clone().json()).text));
  }
}

function fallbackAnalysis(text: string) {
  const keywords: Record<string, string[]> = {
    calm: ["peaceful", "serene", "relaxed", "quiet", "tranquil"],
    happy: ["happy", "joy", "excited", "wonderful", "amazing", "great"],
    sad: ["sad", "depressed", "unhappy", "crying", "grief"],
    angry: ["angry", "furious", "mad", "frustrated", "annoyed"],
    anxious: ["scared", "afraid", "worried", "anxious", "nervous"],
    excited: ["excited", "thrilled", "eager", "enthusiastic", "hyped"],
    overwhelmed: ["overwhelmed", "stressed", "exhausted", "burnt out"],
  };

  const textLower = text.toLowerCase();
  const detected: EmotionResult[] = [];

  for (const [emotion, kws] of Object.entries(keywords)) {
    const matches = kws.filter((kw) => textLower.includes(kw)).length;
    if (matches > 0) {
      detected.push({
        name: emotion,
        confidence: Math.min(0.9, 0.4 + matches * 0.15),
        intensity: 0.5,
      });
    }
  }

  if (detected.length === 0) {
    detected.push({ name: "calm", confidence: 0.5, intensity: 0.5 });
  }

  detected.sort((a, b) => b.confidence - a.confidence);
  const dominant = detected[0].name;

  return {
    emotions: detected.slice(0, 5),
    dominant_emotion: dominant,
    frontend_emotion: dominant,
    overall_valence: 0,
    overall_arousal: 0.5,
    art_output: buildArtOutput(dominant, 0.5, detected.slice(0, 5)),
    confidence: Math.round(detected[0].confidence * 100),
  };
}
