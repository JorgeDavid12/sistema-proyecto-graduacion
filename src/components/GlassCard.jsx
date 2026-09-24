export default function GlassCard({ children, className = "" }) {
  return <div className={`glass-panel rounded-lg ${className}`}>{children}</div>;
}
