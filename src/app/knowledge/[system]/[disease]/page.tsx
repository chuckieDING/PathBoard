'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  localHtml?: string;  // e.g. "PMC5597459.html" — 已下载到服务器的全文HTML
  jumpUrl?: string;   // 源地址跳转链接
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
  guidelines: Guideline[];
  literature: Literature[];
  status: 'todo' | 'in-progress' | 'done';
  updatedAt: string;
  rawContent: string;
}

const SYSTEMS = [
  { key: 'breast', zh: '乳腺', emoji: '🔬', color: 'text-pink-400' },
  { key: 'lung', zh: '肺部', emoji: '🫁', color: 'text-blue-400' },
  { key: 'gi', zh: '消化', emoji: '🟠', color: 'text-orange-400' },
];

function extractSection(content: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}|[\]\\]/g, '\\$&');
  // Stop at next \n## (## must be at line start, preventing table | rows from matching) or end of file
  const re = new RegExp('## ' + escaped + '(?:[^\n]*\n\n)?([\\s\\S]*?)(?=\\n## |\\Z)', '');
  const m = content.match(re);
  return m ? m[1].trim() : '';
}

function IHCBadge({ result }: { result: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    '阳性': { bg: 'bg-green-900/50', text: 'text-green-400' },
    '阴性': { bg: 'bg-red-900/50', text: 'text-red-400' },
    '1+': { bg: 'bg-yellow-900/50', text: 'text-yellow-400' },
    '2+': { bg: 'bg-orange-900/50', text: 'text-orange-400' },
    '3+': { bg: 'bg-red-900/50', text: 'text-red-400' },
    '+': { bg: 'bg-green-900/50', text: 'text-green-400' },
    '++': { bg: 'bg-orange-900/50', text: 'text-orange-400' },
    '+++': { bg: 'bg-red-900/50', text: 'text-red-400' },
    '不明': { bg: 'bg-zinc-800', text: 'text-zinc-400' },
  };
  const style = map[result] || map['不明'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}>
      {result}
    </span>
  );
}



// Beautiful IHC marker card component
function MarkerCard({ marker }: { marker: IHCMarker }) {
  // Parse intensity from result string
  const parseIntensity = (result: string): { level: number; label: string; color: string } => {
    const upper = result.toUpperCase();
    const percentMatch = result.match(/(\d+)%/);
    const percent = percentMatch ? parseInt(percentMatch[1]) : null;

    if (upper.includes('阴性') || upper === 'NEGATIVE' || upper.includes('-') && !upper.includes('+/-')) {
      return { level: 0, label: result, color: '#ef4444' };
    }
    if (upper.includes('1+') || upper.includes('弱') || upper.includes('LOW') || upper.includes('LOW/')) {
      return { level: 1, label: result, color: '#f97316' };
    }
    if (upper.includes('2+') || upper.includes('中') || upper.includes('MODERATE') || upper.includes('MOD')) {
      return { level: 2, label: result, color: '#eab308' };
    }
    if (upper.includes('3+') || upper.includes('强') || upper.includes('HIGH') || upper.includes('STRONG')) {
      return { level: 3, label: result, color: '#22c55e' };
    }
    if (upper.includes('阳性') || upper.includes('POSITIVE') || upper.includes('+')) {
      if (percent !== null) {
        if (percent < 10) return { level: 1, label: `${percent}%`, color: '#f97316' };
        if (percent < 50) return { level: 2, label: `${percent}%`, color: '#eab308' };
        return { level: 3, label: `${percent}%`, color: '#22c55e' };
      }
      return { level: 2, label: result, color: '#22c55e' };
    }
    return { level: 1, label: result, color: '#6b7280' };
  };

  const intensity = parseIntensity(marker.result);
  const levels = [0, 1, 2, 3];

  // Marker category label
  const markerGroups: Record<string, { zh: string; color: string }> = {
    'ER': { zh: '激素受体', color: '#ec4899' },
    'PR': { zh: '激素受体', color: '#ec4899' },
    'HER2': { zh: 'HER2', color: '#8b5cf6' },
    'Ki-67': { zh: '增殖标记', color: '#f97316' },
    'EGFR': { zh: '生长因子', color: '#06b6d4' },
    'CK5/6': { zh: '基底型', color: '#6366f1' },
    'CK14': { zh: '基底型', color: '#6366f1' },
    'p63': { zh: '肌上皮', color: '#10b981' },
    'SMA': { zh: '肌上皮', color: '#10b981' },
    'Calponin': { zh: '肌上皮', color: '#10b981' },
    'CD117': { zh: 'c-KIT', color: '#f59e0b' },
    'CD10': { zh: ' stromal', color: '#84cc16' },
  };

  const group = Object.entries(markerGroups).find(([k]) => marker.marker.includes(k));
  const tag = group ? group[1] : null;

  return (
    <div
      className="rounded-xl border p-4 transition-all hover:shadow-md"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="font-mono font-bold text-base" style={{ color: 'var(--foreground)' }}>
            {marker.marker}
          </div>
          {tag && (
            <span
              className="inline-block mt-0.5 text-xs px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: tag.color + '20', color: tag.color }}
            >
              {tag.zh}
            </span>
          )}
        </div>
        {/* Result badge */}
        <span
          className="text-sm font-semibold px-2 py-1 rounded-lg shrink-0"
          style={{ backgroundColor: intensity.color + '20', color: intensity.color }}
        >
          {intensity.label}
        </span>
      </div>

      {/* Intensity bar */}
      <div className="mb-2">
        <div className="flex gap-1.5">
          {levels.map(lvl => (
            <div
              key={lvl}
              className="h-2 flex-1 rounded-full transition-all"
              style={{
                backgroundColor: lvl <= intensity.level
                  ? intensity.color
                  : 'var(--border)',
                opacity: lvl <= intensity.level ? 1 : 0.4,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--muted)' }}>
          <span>阴性</span>
          <span>弱</span>
          <span>中</span>
          <span>强</span>
        </div>
      </div>

      {/* Description */}
      {marker.description && (
        <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
          {marker.description}
        </p>
      )}
    </div>
  );
}


// All card backgrounds use CSS variable --card so theme switching works
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border p-5 ${className}`}
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {children}
    </div>
  );
}

// Section heading that adapts to theme
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="font-semibold mb-4 flex items-center gap-2"
      style={{ color: 'var(--foreground)' }}
    >
      {children}
    </h3>
  );
}

// Markdown text that adapts to theme
function Muted({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={className} style={{ color: 'var(--muted)' }}>
      {children}
    </span>
  );
}

// Markdown renderer configured for theme variables
function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-content" style={{ color: 'var(--foreground)' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt }) =>
            src ? (
              <img
                src={src}
                alt={alt || ''}
                className="rounded-lg max-w-lg w-full my-4"
                loading="lazy"
              />
            ) : null,
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th
              className="text-left px-3 py-2 text-sm font-semibold border"
              style={{ backgroundColor: 'var(--card-hover)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className="px-3 py-2 text-sm border"
              style={{ color: 'var(--foreground)', borderColor: 'var(--border)', opacity: 0.85 }}
            >
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

type TabId = 'overview' | 'gross' | 'microscopy' | 'ihc' | 'diff' | 'guidelines' | 'literature';

export default function DiseasePage({ params }: { params: Promise<{ system: string; disease: string }> }) {
  const { system, disease } = use(params);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  useEffect(() => {
    fetch(`/api/notes/${system}/${disease}`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(data => { setNote(data); setLoading(false); })
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

  // Pre-extract markdown sections
  const overviewText = extractSection(note.rawContent, '疾病概述');
  const grossText = extractSection(note.rawContent, '大体观察');
  const microscopyText = extractSection(note.rawContent, '病理特征（镜下所见）');
  const diffText = extractSection(note.rawContent, '鉴别诊断');
  const clinicalText = extractSection(note.rawContent, '临床意义');

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: '📖 概述' },
    { id: 'gross', label: '📦 大体观察', count: grossText ? 1 : 0 },
    { id: 'microscopy', label: '🔬 镜下特征', count: microscopyText ? 1 : 0 },
    { id: 'ihc', label: '🧪 免疫组化', count: note.ihcMarkers?.length },
    { id: 'diff', label: '⚖️ 鉴别诊断', count: note.differentialDiagnosis?.length || (diffText ? 1 : 0) },
    { id: 'guidelines', label: '📋 指南', count: note.guidelines?.length },
    { id: 'literature', label: '📚 文献', count: note.literature?.length },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--muted)' }}>
        <Link href="/" className="hover:opacity-80 transition-opacity" style={{ color: 'var(--muted)' }}>看板</Link>
        <span>/</span>
        <Link href="/knowledge" className="hover:opacity-80 transition-opacity" style={{ color: 'var(--muted)' }}>知识库</Link>
        <span>/</span>
        <Link href={`/knowledge?system=${system}`} className={`hover:opacity-80 transition-opacity ${sys?.color}`}>
          {sys?.emoji} {sys?.zh}
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--foreground)' }}>{note.diseaseZh}</span>
      </div>

      {/* Title */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold mb-1 ${sys?.color}`}>
              {note.diseaseZh}
            </h1>
            <p style={{ color: 'var(--muted)' }}>{note.disease}</p>
          </div>
          <div
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: note.status === 'done' ? 'rgba(34,197,94,0.15)' : note.status === 'in-progress' ? 'rgba(245,158,11,0.15)' : 'var(--card)',
              color: note.status === 'done' ? '#22c55e' : note.status === 'in-progress' ? '#f59e0b' : 'var(--muted)',
              border: '1px solid var(--border)'
            }}
          >
            {note.status === 'done' ? '✅ 已完成' : note.status === 'in-progress' ? '⏳ 进行中' : '📖 待学习'}
          </div>
        </div>
        <p style={{ color: 'var(--muted)' }} className="text-xs mt-2">最后更新: {note.updatedAt}</p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 overflow-x-auto mb-6"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
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
              <span
                className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--card)', color: 'var(--muted)', border: '1px solid var(--border)' }}
              >
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

      {activeTab === 'ihc' && (
        !note.ihcMarkers || note.ihcMarkers.length === 0 ? (
          <Card>
            <p style={{ color: 'var(--muted)' }}>暂无免疫组化数据</p>
          </Card>
        ) : (
          <>
            {/* Summary strip */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
              {[
                { label: 'ER', count: note.ihcMarkers.filter(m => ['ER','ERα','雌激素受体'].includes(m.marker)).length },
                { label: 'PR', count: note.ihcMarkers.filter(m => ['PR','孕激素受体','PgR'].includes(m.marker)).length },
                { label: 'HER2', count: note.ihcMarkers.filter(m => ['HER2','HER-2','c-erbB-2'].includes(m.marker)).length },
                { label: 'Ki-67', count: note.ihcMarkers.filter(m => m.marker.includes('Ki-67') || m.marker.includes('Ki67')).length },
                { label: '总计', count: note.ihcMarkers.length },
              ].map(s => (
                <div
                  key={s.label}
                  className="rounded-xl border p-3 text-center"
                  style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                >
                  <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{s.count}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Marker cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {note.ihcMarkers.map((m, i) => (
                <MarkerCard key={i} marker={m} />
              ))}
            </div>
          </>
        )
      )}

      {activeTab === 'diff' && (
        diffText
          ? <MarkdownContent content={diffText} />
          : <Card><p style={{ color: 'var(--muted)' }}>暂无鉴别诊断信息</p></Card>
      )}

      {activeTab === 'guidelines' && (
        <Card>
          <SectionTitle>📋 临床指南</SectionTitle>
          {!note.guidelines || note.guidelines.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>暂无指南信息</p>
          ) : (
            <div className="space-y-3">
              {note.guidelines.map((g, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: 'var(--card-hover)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-indigo-400 font-medium">{g.name}</span>
                    {g.url && (
                      <a
                        href={g.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs hover:opacity-80"
                        style={{ color: 'var(--muted)' }}
                      >
                        查看原文 ↗
                      </a>
                    )}
                  </div>
                  <p className="text-sm mt-2" style={{ color: 'var(--foreground)', opacity: 0.8 }}>{g.summary}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'literature' && (
        <Card>
          <SectionTitle>📚 最新文献</SectionTitle>
          {!note.literature || note.literature.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>暂无文献信息</p>
          ) : (
            <div className="space-y-4">
              {note.literature.map((l, i) => {
                // 构建本地全文HTML路径（如果已下载）
                const localHtmlPath = l.localHtml
                  ? `/literature/${system}/${disease}/${l.localHtml}`
                  : l.pmcid
                    ? `/literature/${system}/${disease}/${l.pmcid}.html`
                    : null;
                const jumpLink = l.jumpUrl || (l.pmid
                  ? (l.pmcid ? `https://pmc.ncbi.nlm.nih.gov/articles/${l.pmcid}/` : `https://pubmed.ncbi.nlm.nih.gov/${l.pmid}/`)
                  : l.url);

                return (
                  <div
                    key={i}
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: 'var(--card-hover)' }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="font-medium text-sm leading-snug" style={{ color: 'var(--foreground)' }}>
                        {l.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs mb-3" style={{ color: 'var(--muted)' }}>
                      <span>{l.journal}</span>
                      <span>·</span>
                      <span>{l.year}</span>
                      {l.pmid && <><span>·</span><span>PMID: {l.pmid}</span></>}
                      {l.pmcid && <><span>·</span><span>PMC: {l.pmcid}</span></>}
                    </div>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--foreground)', opacity: 0.8 }}>{l.summary}</p>

                    {/* 文献操作按钮 */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* 本地HTML全文（已下载到服务器） */}
                      {localHtmlPath && (
                        <a
                          href={localHtmlPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
                          style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
                        >
                          📖 在线阅读
                        </a>
                      )}
                      {/* 跳转链接（源地址） */}
                      {jumpLink && (
                        <a
                          href={jumpLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
                          style={{ backgroundColor: 'var(--card)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                        >
                          🔗 源地址 ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
