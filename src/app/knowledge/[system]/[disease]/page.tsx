'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { MarkdownContent } from '@/components/MarkdownContent';
import { Card, SectionTitle } from '@/components/Card';
import { MarkerCard } from '@/components/MarkerCard';
import { MarkerModal } from '@/components/MarkerModal';
import { StatusBadge } from '@/components/StatusBadge';

interface IHCMarker {
  marker: string;
  result: string;
  description?: string;
}

interface Guideline {
  name: string;
  summary: string;
  url?: string;
}

interface Literature {
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

interface Note {
  slug: string;
  system: string;
  systemZh: string;
  disease: string;
  diseaseZh: string;
  overview: string;
  clinicalSignificance: string;
  ihcMarkers: IHCMarker[];
  differentialDiagnosis: string[];
  treatment?: string;
  guidelines: Guideline[];
  literature: Literature[];
  status: 'todo' | 'in-progress' | 'done';
  updatedAt: string;
  rawContent: string;
}

interface RelatedDisease {
  disease: string;
  diseaseZh: string;
  system: string;
  slug: string;
}

const SYSTEMS = [
  { key: 'breast', zh: '乳腺', emoji: '🔬', color: '#f472b6' },
  { key: 'lung', zh: '肺部', emoji: '🫁', color: '#60a5fa' },
  { key: 'gi', zh: '消化', emoji: '🟠', color: '#fb923c' },
];

function extractSection(content: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}|[\]\\]/g, '\\$&');
  const re = new RegExp('## ' + escaped + '(?:[^\n]*\n\n)?([\\s\\S]*?)(?=\\n## |$)', '');
  const m = content.match(re);
  return m ? m[1].trim() : '';
}

type TabId = 'overview' | 'gross' | 'microscopy' | 'ihc' | 'diff' | 'guidelines' | 'literature' | 'treatment';

export default function DiseasePage({ params }: { params: Promise<{ system: string; disease: string }> }) {
  const { system, disease } = use(params);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [markerModal, setMarkerModal] = useState<{ slug: string; content: string } | null>(null);
  const [diseaseMap, setDiseaseMap] = useState<Record<string, RelatedDisease[]>>({});

  useEffect(() => {
    Promise.all([
      fetch(`/api/notes/${system}/${disease}`).then(r => r.ok ? r.json() : Promise.reject('Not found')),
      fetch('/api/marker-diseases').then(r => r.json()).catch(() => ({})),
    ])
      .then(([noteData, mapData]) => {
        setNote(noteData);
        setDiseaseMap(mapData || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [system, disease]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div style={{ color: 'var(--muted)' }} className="animate-pulse">加载中...</div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>笔记不存在</h2>
        <p style={{ color: 'var(--muted)' }} className="mb-6">该病种尚未生成学习笔记</p>
        <Link href="/knowledge" style={{ color: 'var(--accent)' }} className="text-sm hover:opacity-80">
          ← 返回知识库
        </Link>
      </div>
    );
  }

  const sys = SYSTEMS.find(s => s.key === system);

  const overviewText = extractSection(note.rawContent, '疾病概述');
  const grossText = extractSection(note.rawContent, '大体观察');
  const microscopyText = extractSection(note.rawContent, '病理特征（镜下所见）');
  const diffText = extractSection(note.rawContent, '鉴别诊断');
  const treatmentText = extractSection(note.rawContent, '治疗方案');

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: '概述' },
    { id: 'gross', label: '大体观察', count: grossText ? 1 : 0 },
    { id: 'microscopy', label: '镜下特征', count: microscopyText ? 1 : 0 },
    { id: 'ihc', label: '免疫组化', count: note.ihcMarkers?.length },
    { id: 'diff', label: '鉴别诊断', count: note.differentialDiagnosis?.length || (diffText ? 1 : 0) },
    { id: 'guidelines', label: '指南', count: note.guidelines?.length },
    { id: 'literature', label: '文献', count: note.literature?.length },
    { id: 'treatment', label: '治疗方案', count: treatmentText ? 1 : 0 },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6 flex-wrap" style={{ color: 'var(--muted)' }}>
        <Link href="/" className="hover:opacity-80 transition-opacity" style={{ color: 'var(--muted)' }}>看板</Link>
        <span>/</span>
        <Link href="/knowledge" className="hover:opacity-80 transition-opacity" style={{ color: 'var(--muted)' }}>知识库</Link>
        <span>/</span>
        <Link href="/knowledge" className="hover:opacity-80 transition-opacity" style={{ color: sys?.color }}>
          {sys?.emoji} {sys?.zh}
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--foreground)' }}>{note.diseaseZh}</span>
      </div>

      {/* Title */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: sys?.color }}>
              {note.diseaseZh}
            </h1>
            <p style={{ color: 'var(--muted)' }}>{note.disease}</p>
          </div>
          <StatusBadge status={note.status} />
        </div>
        <p style={{ color: 'var(--muted)' }} className="text-xs mt-2">最后更新: {note.updatedAt}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto mb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
            style={{
              borderBottomColor: activeTab === tab.id ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.id ? 'var(--foreground)' : 'var(--muted)',
            }}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--card)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        overviewText
          ? <MarkdownContent content={overviewText} />
          : <p style={{ color: 'var(--muted)' }}>暂无疾病概述内容</p>
      )}

      {activeTab === 'gross' && (
        grossText
          ? <MarkdownContent content={grossText} />
          : <p style={{ color: 'var(--muted)' }}>暂无大体观察内容</p>
      )}

      {activeTab === 'microscopy' && (
        microscopyText
          ? <MarkdownContent content={microscopyText} />
          : <p style={{ color: 'var(--muted)' }}>暂无镜下特征内容</p>
      )}

      {activeTab === 'diff' && (
        diffText
          ? <MarkdownContent content={diffText} />
          : <Card><p style={{ color: 'var(--muted)' }}>暂无鉴别诊断信息</p></Card>
      )}

      {activeTab === 'ihc' && (
        !note.ihcMarkers || note.ihcMarkers.length === 0 ? (
          <Card>
            <p style={{ color: 'var(--muted)' }}>暂无免疫组化数据</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {note.ihcMarkers.map((m, i) => (
                <MarkerCard
                  key={i}
                  marker={m}
                  onClick={() => {
                    const slug = m.marker.replace(/[（(][^)）]+[)）]$/, '');
                    fetch(`/api/markers/${encodeURIComponent(slug)}`)
                      .then(r => r.ok ? r.json() : Promise.reject())
                      .then(data => {
                        if (data.content) setMarkerModal({ slug, content: data.content });
                      })
                      .catch(() => {
                        setMarkerModal({ slug, content: `## ${m.marker}\n\n**结果**: ${m.result}\n\n（暂无详细说明）` });
                      });
                  }}
                />
              ))}
            </div>
            {/* Cross-link to markers page */}
            <div className="mt-4 text-center">
              <Link href="/markers" className="text-sm hover:opacity-80 transition-opacity" style={{ color: 'var(--accent)' }}>
                查看全部标记物学习 →
              </Link>
            </div>
          </>
        )
      )}

      {activeTab === 'treatment' && (
        treatmentText
          ? <MarkdownContent content={treatmentText} />
          : <p style={{ color: 'var(--muted)' }}>暂无治疗方案内容</p>
      )}

      {activeTab === 'guidelines' && (
        <Card>
          <SectionTitle>临床指南</SectionTitle>
          {!note.guidelines || note.guidelines.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>暂无指南信息</p>
          ) : (
            <div className="space-y-3">
              {note.guidelines.map((g, i) => (
                <div key={i} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card-hover)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium" style={{ color: 'var(--accent)' }}>{g.name}</span>
                    {g.url && (
                      <a href={g.url} target="_blank" rel="noopener noreferrer" className="text-xs hover:opacity-80" style={{ color: 'var(--muted)' }}>
                        查看原文 ↗
                      </a>
                    )}
                  </div>
                  <p className="text-sm mt-2" style={{ color: 'var(--foreground)', opacity: 0.8 }}>{g.summary}</p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-center">
            <Link href="/guidelines" className="text-sm hover:opacity-80 transition-opacity" style={{ color: 'var(--accent)' }}>
              查看全部临床指南 →
            </Link>
          </div>
        </Card>
      )}

      {activeTab === 'literature' && (
        <Card>
          <SectionTitle>参考文献</SectionTitle>
          {!note.literature || note.literature.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>暂无文献信息</p>
          ) : (
            <div className="space-y-4">
              {note.literature.map((l, i) => {
                const localHtmlPath = l.localHtml
                  ? `/literature/${system}/${disease}/${l.localHtml}`
                  : l.pmcid
                    ? `/literature/${system}/${disease}/${l.pmcid}.html`
                    : null;
                const jumpLink = l.jumpUrl || (l.pmid
                  ? (l.pmcid ? `https://pmc.ncbi.nlm.nih.gov/articles/${l.pmcid}/` : `https://pubmed.ncbi.nlm.nih.gov/${l.pmid}/`)
                  : l.url);

                return (
                  <div key={i} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card-hover)' }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="font-medium text-sm leading-snug" style={{ color: 'var(--foreground)' }}>{l.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs mb-3" style={{ color: 'var(--muted)' }}>
                      <span>{l.journal}</span>
                      <span>·</span>
                      <span>{l.year}</span>
                      {l.pmid && <><span>·</span><span>PMID: {l.pmid}</span></>}
                      {l.pmcid && <><span>·</span><span>PMC: {l.pmcid}</span></>}
                    </div>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--foreground)', opacity: 0.8 }}>{l.summary}</p>
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
                          style={{ backgroundColor: 'var(--card)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                          源地址 ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 text-center">
            <Link href="/literature" className="text-sm hover:opacity-80 transition-opacity" style={{ color: 'var(--accent)' }}>
              查看全部文献 →
            </Link>
          </div>
        </Card>
      )}

      {/* Marker detail modal with cross-references */}
      {markerModal && (
        <MarkerModal
          slug={markerModal.slug}
          content={markerModal.content}
          relatedDiseases={diseaseMap[markerModal.slug]}
          onClose={() => setMarkerModal(null)}
        />
      )}
    </div>
  );
}
