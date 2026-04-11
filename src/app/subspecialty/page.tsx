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
  ihcMarkers: { marker: string; result: string }[];
}

interface Marker {
  slug: string;
  name: string;
  nameEn: string;
  abbreviation: string;
  system: string;
}

const SUBSPECIALTIES = [
  { key: 'breast-pathology', zh: '乳腺病理', systems: ['breast'], icon: '🔬', color: '#f472b6',
    description: '乳腺良恶性肿瘤的诊断与鉴别，包括原位癌、浸润性癌及良性病变的组织学分型' },
  { key: 'pulmonary-pathology', zh: '肺部病理', systems: ['lung'], icon: '🫁', color: '#60a5fa',
    description: '肺部肿瘤及非肿瘤性疾病的病理诊断，涵盖腺癌、鳞癌等的分子分型' },
  { key: 'gi-pathology', zh: '消化病理', systems: ['gi'], icon: '🟠', color: '#fb923c',
    description: '消化道及肝胆胰肿瘤的病理学特征，包括间质瘤、腺癌等的诊断要点' },
  { key: 'molecular-pathology', zh: '分子病理', systems: ['breast', 'lung', 'gi'], icon: '🧬', color: '#a78bfa',
    description: '基因突变检测、分子分型和靶向治疗相关的分子病理学，跨越多个器官系统' },
  { key: 'immunohistochemistry', zh: '免疫组化', systems: ['breast', 'lung', 'gi'], icon: '🧪', color: '#34d399',
    description: '免疫组化标记物的选择、判读标准和临床应用，是精准诊断的核心技术' },
  { key: 'cytopathology', zh: '细胞病理', systems: ['breast', 'lung', 'gi'], icon: '🔭', color: '#fbbf24',
    description: '细针穿刺、脱落细胞学等非侵入性病理诊断方法及质量控制' },
];

export default function SubspecialtyPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--muted)' }}>
        <Link href="/" className="hover:opacity-80" style={{ color: 'var(--muted)' }}>看板</Link>
        <span>/</span>
        <span style={{ color: 'var(--foreground)' }}>亚专科学习</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>🏥 亚专科学习</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          按病理学亚专科方向组织学习内容，系统性掌握各亚专科的核心知识
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse" style={{ color: 'var(--muted)' }}>加载中...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {SUBSPECIALTIES.map(sub => {
            const relatedNotes = notes.filter(n => sub.systems.includes(n.system));
            const relatedMarkers = sub.key === 'immunohistochemistry'
              ? markers
              : sub.key === 'molecular-pathology'
                ? markers.filter(m => m.system?.includes('分子') || m.nameEn?.toLowerCase().includes('gene') || m.nameEn?.toLowerCase().includes('mutation'))
                : markers.filter(m => sub.systems.some(s => {
                    const sysZhMap: Record<string, string> = { breast: '乳腺', lung: '肺', gi: '消化' };
                    return m.system?.includes(sysZhMap[s] || '');
                  }));
            const doneCount = relatedNotes.filter(n => n.status === 'done').length;
            const pct = relatedNotes.length > 0 ? (doneCount / relatedNotes.length) * 100 : 0;

            return (
              <div
                key={sub.key}
                className="rounded-2xl border overflow-hidden"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
              >
                {/* Subspecialty Header */}
                <div className="p-6" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl flex-shrink-0">{sub.icon}</div>
                      <div>
                        <h2 className="text-lg font-bold" style={{ color: sub.color }}>{sub.zh}</h2>
                        <p className="text-sm mt-1 max-w-2xl" style={{ color: 'var(--muted)' }}>{sub.description}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold" style={{ color: sub.color }}>{relatedNotes.length}</div>
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>病种</div>
                    </div>
                  </div>

                  {/* Progress */}
                  {relatedNotes.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--muted)' }}>
                        <span>学习进度</span>
                        <span>{doneCount}/{relatedNotes.length} 已完成 ({Math.round(pct)}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: sub.color }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Content: Diseases + Markers */}
                <div className="p-6">
                  {/* Related diseases */}
                  {relatedNotes.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>相关病种</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {relatedNotes.map(note => {
                          const dotColor = note.status === 'done' ? '#22c55e' : note.status === 'in-progress' ? '#f59e0b' : 'var(--muted)';
                          return (
                            <Link
                              key={note.slug}
                              href={`/knowledge/${note.system}/${note.slug}`}
                              className="flex items-center gap-3 rounded-lg p-3 transition-all"
                              style={{ backgroundColor: 'var(--card-hover)' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = sub.color; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'transparent'; }}
                            >
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{note.diseaseZh}</div>
                                <div className="text-xs truncate" style={{ color: 'var(--muted)' }}>{note.disease}</div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Related markers */}
                  {relatedMarkers.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
                        相关标记物
                        <Link href="/markers" className="ml-2 font-normal" style={{ color: 'var(--accent)' }}>查看全部 →</Link>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {relatedMarkers.slice(0, 12).map(m => (
                          <Link
                            key={m.slug}
                            href={`/markers`}
                            className="text-xs px-3 py-1.5 rounded-full transition-colors"
                            style={{ backgroundColor: sub.color + '15', color: sub.color, border: `1px solid ${sub.color}30` }}
                          >
                            {m.abbreviation || m.nameEn || m.name || m.slug}
                          </Link>
                        ))}
                        {relatedMarkers.length > 12 && (
                          <span className="text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--card-hover)', color: 'var(--muted)' }}>
                            +{relatedMarkers.length - 12} 更多
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {relatedNotes.length === 0 && relatedMarkers.length === 0 && (
                    <div className="text-center py-8" style={{ color: 'var(--muted)' }}>
                      <p className="text-sm">该亚专科暂无学习内容，敬请期待</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
