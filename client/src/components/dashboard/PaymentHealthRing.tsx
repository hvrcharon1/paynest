import { useMemo, type CSSProperties } from 'react'
import { CATEGORY_META } from '@/lib/categories'
import type { ExternalService } from '@/types'

interface PaymentHealthRingProps {
  score: number
  services: ExternalService[]
}

const SIZE = 220
const STROKE = 14
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function scoreColor(score: number): string {
  if (score >= 85) return '#34D399'
  if (score >= 60) return '#FBBF24'
  return '#F87171'
}

export function PaymentHealthRing({ score, services }: PaymentHealthRingProps) {
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE
  const color = scoreColor(score)

  // category arc segments around the outer ring, proportional to active service count per category
  const segments = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of services) {
      if (s.status === 'paused') continue
      counts[s.category] = (counts[s.category] ?? 0) + 1
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
    let cursor = 0
    return Object.entries(counts).map(([cat, count]) => {
      const fraction = count / total
      const start = cursor
      cursor += fraction
      return { cat, fraction, start, color: CATEGORY_META[cat as keyof typeof CATEGORY_META].color }
    })
  }, [services])

  const outerRadius = RADIUS + STROKE + 4
  const outerCirc = 2 * Math.PI * outerRadius

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: SIZE + 24, height: SIZE + 24 }}>
      <svg width={SIZE + 24} height={SIZE + 24} viewBox={`0 0 ${SIZE + 24} ${SIZE + 24}`} className="-rotate-90">
        {/* outer category segments */}
        {segments.map(({ cat, fraction, start, color: segColor }) => (
          <circle
            key={cat}
            cx={(SIZE + 24) / 2}
            cy={(SIZE + 24) / 2}
            r={outerRadius}
            fill="none"
            stroke={segColor}
            strokeWidth={4}
            strokeDasharray={`${Math.max(0, fraction * outerCirc - 2)} ${outerCirc}`}
            strokeDashoffset={-start * outerCirc}
            strokeLinecap="round"
            opacity={0.85}
          />
        ))}

        {/* track */}
        <circle
          cx={(SIZE + 24) / 2}
          cy={(SIZE + 24) / 2}
          r={RADIUS}
          fill="none"
          stroke="#1E293B"
          strokeWidth={STROKE}
        />

        {/* score arc */}
        <circle
          cx={(SIZE + 24) / 2}
          cy={(SIZE + 24) / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={
            {
              '--ring-circumference': CIRCUMFERENCE,
              '--ring-offset': offset,
            } as CSSProperties
          }
          className="animate-ring-fill"
        />
      </svg>

      <div className="absolute flex flex-col items-center">
        <span className="font-display text-4xl font-bold text-text-primary tabular">{score}</span>
        <span className="text-xs text-text-muted mt-1">Payment health</span>
      </div>
    </div>
  )
}
