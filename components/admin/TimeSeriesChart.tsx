'use client';

import { useState } from 'react';

interface Snapshot {
  snapshot_date: string;
  total_submitted: number;
  total_votes: number;
  total_views: number;
  total_shares: number;
}

type SeriesKey = 'total_submitted' | 'total_votes' | 'total_views' | 'total_shares';

const SERIES_CONFIG: Record<SeriesKey, { label: string; color: string }> = {
  total_submitted: { label: 'Submitted', color: '#D4663F' },
  total_votes: { label: 'Votes', color: '#1F8A7A' },
  total_views: { label: 'Views', color: '#7A2935' },
  total_shares: { label: 'Shares', color: '#E8A93C' },
};

export function TimeSeriesChart({ data }: { data: Snapshot[] }) {
  const [active, setActive] = useState<SeriesKey>('total_votes');

  if (!data || data.length === 0) {
    return <div className="text-sm text-warm-gray">No snapshots yet.</div>;
  }

  // Layout
  const W = 800;
  const H = 240;
  const padX = 40;
  const padY = 30;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  // Compute scale for active series
  const values = data.map((d) => d[active] || 0);
  const max = Math.max(...values, 1);
  const min = 0;

  // Convert to points
  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = padY + (1 - ((d[active] || 0) - min) / (max - min)) * innerH;
    return { x, y, value: d[active] || 0, date: d.snapshot_date };
  });

  // Build path
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // Area under curve
  const areaD =
    pathD +
    ` L ${points[points.length - 1].x.toFixed(1)} ${(padY + innerH).toFixed(1)}` +
    ` L ${points[0].x.toFixed(1)} ${(padY + innerH).toFixed(1)} Z`;

  const config = SERIES_CONFIG[active];

  return (
    <div>
      {/* Series toggle */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(SERIES_CONFIG) as SeriesKey[]).map((key) => {
          const cfg = SERIES_CONFIG[key];
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                isActive ? 'border-navy bg-navy text-cream' : 'border-line bg-white text-navy hover:bg-cream'
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: cfg.color }}
              />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 600 }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
            <line
              key={frac}
              x1={padX}
              x2={padX + innerW}
              y1={padY + frac * innerH}
              y2={padY + frac * innerH}
              stroke="rgba(31, 58, 79, 0.08)"
              strokeWidth="1"
            />
          ))}

          {/* Y-axis labels */}
          {[0, 0.5, 1].map((frac) => {
            const val = Math.round(min + (1 - frac) * (max - min));
            return (
              <text
                key={frac}
                x={padX - 8}
                y={padY + frac * innerH}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="10"
                fill="#6B6055"
              >
                {val}
              </text>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill={config.color} fillOpacity="0.1" />

          {/* Line */}
          <path d={pathD} fill="none" stroke={config.color} strokeWidth="2.5" strokeLinejoin="round" />

          {/* Points + tooltips */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill={config.color} />
              <circle cx={p.x} cy={p.y} r="14" fill="transparent">
                <title>
                  {p.date}: {p.value} {config.label}
                </title>
              </circle>
            </g>
          ))}

          {/* X-axis labels (first, mid, last) */}
          {[0, Math.floor(data.length / 2), data.length - 1]
            .filter((idx, i, arr) => arr.indexOf(idx) === i)
            .map((idx) => {
              const p = points[idx];
              if (!p) return null;
              const date = new Date(p.date);
              const label = `${date.getDate()}/${date.getMonth() + 1}`;
              return (
                <text
                  key={idx}
                  x={p.x}
                  y={H - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6B6055"
                >
                  {label}
                </text>
              );
            })}
        </svg>
      </div>
    </div>
  );
}
