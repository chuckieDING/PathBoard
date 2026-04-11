'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

interface Note {
  slug: string;
  system: string;
  systemZh: string;
  disease: string;
  diseaseZh: string;
  status: 'todo' | 'in-progress' | 'done';
}

interface Marker {
  slug: string;
  name: string;
  nameEn: string;
  content: string;
}

const SYSTEMS = [
  { key: 'breast', zh: '乳腺病理', emoji: '🔬', accentColor: '#f472b6' },
  { key: 'lung', zh: '肺部病理', emoji: '🫁', accentColor: '#60a5fa' },
  { key: 'gi', zh: '消化系统病理', emoji: '🟠', accentColor: '#fb923c' },
];

export default function KnowledgePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/notes').then(r => r.json()),
      fetch('/api/markers').then(r => r.json()),
    ])
      .then(([notesData, markersData]) => {
        setNotes(Array.isArray(notesData) ? notesData : []);
        setMarkers(Array.isArray(markersData) ? markersData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Search results computed from already-loaded data (no redundant fetches)
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return null;

    const matchedDiseases = notes.filter(n =>
      n.diseaseZh.includes(q) || n.disease.toLowerCase().includes(q) || n.systemZh.includes(q)
    );

    const matchedMarkers = markers
      .filter(m => m.slug.toLowerCase().includes(q) || m.name?.toLowerCase().includes(q) || m.nameEn?.toLowerCase().includes(q) || m.content?.toLowerCase().includes(q))
      .map(m => ({ slug: m.slug, name: m.name || m.nameEn || m.slug }));

    return { diseases: matchedDiseases, markers: matchedMarkers };
  }, [searchQuery, notes, markers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse" style={{ color: 'var(--muted)' }}>加载中...</div>
      </div>
    );
  }

  const totalDone = notes.filter(n => n.status === 'done').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--muted)' }}>
          <Link href="/" className="hover:opacity-80" style={{ color: 'var(--muted)' }}>看板</Link>
          <span>/</span>
          <span style={{ color: 'var(--foreground)' }}>知识库</span>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>📚 病理知识库</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          覆盖乳腺、肺部、消化系统三大方向的病理学学习笔记 · {totalDone}/{notes.length} 已完成
        </p>
      </div>

      {/* Quick nav to related modules */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <Link href="/markers" className="text-xs px-3 py-2 rounded-full transition-colors flex-shrink-0" style={{ backgroundColor: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
          🧪 标记物学习
        </Link>
        <Link href="/subspecialty" className="text-xs px-3 py-2 rounded-full transition-colors flex-shrink-0" style={{ backgroundColor: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)' }}>
          🏥 亚专科学习
        </Link>
        <Link href="/guidelines" className="text-xs px-3 py-2 rounded-full transition-colors flex-shrink-0" style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.25)' }}>
          📋 临床指南
        </Link>
        <Link href="/literature" className="text-xs px-3 py-2 rounded-full transition-colors flex-shrink-0" style={{ backgroundColor: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
          📖 文献管理
        </Link>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: '480px' }}>
          <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '1rem' }}>🔍</span>
          <input
            type="text"
            placeholder="搜索病种、标记物..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 0.875rem 0.75rem 2.5rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--foreground)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        {searchResults && (
          <div style={{ marginTop: '0.5rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', maxWidth: '480px' }}>
            {searchResults.diseases.length === 0 && searchResults.markers.length === 0 && (
              <div style={{ padding: '1rem', color: 'var(--muted)', textAlign: 'center' }}>未找到相关病种或标记物</div>
            )}
            {searchResults.diseases.length > 0 && (
              <div>
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', background: 'var(--card-hover)', fontWeight: 600 }}>病种</div>
                {searchResults.diseases.map((d: Note) => (
                  <Link key={d.slug} href={`/knowledge/${d.system}/${d.slug}`}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--foreground)', textDecoration: 'none' }}
                    onClick={() => setSearchQuery('')}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--card-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div><div style={{ fontWeight: 500 }}>{d.diseaseZh}</div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{d.disease}</div></div>
                    <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>→</span>
                  </Link>
                ))}
              </div>
            )}
            {searchResults.markers.length > 0 && (
              <div>
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', background: 'var(--card-hover)', fontWeight: 600 }}>标记物</div>
                {searchResults.markers.map((m: { slug: string; name: string }) => (
                  <Link key={m.slug} href="/markers"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--foreground)', textDecoration: 'none' }}
                    onClick={() => setSearchQuery('')}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--card-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontWeight: 500 }}>{m.name || m.slug}</div>
                    <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>↗</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {SYSTEMS.map(sys => {
        const sysNotes = notes.filter(n => n.system === sys.key);
        const done = sysNotes.filter(n => n.status === 'done').length;
        return (
          <div
            key={sys.key}
            className="mb-8 border rounded-2xl p-6"
            style={{ borderColor: 'rgba(0,0,0,0.1)', backgroundColor: 'var(--card)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{sys.emoji}</span>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: sys.accentColor }}>{sys.zh}</h2>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{done}/{sysNotes.length} 已完成学习</p>
                </div>
              </div>
              <div className="text-xs px-3 py-1 rounded-full border" style={{ color: sys.accentColor, borderColor: 'rgba(0,0,0,0.1)' }}>
                {sysNotes.length} 个病种
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sysNotes.length === 0 ? (
                <div className="text-sm col-span-full py-8 text-center" style={{ color: 'var(--muted)', opacity: 0.5 }}>
                  暂无笔记，AI 正在生成中...
                </div>
              ) : (
                sysNotes.map(note => {
                  const dotColor = note.status === 'done' ? '#22c55e' : note.status === 'in-progress' ? '#f59e0b' : 'var(--muted)';
                  const borderAccent = note.status === 'in-progress' ? 'rgba(245,158,11,0.3)' : 'var(--border)';
                  return (
                    <Link
                      key={note.slug}
                      href={`/knowledge/${note.system}/${note.slug}`}
                      className="group block rounded-xl p-4 border transition-all"
                      style={{ backgroundColor: 'var(--card-hover)', borderColor: borderAccent }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = sys.accentColor; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = borderAccent; }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-sm mb-0.5" style={{ color: 'var(--foreground)' }}>{note.diseaseZh}</div>
                          <div className="text-xs" style={{ color: 'var(--muted)' }}>{note.disease}</div>
                        </div>
                        <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: dotColor }} />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
