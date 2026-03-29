import type { EmotionKey } from "@/lib/emotiart-types";
import { EMOTION_ART } from "@/lib/art-params";

// ============================================================================
// Step 1: Type Definitions
// ============================================================================

export type CurveMovement = 'upward' | 'downward' | 'horizontal' | 'chaotic' | 'swirling';

export interface CurveAttributes {
  sharpness: number;    // 0.3-1.0, higher = more angular
  movement: CurveMovement;
  speed: number;        // 0.2-1.5, multiplier on base animation speed
  density: number;      // 2-18, number of curves to render
}

export interface GradientStop {
  emotion: EmotionKey;
  centerX: number;      // 0-100 percentage
  centerY: number;      // 0-100 percentage
  radius: number;       // 0-100 percentage
  color: string;        // hex color
  opacity: number;      // 0-1
}

export interface BackgroundConfig {
  gradients: GradientStop[];
  curves: CurveAttributes;
  baseOpacity: number;  // 0-1, overall background opacity
  animationSpeed: number; // multiplier on base speed
}

// ============================================================================
// Step 2: Emotion to Curve Mapping
// ============================================================================

export function getCurveAttributes(emotion: EmotionKey): CurveAttributes {
  const mapping: Record<EmotionKey, CurveAttributes> = {
    happy: {
      sharpness: 0.5,
      movement: 'upward',
      speed: 0.6,
      density: 6,
    },
    excited: {
      sharpness: 0.8,
      movement: 'upward',
      speed: 1.2,
      density: 10,
    },
    calm: {
      sharpness: 0.3,
      movement: 'horizontal',
      speed: 0.2,
      density: 3,
    },
    sad: {
      sharpness: 0.4,
      movement: 'downward',
      speed: 0.3,
      density: 3,
    },
    anxious: {
      sharpness: 0.95,
      movement: 'chaotic',
      speed: 1.3,
      density: 12,
    },
    angry: {
      sharpness: 0.9,
      movement: 'upward',
      speed: 1.1,
      density: 10,
    },
    overwhelmed: {
      sharpness: 1.0,
      movement: 'swirling',
      speed: 1.5,
      density: 15,
    },
  };
  return mapping[emotion];
}

// ============================================================================
// Step 3: Blending Function for Dual Emotions
// ============================================================================

export function blendCurveAttributes(
  primary: CurveAttributes,
  secondary: CurveAttributes
): CurveAttributes {
  return {
    sharpness: (primary.sharpness + secondary.sharpness) / 2,
    movement: primary.movement, // use primary movement, secondary adds visual chaos
    speed: (primary.speed + secondary.speed) / 2,
    density: Math.max(primary.density, secondary.density), // use higher density for visual richness
  };
}

// ============================================================================
// Step 4: Main Background Generation Function
// ============================================================================

export function generateBackground(
  emotion: EmotionKey,
  secondaryEmotion: EmotionKey | undefined,
  intensity: number
): BackgroundConfig {
  const primaryAttrs = getCurveAttributes(emotion);
  const curves = secondaryEmotion
    ? blendCurveAttributes(primaryAttrs, getCurveAttributes(secondaryEmotion))
    : primaryAttrs;

  const primaryColor = EMOTION_ART[emotion].color;
  const secondaryColor = secondaryEmotion ? EMOTION_ART[secondaryEmotion].color : undefined;

  const gradients: GradientStop[] = [
    {
      emotion,
      centerX: 35,
      centerY: 45,
      radius: 38,
      color: primaryColor,
      opacity: 0.5 * intensity,
    },
  ];

  if (secondaryColor && secondaryEmotion) {
    gradients.push({
      emotion: secondaryEmotion,
      centerX: 65,
      centerY: 60,
      radius: 32,
      color: secondaryColor,
      opacity: 0.4 * intensity,
    });
  }

  const baseOpacity = Math.max(0.3, Math.min(1.0, intensity));

  return {
    gradients,
    curves,
    baseOpacity,
    animationSpeed: curves.speed,
  };
}
