'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Note {
  slug: string;
  system: string;
  systemZh: string;
  disease: string;
  diseaseZh: string;
  status: 'todo' | 'in-progress' | 'done';
  updatedAt: string;
}

const COLUMNS = [
  { id: 'todo', title: '待学习', dotColor: '#71717a', badgeBg: 'rgba(113,113,122,0.2)', badgeColor: '#a1a1aa' },
  { id: 'in-progress', title: '进行中', dotColor: '#f59e0b', badgeBg: 'rgba(245,158,11,0.2)', badgeColor: '#f59e0b' },
  { id: 'done', title: '已完成', dotColor: '#22c55e', badgeBg: 'rgba(34,197,94,0.2)', badgeColor: '#22c55e' },
];

const SYSTEMS = [
  { key: 'breast', zh: '乳腺', emoji: '🔬', color: '#f472b6' },
  { key: 'lung', zh: '肺部', emoji: '🫁', color: '#60a5fa' },
  { key: 'gi', zh: '消化', emoji: '🟠', color: '#fb923c' },
];

const MODULES = [
  { href: '/knowledge', label: '知识库', icon: '📚', desc: '按病种学习', color: '#6366f1' },
  { href: '/markers', label: '标记物', icon: '🧪', desc: '免疫组化标记物', color: '#34d399' },
  { href: '/subspecialty', label: '亚专科', icon: '🏥', desc: '亚专科方向学习', color: '#a78bfa' },
  { href: '/guidelines', label: '指南', icon: '📋', desc: '临床指南汇总', color: '#f59e0b' },
  { href: '/literature', label: '文献', icon: '📖', desc: '参考文献管理', color: '#60a5fa' },
];

export default function KanbanPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSystem, setFilterSystem] = useState<string>('all');

  useEffect(() => {
    fetch('/api/notes')
      .then(r => r.json())
      .then(data => { setNotes(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filterSystem === 'all' ? notes : notes.filter(n => n.system === filterSystem);

  const counts = {
    todo: filtered.filter(n => n.status === 'todo').length,
    'in-progress': filtered.filter(n => n.status === 'in-progress').length,
    done: filtered.filter(n => n.status === 'done').length,
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'transparent' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>病理学习看板</h1>
              <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--muted)' }}>
                {loading ? '加载中...' : `共 ${notes.length} 个病种 · ${filterSystem === 'all' ? '全部系统' : SYSTEMS.find(s => s.key === filterSystem)?.zh}`}
              </p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mb-1" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              <button
                onClick={() => setFilterSystem('all')}
                style={{
                  backgroundColor: filterSystem === 'all' ? 'var(--accent)' : 'var(--card-hover)',
                  color: filterSystem === 'all' ? '#fff' : 'var(--muted)',
                }}
                className="px-3 py-2.5 rounded-full text-xs font-medium transition-colors flex-shrink-0 min-h-touch"
              >
                全部
              </button>
              {SYSTEMS.map(s => (
                <button
                  key={s.key}
                  onClick={() => setFilterSystem(s.key)}
                  style={{
                    backgroundColor: filterSystem === s.key ? 'var(--accent)' : 'var(--card-hover)',
                    color: filterSystem === s.key ? '#fff' : 'var(--muted)',
                  }}
                  className="px-3 py-2.5 rounded-full text-xs font-medium transition-colors flex-shrink-0 min-h-touch"
                >
                  {s.emoji} {s.zh}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Quick Module Navigation */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--muted)' }}>学习模块</h2>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {MODULES.map(m => (
              <Link
                key={m.href}
                href={m.href}
                className="flex-shrink-0 rounded-xl p-4 border transition-all hover:shadow-md"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', minWidth: '140px' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = m.color; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)'; }}
              >
                <div className="text-2xl mb-2">{m.icon}</div>
                <div className="font-medium text-sm" style={{ color: m.color }}>{m.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{m.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Kanban Board */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse" style={{ color: 'var(--muted)' }}>加载中...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map(col => (
              <div key={col.id} className="flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.dotColor }} />
                    <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{col.title}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: col.badgeBg, color: col.badgeColor }}>
                    {counts[col.id as keyof typeof counts]}
                  </span>
                </div>

                <div className="flex-1 rounded-xl border p-3 space-y-2 min-h-[160px]" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                  {filtered.filter(n => n.status === col.id).length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-sm" style={{ color: 'var(--muted)', opacity: 0.5 }}>
                      {col.id === 'todo' ? '暂无待学习内容' : col.id === 'in-progress' ? '暂无进行中' : '暂无已完成'}
                    </div>
                  ) : (
                    filtered.filter(n => n.status === col.id).map(note => {
                      const sys = SYSTEMS.find(s => s.key === note.system);
                      return (
                        <Link
                          key={note.slug}
                          href={`/knowledge/${note.system}/${note.slug}`}
                          className="block rounded-xl p-3 border transition-all active:scale-95"
                          style={{ backgroundColor: 'var(--card-hover)', borderColor: 'var(--border)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--accent)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)'; }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-sm font-semibold" style={{ color: sys?.color || 'var(--foreground)' }}>
                              {sys?.emoji} {note.diseaseZh}
                            </span>
                          </div>
                          <div className="text-xs" style={{ color: 'var(--muted)' }}>{note.disease}</div>
                          <div className="text-xs mt-1" style={{ color: 'var(--muted)', opacity: 0.5 }}>{note.updatedAt}</div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8">
          <div className="flex sm:grid sm:grid-cols-3 gap-3 overflow-x-auto pb-2 sm:pb-0 -mb-2 sm:mb-0" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {SYSTEMS.map(sys => {
              const total = notes.filter(n => n.system === sys.key).length;
              const done = notes.filter(n => n.system === sys.key && n.status === 'done').length;
              const pct = total > 0 ? (done / total) * 100 : 0;
              return (
                <div
                  key={sys.key}
                  className="flex-shrink-0 sm:flex-shrink rounded-xl p-4 w-36 sm:w-auto"
                  style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <div className="text-2xl mb-1">{sys.emoji}</div>
                  <div className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{sys.zh}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{done}/{total} 已完成</div>
                  <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: sys.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
