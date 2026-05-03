interface Props {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export function PrivacyToggle({ enabled, onChange }: Props) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none rounded-lg border border-company-border bg-company-surface/80 px-3 py-2">
      <span className="text-sm text-company-muted">Mask PII</span>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={`w-10 h-6 rounded-full transition-colors duration-200 border ${
            enabled ? 'bg-company-red border-company-red' : 'bg-company-panel border-company-border'
          }`}
        />
        <div
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </div>
      {enabled && (
        <span className="text-xs font-semibold text-company-red uppercase tracking-wide">
          Active
        </span>
      )}
    </label>
  )
}
