'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface LiteratureItem {
  title: string;
  journal: string;
  year: number;
  pmid?: string;
  pmcid?: string;
  summary: string;
  url?: string;
  localHtml?: string;
  jumpUrl?: string;
}

interface DiseaseLiterature {
  disease: string;
  diseaseZh: string;
  system: string;
  systemZh: string;
  slug: string;
  literature: LiteratureItem[];
}

const SYSTEM_COLORS: Record<string, string> = {
  breast: '#f472b6',
  lung: '#60a5fa',
  gi: '#fb923c',
};

export default function LiteraturePage() {
  const [data, setData] = useState<DiseaseLiterature[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSystem, setFilterSystem] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'year' | 'disease'>('year');

  useEffect(() => {
    fetch('/api/literature-list')
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Flatten all literature into one list for unified view
  const allLiterature: (LiteratureItem & { disease: string; diseaseZh: string; system: string; slug: string })[] = [];
  for (const d of data) {
    if (filterSystem !== 'all' && d.system !== filterSystem) continue;
    for (const lit of d.literature) {
      const q = searchQuery.toLowerCase();
      if (q && !lit.title.toLowerCase().includes(q) && !lit.journal.toLowerCase().includes(q) && !lit.summary.toLowerCase().includes(q) && !d.diseaseZh.includes(q)) {
        continue;
      }
      allLiterature.push({ ...lit, disease: d.disease, diseaseZh: d.diseaseZh, system: d.system, slug: d.slug });
    }
  }

  // Sort
  if (sortBy === 'year') {
    allLiterature.sort((a, b) => b.year - a.year);
  } else {
    allLiterature.sort((a, b) => a.diseaseZh.localeCompare(b.diseaseZh));
  }

  // Group by year for timeline view
  const byYear: Record<number, typeof allLiterature> = {};
  for (const lit of allLiterature) {
    if (!byYear[lit.year]) byYear[lit.year] = [];
    byYear[lit.year].push(lit);
  }
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--muted)' }}>
        <Link href="/" className="hover:opacity-80" style={{ color: 'var(--muted)' }}>看板</Link>
        <span>/</span>
        <span style={{ color: 'var(--foreground)' }}>文献管理</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>📚 文献管理</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          汇总各病种参考文献，按年份时间线浏览，快速定位关键研究
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>
          <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>🔍</span>
          <input
            type="text"
            placeholder="搜索文献标题、期刊..."
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
          <div style={{ borderLeft: '1px solid var(--border)', margin: '0 0.25rem' }} />
          {[{ key: 'year' as const, label: '按年份' }, { key: 'disease' as const, label: '按病种' }].map(s => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className="px-3 py-2 rounded-full text-xs font-medium transition-colors"
              style={{
                backgroundColor: sortBy === s.key ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: sortBy === s.key ? 'var(--accent)' : 'var(--muted)',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6 overflow-x-auto pb-1">
        <div className="rounded-xl p-4 flex-shrink-0" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{allLiterature.length}</div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>篇文献</div>
        </div>
        <div className="rounded-xl p-4 flex-shrink-0" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{years.length}</div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>个年份</div>
        </div>
        <div className="rounded-xl p-4 flex-shrink-0" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
            {new Set(allLiterature.map(l => l.journal)).size}
          </div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>个期刊</div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse" style={{ color: 'var(--muted)' }}>加载中...</div>
        </div>
      ) : allLiterature.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
          <div className="text-4xl mb-3">📚</div>
          <p>暂无文献数据</p>
        </div>
      ) : (
        <div className="space-y-8">
          {years.map(year => (
            <div key={year}>
              {/* Year header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{year}</div>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--card-hover)', color: 'var(--muted)' }}>
                  {byYear[year].length} 篇
                </span>
              </div>

              {/* Literature cards */}
              <div className="space-y-3">
                {byYear[year].map((lit, i) => {
                  const localHtmlPath = lit.localHtml
                    ? `/literature/${lit.system}/${lit.slug}/${lit.localHtml}`
                    : lit.pmcid
                      ? `/literature/${lit.system}/${lit.slug}/${lit.pmcid}.html`
                      : null;
                  const jumpLink = lit.jumpUrl || (lit.pmid
                    ? (lit.pmcid ? `https://pmc.ncbi.nlm.nih.gov/articles/${lit.pmcid}/` : `https://pubmed.ncbi.nlm.nih.gov/${lit.pmid}/`)
                    : lit.url);

                  return (
                    <div
                      key={i}
                      className="rounded-xl border p-5 transition-all"
                      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Disease tag */}
                        <Link
                          href={`/knowledge/${lit.system}/${lit.slug}`}
                          className="text-xs px-2 py-1 rounded-lg flex-shrink-0 font-medium hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: (SYSTEM_COLORS[lit.system] || '#6366f1') + '20', color: SYSTEM_COLORS[lit.system] || '#6366f1' }}
                        >
                          {lit.diseaseZh}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-sm leading-snug mb-2" style={{ color: 'var(--foreground)' }}>{lit.title}</h3>
                          <div className="flex items-center gap-3 text-xs mb-2" style={{ color: 'var(--muted)' }}>
                            <span>{lit.journal}</span>
                            {lit.pmid && <><span>·</span><span>PMID: {lit.pmid}</span></>}
                            {lit.pmcid && <><span>·</span><span>PMC: {lit.pmcid}</span></>}
                          </div>
                          <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--foreground)', opacity: 0.8 }}>{lit.summary}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            {localHtmlPath && (
                              <a href={localHtmlPath} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
                                style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                                在线阅读
                              </a>
                            )}
                            {jumpLink && (
                              <a href={jumpLink} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
                                style={{ backgroundColor: 'var(--card-hover)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                                源地址 ↗
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
