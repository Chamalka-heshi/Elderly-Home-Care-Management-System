import React from "react";

export type BadgeTone = "emerald" | "amber" | "slate" | "red" | "purple" | "blue";

// Map qualitative intent to specific color schemes to maintain visual consistency in status messaging
const toneMap: Record<BadgeTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber:   "bg-amber-50 text-amber-700 ring-amber-100",
  slate:   "bg-slate-100 text-slate-700 ring-slate-200",
  red:     "bg-red-50 text-red-700 ring-red-100",
  purple:  "bg-purple-50 text-purple-700 ring-purple-100",
  blue:    "bg-blue-50 text-blue-700 ring-blue-100",
};

interface Props {
  tone:     BadgeTone;
  children: React.ReactNode;
}

// Compact UI element for displaying short status labels or categorical tags with distinct color tones
const Badge: React.FC<Props> = ({ tone, children }) => (
  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${toneMap[tone]}`}>
    {children}
  </span>
);

export default Badge;
