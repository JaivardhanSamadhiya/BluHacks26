import type { EmotionKey, ArtParams } from "@/lib/emotiart-types";
import type { SynthesisResult } from "@/lib/emotion-synthesizer";

const EMOTION_ART: Record<EmotionKey, { color: string; colorRgb: number[]; shape: string }> = {
  happy:       { color: "#FFD166", colorRgb: [255, 209, 102], shape: "circle"   },
  calm:        { color: "#06AED4", colorRgb: [6,   174, 212], shape: "wave"     },
  sad:         { color: "#9B72CF", colorRgb: [155, 114, 207], shape: "arc"      },
  angry:       { color: "#EF233C", colorRgb: [239, 35,  60],  shape: "triangle" },
  anxious:     { color: "#F4A261", colorRgb: [244, 162, 97],  shape: "dot"      },
  excited:     { color: "#FF6B9D", colorRgb: [255, 107, 157], shape: "star"     },
  overwhelmed: { color: "#8ECAE6", colorRgb: [142, 202, 230], shape: "dense"    },
};

const INTENSITY_SCALE = {
  shapeCount: [10,   32  ] as [number, number],
  sizeMin:    [12,   22  ] as [number, number],
  sizeMax:    [30,   90  ] as [number, number],
  opacityMin: [0.10, 0.25] as [number, number],
  opacityMax: [0.40, 0.80] as [number, number],
};

function lerp([lo, hi]: [number, number], t: number) {
  return lo + (hi - lo) * t;
}

export function buildArtParams(synthesis: SynthesisResult): ArtParams {
  const { emotion, intensity, conflict, conflictBlend, secondaryEmotion } = synthesis;

  return {
    primary:        EMOTION_ART[emotion],
    secondary:      conflict ? EMOTION_ART[secondaryEmotion] : null,
    shapeCount:     Math.round(lerp(INTENSITY_SCALE.shapeCount, intensity)),
    sizeMin:        Math.round(lerp(INTENSITY_SCALE.sizeMin,    intensity) * 10) / 10,
    sizeMax:        Math.round(lerp(INTENSITY_SCALE.sizeMax,    intensity) * 10) / 10,
    opacityMin:     Math.round(lerp(INTENSITY_SCALE.opacityMin, intensity) * 100) / 100,
    opacityMax:     Math.round(lerp(INTENSITY_SCALE.opacityMax, intensity) * 100) / 100,
    secondaryRatio: conflictBlend,
  };
}
