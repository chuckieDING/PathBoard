'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MarkerModal } from '@/components/MarkerModal';

interface Marker {
  slug: string;
  name: string;
  nameEn: string;
  abbreviation: string;
  system: string;
  function: string;
  interpretation: string;
  clinicalSignificance: string;
  relatedDiseases: string[];
  relatedTargetedTherapies: string[];
  content: string;
}

interface RelatedDisease {
  disease: string;
  diseaseZh: string;
  system: string;
  slug: string;
}

const MARKER_CATEGORIES = [
  { key: 'all', label: '全部', icon: '🔬' },
  { key: 'breast', label: '乳腺', icon: '🩷' },
  { key: 'lung', label: '肺部', icon: '🫁' },
  { key: 'gi', label: '消化', icon: '🟠' },
];

export default function MarkersPage() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [diseaseMap, setDiseaseMap] = useState<Record<string, RelatedDisease[]>>({});
  const [loading, setLoading] = useState(true);
  const [filterSystem, setFilterSystem] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarker, setSelectedMarker] = useState<{ slug: string; content: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/markers').then(r => r.json()),
      fetch('/api/marker-diseases').then(r => r.json()),
    ])
      .then(([markersData, mapData]) => {
        setMarkers(Array.isArray(markersData) ? markersData : []);
        setDiseaseMap(mapData || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = markers.filter(m => {
    const matchSystem = filterSystem === 'all' || m.system.includes(filterSystem === 'breast' ? '乳腺' : filterSystem === 'lung' ? '肺' : '消化');
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.nameEn.toLowerCase().includes(q) || m.slug.toLowerCase().includes(q) || m.abbreviation.toLowerCase().includes(q);
    return matchSystem && matchSearch;
  });

  // Group markers by function category
  const grouped: Record<string, Marker[]> = {};
  for (const m of filtered) {
    const category = m.system || '其他';
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(m);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--muted)' }}>
          <Link href="/" className="hover:opacity-80" style={{ color: 'var(--muted)' }}>看板</Link>
          <span>/</span>
          <span style={{ color: 'var(--foreground)' }}>标记物学习</span>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>🧪 免疫组化标记物</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          浏览和学习病理诊断中常用的免疫组化标记物，了解其判读标准和临床意义
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>
          <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '1rem' }}>🔍</span>
          <input
            type="text"
            placeholder="搜索标记物名称、缩写..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 0.875rem 0.75rem 2.5rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--foreground)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {MARKER_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilterSystem(cat.key)}
              style={{
                backgroundColor: filterSystem === cat.key ? 'var(--accent)' : 'var(--card-hover)',
                color: filterSystem === cat.key ? '#fff' : 'var(--muted)',
              }}
              className="px-3 py-2 rounded-full text-xs font-medium transition-colors flex-shrink-0"
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6 overflow-x-auto pb-1">
        <div className="rounded-xl p-4 flex-shrink-0" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', minWidth: '120px' }}>
          <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{markers.length}</div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>总标记物数</div>
        </div>
        <div className="rounded-xl p-4 flex-shrink-0" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', minWidth: '120px' }}>
          <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{filtered.length}</div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>当前筛选</div>
        </div>
        <div className="rounded-xl p-4 flex-shrink-0" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', minWidth: '120px' }}>
          <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{Object.keys(grouped).length}</div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>系统分类</div>
        </div>
      </div>

      {/* Marker list */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse" style={{ color: 'var(--muted)' }}>加载中...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
          <div className="text-4xl mb-3">🔍</div>
          <p>未找到匹配的标记物</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(marker => {
            const related = diseaseMap[marker.slug] || diseaseMap[marker.name] || [];
            return (
              <div
                key={marker.slug}
                className="rounded-xl border p-5 transition-all hover:shadow-md cursor-pointer"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                onClick={() => setSelectedMarker({ slug: marker.slug, content: marker.content })}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
              >
                {/* Marker name */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-mono font-bold text-base" style={{ color: 'var(--foreground)' }}>
                      {marker.abbreviation || marker.nameEn || marker.slug}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {marker.name}
                    </div>
                  </div>
                  {marker.system && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--card-hover)', color: 'var(--muted)' }}>
                      {marker.system}
                    </span>
                  )}
                </div>

                {/* Function */}
                {marker.function && (
                  <p className="text-xs mb-3 leading-relaxed line-clamp-2" style={{ color: 'var(--muted)' }}>
                    {marker.function}
                  </p>
                )}

                {/* Related diseases */}
                {(marker.relatedDiseases.length > 0 || related.length > 0) && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(marker.relatedDiseases.length > 0 ? marker.relatedDiseases : related.map(r => r.diseaseZh)).slice(0, 3).map((d, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                        {d}
                      </span>
                    ))}
                    {(marker.relatedDiseases.length > 3 || related.length > 3) && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--card-hover)', color: 'var(--muted)' }}>
                        +{Math.max(marker.relatedDiseases.length, related.length) - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Targeted therapies */}
                {marker.relatedTargetedTherapies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {marker.relatedTargetedTherapies.slice(0, 2).map((drug, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                        {drug}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-xs mt-3" style={{ color: 'var(--muted)' }}>点击查看详情 →</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedMarker && (
        <MarkerModal
          slug={selectedMarker.slug}
          content={selectedMarker.content}
          relatedDiseases={diseaseMap[selectedMarker.slug]}
          onClose={() => setSelectedMarker(null)}
        />
      )}
    </div>
  );
}
