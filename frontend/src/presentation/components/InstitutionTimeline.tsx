interface TimelineEntry {
  date: string
  reference: string
  title: string
  amount: number
  isAlert?: boolean
  alertMessage?: string
}

interface InstitutionTimelineProps {
  entries: TimelineEntry[]
  className?: string
}

export default function InstitutionTimeline({ entries, className = "" }: InstitutionTimelineProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {entries.map((entry, i) => (
        <div key={i} className="relative pl-6 border-l-2 border-outline-variant/20 pb-2">
          <div
            className={`absolute -left-[7px] top-0 w-3 h-3 rounded-full ${
              entry.isAlert ? "bg-error ring-4 ring-error/10" : "bg-outline-variant/50"
            }`}
          />
          <div className="flex justify-between text-[10px] font-bold text-outline mb-1">
            <span>{entry.date}</span>
            <span>{entry.reference}</span>
          </div>
          <p className={`text-sm font-semibold ${entry.isAlert ? "text-error" : "text-primary"}`}>
            {entry.title}: RD$ {entry.amount.toLocaleString()}
          </p>
          {entry.isAlert && entry.alertMessage && (
            <div className="mt-2 bg-error/5 p-3 rounded-xl border border-error/10">
              <p className="text-[11px] text-error leading-tight font-medium">{entry.alertMessage}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
