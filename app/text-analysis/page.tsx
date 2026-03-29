"use client";

import { useState, useRef, useCallback } from "react";
import { Navbar } from "@/components/navbar";
import { EmotionDetectionPanel } from "@/components/emotiart/emotion-detection-panel";
import { VisualGuidePanel } from "@/components/emotiart/visual-guide-panel";
import { ArtCanvas } from "@/components/emotiart/art-canvas";
import { EmotionKey } from "@/lib/emotiart-types";

export default function TextAnalysisPage() {
  const [text, setText] = useState("");
  const [activeEmotion, setActiveEmotion] = useState<EmotionKey>("calm");
  const [confidence, setConfidence] = useState(0);
  const [isGenerated, setIsGenerated] = useState(false);
  const [generationKey, setGenerationKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<{ regenerate: () => void; download: () => void }>(null);

  const handleAnalyze = useCallback(async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze text");
      }

      const result = await response.json();
      
      // Map the API response emotion to frontend EmotionKey
      const emotionMap: Record<string, EmotionKey> = {
        happy: "happy",
        calm: "calm",
        sad: "sad",
        angry: "angry",
        anxious: "anxious",
        excited: "excited",
        overwhelmed: "overwhelmed",
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

      const frontendEmotion = result.frontend_emotion || result.dominant_emotion;
      const mappedEmotion: EmotionKey = emotionMap[frontendEmotion] || "calm";
      
      setActiveEmotion(mappedEmotion);
      setConfidence(result.confidence || 50);
      setIsGenerated(true);
      setGenerationKey((prev) => prev + 1);
    } catch (err) {
      console.error("Error analyzing text:", err);
      setError("Failed to analyze text. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [text]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0d0d0f]">
      <Navbar />

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 lg:order-2 min-h-[50vh] lg:min-h-0">
          <ArtCanvas
            ref={canvasRef}
            emotion={activeEmotion}
            isGenerated={isGenerated}
            generationKey={generationKey}
          />
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-[320px] lg:order-1 flex-shrink-0 p-3 flex flex-col gap-3 overflow-y-auto">
          {/* Text Input Panel */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
            <h2 className="font-sans font-semibold text-sm text-white mb-3">
              Text Input
            </h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your messages, journal entry, or any text here to analyze its emotional tone..."
              className="w-full h-32 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.07] text-white font-sans text-sm placeholder:text-white/30 focus:outline-none focus:border-[#06AED4]/50 focus:ring-1 focus:ring-[#06AED4]/50 transition-colors resize-none"
            />
            <p className="font-mono text-xs text-white/40 mt-2">
              {text.length} characters
            </p>
          </div>

          <EmotionDetectionPanel
            activeEmotion={activeEmotion}
            confidence={confidence}
          />
          <VisualGuidePanel />

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!text.trim() || isLoading}
            className="w-full h-11 bg-white text-black font-sans font-semibold text-sm rounded-lg hover:opacity-88 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Analyzing...
              </>
            ) : (
              "Analyze Text"
            )}
          </button>
        </aside>
      </main>
    </div>
  );
}
