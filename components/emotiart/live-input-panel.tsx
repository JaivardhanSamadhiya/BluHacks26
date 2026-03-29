"use client";

interface LiveInputPanelProps {
  isListening: boolean;
  transcript: string;
}

export function LiveInputPanel({ isListening, transcript }: LiveInputPanelProps) {
  return (
    <div className="bg-[#16161a] border border-[rgba(255,255,255,0.07)] rounded-xl p-4 flex flex-col gap-4">
      {/* Camera Preview Area */}
      <div className="aspect-video bg-[#0a0a0c] rounded-lg border-2 border-dashed border-[rgba(255,255,255,0.12)] flex items-center justify-center">
        <span className="font-mono text-xs text-[#6b6b7a] tracking-wide">
          Gemini Live Feed
        </span>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isListening
              ? "bg-green-500 animate-pulse-dot"
              : "bg-[#6b6b7a]"
          }`}
        />
        <span className="font-mono text-xs text-[#6b6b7a]">
          {isListening ? "Listening..." : "Standby"}
        </span>
      </div>

      {/* Transcript */}
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#6b6b7a]">
          Transcript
        </label>
        <textarea
          readOnly
          value={transcript}
          placeholder="Voice transcript appears here..."
          className="w-full h-20 bg-[#0a0a0c] border border-[rgba(255,255,255,0.07)] rounded-lg p-3 font-mono text-xs text-[#e8e8ec] placeholder:text-[#6b6b7a] resize-none focus:outline-none"
        />
      </div>
    </div>
  );
}
