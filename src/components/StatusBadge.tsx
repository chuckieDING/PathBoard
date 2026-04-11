'use client';

type Status = 'todo' | 'in-progress' | 'done';

const STATUS_CONFIG: Record<Status, { label: string; bg: string; color: string }> = {
  'todo': { label: '待学习', bg: 'var(--card)', color: 'var(--muted)' },
  'in-progress': { label: '进行中', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  'done': { label: '已完成', bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: config.bg,
        color: config.color,
        border: '1px solid var(--border)',
      }}
    >
      {config.label}
    </span>
  );
}

export function StatusDot({ status }: { status: Status }) {
  const colors: Record<Status, string> = {
    'todo': 'var(--muted)',
    'in-progress': '#f59e0b',
    'done': '#22c55e',
  };
  return (
    <div
      className="w-2 h-2 rounded-full"
      style={{ backgroundColor: colors[status] }}
    />
  );
}
