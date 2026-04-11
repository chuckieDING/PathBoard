'use client';

interface IHCMarker {
  marker: string;
  result: string;
  description?: string;
}

function parseIntensity(result: string): { level: number; label: string; color: string } {
  const upper = result.toUpperCase();
  const percentMatch = result.match(/(\d+)%/);
  const percent = percentMatch ? parseInt(percentMatch[1]) : null;

  if (upper.includes('阴性') || upper === 'NEGATIVE' || (upper.includes('-') && !upper.includes('+/-'))) {
    return { level: 0, label: result, color: '#ef4444' };
  }
  if (upper.includes('1+') || upper.includes('弱') || upper.includes('LOW')) {
    return { level: 1, label: result, color: '#f97316' };
  }
  if (upper.includes('2+') || upper.includes('中') || upper.includes('MODERATE') || upper.includes('MOD')) {
    return { level: 2, label: result, color: '#eab308' };
  }
  if (upper.includes('3+') || upper.includes('强') || upper.includes('HIGH') || upper.includes('STRONG')) {
    return { level: 3, label: result, color: '#22c55e' };
  }
  if (upper.includes('阳性') || upper.includes('POSITIVE') || upper.includes('+')) {
    if (percent !== null) {
      if (percent < 10) return { level: 1, label: `${percent}%`, color: '#f97316' };
      if (percent < 50) return { level: 2, label: `${percent}%`, color: '#eab308' };
      return { level: 3, label: `${percent}%`, color: '#22c55e' };
    }
    return { level: 2, label: result, color: '#22c55e' };
  }
  return { level: 1, label: result, color: '#6b7280' };
}

export function MarkerCard({ marker, onClick }: { marker: IHCMarker; onClick?: () => void }) {
  const intensity = parseIntensity(marker.result);
  const levels = [0, 1, 2, 3];

  const zhMatch = marker.marker.match(/[（(]([^)）]+)[)）]$/);
  const zhLabel = zhMatch ? zhMatch[1] : null;
  const displayName = zhLabel ? marker.marker.replace(/[（(][^)）]+[)）]$/, '') : marker.marker;

  return (
    <div
      className="rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="font-mono font-bold text-base" style={{ color: 'var(--foreground)' }}>
            {displayName}
          </div>
          {zhLabel && (
            <div className="text-xs italic mt-0.5" style={{ color: 'var(--muted)' }}>
              {zhLabel}
            </div>
          )}
        </div>
        <span
          className="text-sm font-semibold px-2 py-1 rounded-lg shrink-0"
          style={{ backgroundColor: intensity.color + '20', color: intensity.color }}
        >
          {intensity.label}
        </span>
      </div>

      <div className="mb-2">
        <div className="flex gap-1.5">
          {levels.map(lvl => (
            <div
              key={lvl}
              className="h-2 flex-1 rounded-full transition-all"
              style={{
                backgroundColor: lvl <= intensity.level ? intensity.color : 'var(--border)',
                opacity: lvl <= intensity.level ? 1 : 0.4,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--muted)' }}>
          <span>阴性</span>
          <span>弱</span>
          <span>中</span>
          <span>强</span>
        </div>
      </div>

      {marker.description && (
        <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
          {marker.description}
        </p>
      )}
      <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
        点击查看详情 →
      </p>
    </div>
  );
}
