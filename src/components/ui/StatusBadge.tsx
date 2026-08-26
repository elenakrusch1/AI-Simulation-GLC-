import type { BadgeTone } from "@/lib/status-labels";

const TONE_CLASSES: Record<BadgeTone, string> = {
  open: "bg-status-open-bg text-status-open",
  closed: "bg-status-closed-bg text-status-closed",
  locked: "bg-status-locked-bg text-status-locked",
  draft: "bg-status-draft-bg text-status-draft",
  submitted: "bg-status-submitted-bg text-status-submitted",
  neutral: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ label, tone }: { label: string; tone: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}
