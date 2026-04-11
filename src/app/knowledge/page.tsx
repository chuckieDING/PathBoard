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
}

const SYSTEMS = [
  { key: 'breast', zh: '乳腺病理', emoji: '🔬', accentColor: '#f472b6' },
  { key: 'lung', zh: '肺部病理', emoji: '🫁', accentColor: '#60a5fa' },
  { key: 'gi', zh: '消化系统病理', emoji: '🟠', accentColor: '#fb923c' },
];

export default function KnowledgePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    diseases: Note[];
    markers: { slug: string; name: string }[];
  } | null>(null);

  useEffect(() => {
    fetch('/api/notes')
      .then(r => r.json())
      .then(data => { setNotes(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Search handler with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const [notesRes, markersRes] = await Promise.all([
          fetch('/api/notes'),
          fetch('/api/markers')
        ]);
        const allNotes = await notesRes.json();
        const allMarkers = await markersRes.json();
        const q = searchQuery.toLowerCase();

        // Search diseases
        const matchedDiseases = allNotes.filter((n: Note) =>
          n.diseaseZh.includes(q) || n.disease.toLowerCase().includes(q) || n.systemZh.includes(q)
        );

        // Search markers
        const matchedMarkers = allMarkers.filter((m: { slug: string; content: string }) =>
          m.slug.toLowerCase().includes(q) || m.content.toLowerCase().includes(q)
        ).map((m: { slug: string; content: string }) => {
          const nameMatch = m.content.match(/^标记物:\s*(.+)$/m);
          return { slug: m.slug, name: nameMatch ? nameMatch[1] : m.slug };
        });

        setSearchResults({ diseases: matchedDiseases, markers: matchedMarkers });
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse" style={{ color: 'var(--muted)' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>📚 病理知识库</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>覆盖乳腺、肺部、消化系统三大方向的病理学学习笔记</p>
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
                    onClick={() => { setSearchQuery(''); setSearchResults(null); }}
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
                  <div key={m.slug}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--foreground)', cursor: 'pointer' }}
                    onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--card-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontWeight: 500 }}>{m.name || m.slug}</div>
                    <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>↗</span>
                  </div>
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
              <div
                className="text-xs px-3 py-1 rounded-full border"
                style={{ color: sys.accentColor, borderColor: 'rgba(0,0,0,0.1)' }}
              >
                {sysNotes.length} 个病种
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sysNotes.length === 0 ? (
                <div
                  className="text-sm col-span-full py-8 text-center"
                  style={{ color: 'var(--muted)', opacity: 0.5 }}
                >
                  暂无笔记，AI 正在生成中...
                </div>
              ) : (
                sysNotes.map(note => {
                  const dotColor = note.status === 'done' ? '#22c55e' : note.status === 'in-progress' ? '#f59e0b' : 'var(--muted)';
                  const borderAccent = note.status === 'done' ? 'var(--border)' : note.status === 'in-progress' ? 'rgba(245,158,11,0.3)' : 'var(--border)';
                  return (
                    <Link
                      key={note.slug}
                      href={`/knowledge/${note.system}/${note.slug}`}
                      className="group block rounded-xl p-4 border transition-all"
                      style={{ backgroundColor: 'var(--card-hover)', borderColor: borderAccent }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLAnchorElement).style.borderColor = sys.accentColor;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLAnchorElement).style.borderColor = borderAccent;
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-sm mb-0.5" style={{ color: 'var(--foreground)' }}>{note.diseaseZh}</div>
                          <div className="text-xs" style={{ color: 'var(--muted)' }}>{note.disease}</div>
                        </div>
                        <div
                          className="w-2 h-2 rounded-full mt-1.5"
                          style={{ backgroundColor: dotColor }}
                        />
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
