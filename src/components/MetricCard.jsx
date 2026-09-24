import { ArrowUpRight, AlertTriangle, Activity } from "lucide-react";

const tones = {
  green: "border-emeraldTech/25 bg-emeraldTech/10 text-emeraldTech",
  cyan: "border-cyberCyan/25 bg-cyberCyan/10 text-cyberCyan",
  amber: "border-alertAmber/30 bg-alertAmber/12 text-alertAmber",
};

export default function MetricCard({ label, value, trend, tone = "green" }) {
  const Icon = tone === "amber" ? AlertTriangle : tone === "cyan" ? Activity : ArrowUpRight;

  return (
    <div className="rounded-lg border border-warmWhite/10 bg-warmWhite/[0.055] p-4 shadow-glass transition hover:-translate-y-1 hover:border-emeraldTech/25">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-warmWhite/62">{label}</p>
        <span className={`rounded-lg border p-2 ${tones[tone]}`}>
          <Icon size={17} />
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <strong className="text-2xl font-semibold text-white">{value}</strong>
        <span className="rounded-lg bg-warmWhite/8 px-2 py-1 text-xs text-warmWhite/70">
          {trend}
        </span>
      </div>
    </div>
  );
}
