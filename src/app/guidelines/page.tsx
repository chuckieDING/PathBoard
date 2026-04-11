'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Guideline {
  name: string;
  summary: string;
  url?: string;
}

interface DiseaseGuidelines {
  disease: string;
  diseaseZh: string;
  system: string;
  systemZh: string;
  slug: string;
  guidelines: Guideline[];
}

const SYSTEM_COLORS: Record<string, string> = {
  breast: '#f472b6',
  lung: '#60a5fa',
  gi: '#fb923c',
};

const SYSTEM_ICONS: Record<string, string> = {
  breast: '🔬',
  lung: '🫁',
  gi: '🟠',
};

export default function GuidelinesPage() {
  const [data, setData] = useState<DiseaseGuidelines[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSystem, setFilterSystem] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/guidelines')
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = data.filter(d => {
    const matchSystem = filterSystem === 'all' || d.system === filterSystem;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      d.diseaseZh.includes(q) ||
      d.disease.toLowerCase().includes(q) ||
      d.guidelines.some(g => g.name.toLowerCase().includes(q) || g.summary.toLowerCase().includes(q));
    return matchSystem && matchSearch;
  });

  const totalGuidelines = filtered.reduce((sum, d) => sum + d.guidelines.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--muted)' }}>
        <Link href="/" className="hover:opacity-80" style={{ color: 'var(--muted)' }}>看板</Link>
        <span>/</span>
        <span style={{ color: 'var(--foreground)' }}>临床指南</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>📋 临床指南</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          汇总各病种相关的临床指南与共识，按系统分类浏览
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>
          <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>🔍</span>
          <input
            type="text"
            placeholder="搜索指南名称或内容..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 0.875rem 0.75rem 2.5rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--foreground)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div className="flex gap-2">
          {[{ key: 'all', label: '全部' }, { key: 'breast', label: '🔬 乳腺' }, { key: 'lung', label: '🫁 肺部' }, { key: 'gi', label: '🟠 消化' }].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterSystem(f.key)}
              className="px-3 py-2 rounded-full text-xs font-medium transition-colors"
              style={{
                backgroundColor: filterSystem === f.key ? 'var(--accent)' : 'var(--card-hover)',
                color: filterSystem === f.key ? '#fff' : 'var(--muted)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{totalGuidelines}</div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>条指南</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{filtered.length}</div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>个病种</div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse" style={{ color: 'var(--muted)' }}>加载中...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
          <div className="text-4xl mb-3">📋</div>
          <p>暂无指南数据</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map(item => (
            <div
              key={`${item.system}-${item.slug}`}
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            >
              {/* Disease header */}
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--card-hover)' }}>
                <div className="flex items-center gap-3">
                  <span>{SYSTEM_ICONS[item.system] || '📄'}</span>
                  <div>
                    <Link
                      href={`/knowledge/${item.system}/${item.slug}`}
                      className="font-semibold text-sm hover:opacity-80 transition-opacity"
                      style={{ color: SYSTEM_COLORS[item.system] || 'var(--foreground)' }}
                    >
                      {item.diseaseZh}
                    </Link>
                    <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>{item.disease}</span>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--card)', color: 'var(--muted)' }}>
                  {item.guidelines.length} 条
                </span>
              </div>

              {/* Guidelines list */}
              <div className="p-5 space-y-3">
                {item.guidelines.map((g, i) => (
                  <div key={i} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card-hover)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium text-sm" style={{ color: 'var(--accent)' }}>{g.name}</span>
                      {g.url && (
                        <a href={g.url} target="_blank" rel="noopener noreferrer" className="text-xs hover:opacity-80 flex-shrink-0" style={{ color: 'var(--muted)' }}>
                          查看原文 ↗
                        </a>
                      )}
                    </div>
                    <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--foreground)', opacity: 0.8 }}>{g.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
