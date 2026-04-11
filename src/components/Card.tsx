'use client';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border p-5 ${className}`}
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="font-semibold mb-4 flex items-center gap-2"
      style={{ color: 'var(--foreground)' }}
    >
      {children}
    </h3>
  );
}
