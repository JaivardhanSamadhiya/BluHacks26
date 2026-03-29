import type { EmotionKey } from "@/lib/emotiart-types";

// Expanded keyword list — covers more natural speech patterns
// (e.g. "died", "lost", "miss" for sad rather than only "sad" itself)
const EMOTION_KEYWORDS: Record<EmotionKey, string[]> = {
  happy: [
    "happy", "joy", "joyful", "great", "wonderful", "amazing", "love", "glad",
    "delighted", "cheerful", "fantastic", "awesome", "thrilled", "pleased",
    "elated", "grateful", "blessed", "beautiful", "perfect", "yay", "woohoo",
    "celebrate", "celebrating", "laugh", "laughing", "smile", "smiling", "fun",
  ],
  calm: [
    "calm", "peaceful", "relaxed", "serene", "tranquil", "content", "gentle",
    "quiet", "still", "composed", "centered", "mindful", "balanced", "okay",
    "fine", "alright", "chill", "easy", "comfortable", "rest", "resting",
  ],
  sad: [
    "sad", "unhappy", "depressed", "down", "melancholy", "gloomy", "sorrowful",
    "heartbroken", "disappointed", "lonely", "grief", "crying", "tears", "cry",
    "miss", "missing", "lost", "lose", "losing", "died", "dead", "death",
    "gone", "alone", "hurt", "hurts", "pain", "painful", "broken", "hopeless",
    "empty", "numb", "devastated", "mourning", "tragedy", "terrible",
  ],
  angry: [
    "angry", "mad", "furious", "rage", "irritated", "annoyed", "frustrated",
    "outraged", "livid", "hostile", "hate", "disgusted", "ridiculous", "stupid",
    "idiot", "unfair", "wrong", "worst", "terrible", "awful", "sick of",
    "fed up", "done with", "cant stand", "enough",
  ],
  anxious: [
    "anxious", "worried", "nervous", "stressed", "tense", "uneasy", "fearful",
    "panic", "dread", "apprehensive", "restless", "scared", "afraid", "fear",
    "terrified", "overwhelmed", "uncertain", "unsure", "doubt", "confused",
    "overthinking", "what if", "going wrong", "bad feeling",
  ],
  excited: [
    "excited", "thrilled", "eager", "enthusiastic", "hyped", "pumped",
    "energized", "animated", "vibrant", "passionate", "exhilarated", "ready",
    "lets go", "cant wait", "love this", "incredible", "unbelievable",
    "wow", "omg", "insane", "fire", "lit",
  ],
  overwhelmed: [
    "overwhelmed", "overloaded", "swamped", "drowning", "exhausted", "burnt",
    "chaos", "too much", "cant handle", "breaking down", "pressure", "burnout",
    "tired", "drained", "stuck", "behind", "failing", "mess", "disaster",
    "everything", "nothing works", "falling apart",
  ],
};

export function analyzeVoiceEmotion(transcript: string): {
  emotion: EmotionKey;
  confidence: number;
  energy: number;
} {
  if (!transcript.trim()) {
    return { emotion: "calm", confidence: 0, energy: 0 };
  }

  const lower = transcript.toLowerCase();
  const scores: Record<EmotionKey, number> = {
    happy: 0, calm: 0, sad: 0, angry: 0, anxious: 0, excited: 0, overwhelmed: 0,
  };
  let totalMatches = 0;

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    for (const keyword of keywords) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "gi");
      const matches = lower.match(regex);
      if (matches) {
        scores[emotion as EmotionKey] += matches.length;
        totalMatches += matches.length;
      }
    }
  }

  let topEmotion: EmotionKey = "calm";
  let topScore = 0;
  for (const [emotion, score] of Object.entries(scores)) {
    if (score > topScore) {
      topScore = score;
      topEmotion = emotion as EmotionKey;
    }
  }

  const confidence = totalMatches > 0
    ? Math.min((topScore / totalMatches), 1)
    : 0.3; // default mid-confidence when no keywords match

  // Energy: approximate from word count and punctuation intensity
  const wordCount = transcript.trim().split(/\s+/).length;
  const exclamations = (transcript.match(/!/g) || []).length;
  const energy = Math.min(1, wordCount / 20 + exclamations * 0.1);

  return { emotion: topEmotion, confidence, energy };
}
