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
  treatment?: string;
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
function MarkerCard({ marker, onClick }: { marker: IHCMarker; onClick?: () => void }) {
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

  // Extract zh label from marker name like "ER（雌激素受体）"
  const zhMatch = marker.marker.match(/[（(]([^)）]+)[)）]$/);
  const zhLabel = zhMatch ? zhMatch[1] : null;
  const displayName = zhLabel ? marker.marker.replace(/[（(][^)）]+[)）]$/, '') : marker.marker;

  return (
    <div
      className="rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="font-mono font-bold text-base" style={{ color: 'var(--foreground)' }}>
            {displayName}
          </div>
          {zhLabel && (
            <div className="text-xs italic mt-0.5" style={{ color: 'var(--muted)' }}>
              {zhLabel}
            </div>
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
      <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
        点击查看详情 →
      </p>
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

// Marker detail modal with formatted YAML frontmatter
function MarkerModal({ slug, content, onClose }: { slug: string; content: string; onClose: () => void }) {
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
  let frontmatter: Record<string, any> = {};
  let bodyContent = content;
  if (yamlMatch) {
    for (const line of yamlMatch[1].split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim();
        if (value.startsWith('[') && value.endsWith(']')) {
          frontmatter[key] = value.slice(1, -1).split(',').map((s: string) => s.trim()).filter(Boolean);
        } else {
          frontmatter[key] = value;
        }
      }
    }
    bodyContent = content.slice(yamlMatch[0].length).trim();
  }

  const drugColors: Record<string, string> = {
    '吉非替尼': '#6366f1', '厄洛替尼': '#6366f1', '奥希替尼': '#8b5cf6',
    '阿美替尼': '#8b5cf6', '伏美替尼': '#8b5cf6', '克唑替尼': '#ec4899',
    '阿来替尼': '#ec4899', '布格替尼': '#ec4899', '劳拉替尼': '#ec4899',
    '曲妥珠单抗': '#f59e0b', '帕妥珠单抗': '#f59e0b', 'T-DM1': '#f59e0b',
    'DS-8201': '#f59e0b', '德喜曲妥珠单抗': '#f59e0b', '拉罗替尼': '#14b8a6',
    '恩曲替尼': '#14b8a6', '他莫昔芬': '#f97316', '来曲唑': '#f97316',
    '阿那曲唑': '#f97316', '氟维司群': '#f97316', '芳香化酶抑制剂': '#f97316',
    'Pembrolizumab': '#22c55e', '帕博利珠单抗': '#22c55e', 'Nivolumab': '#22c55e',
    '纳武利尤单抗': '#22c55e', 'Atezolizumab': '#22c55e', '阿替利珠单抗': '#22c55e',
    'Durvalumab': '#22c55e', '度伐利尤单抗': '#22c55e',
    '达拉非尼': '#3b82f6', '曲美替尼': '#3b82f6', 'Sotorasib': '#3b82f6',
    '索托拉西布': '#3b82f6', 'Adagrasib': '#3b82f6',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={onClose}>
      <div style={{ background: 'var(--card)', borderRadius: '16px', maxWidth: '720px', width: '100%', maxHeight: '85vh', overflow: 'auto', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '1.5rem 2rem 1rem', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>{frontmatter['标记物'] || slug}</h2>
              {frontmatter['英文名'] && <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>{frontmatter['英文名']}</p>}
            </div>
            <button onClick={onClose} style={{ background: 'var(--card-hover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', padding: '0.5rem 0.75rem', color: 'var(--muted)' }}>✕</button>
          </div>
        </div>
        <div style={{ padding: '1.5rem 2rem 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {frontmatter['系统'] && <div style={{ background: 'var(--card-hover)', borderRadius: '10px', padding: '0.875rem' }}><div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '0.25rem', fontWeight: 600 }}>系统/器官</div><div style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>{frontmatter['系统']}</div></div>}
            {frontmatter['功能'] && <div style={{ background: 'var(--card-hover)', borderRadius: '10px', padding: '0.875rem' }}><div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '0.25rem', fontWeight: 600 }}>功能</div><div style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>{frontmatter['功能']}</div></div>}
          </div>
          {frontmatter['判读标准'] && <div style={{ marginBottom: '1.25rem' }}><div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 600 }}>判读标准</div><div style={{ background: 'var(--card-hover)', borderRadius: '10px', padding: '0.875rem', fontSize: '0.9rem', color: 'var(--foreground)' }}>{frontmatter['判读标准']}</div></div>}
          {frontmatter['临床意义'] && <div style={{ marginBottom: '1.25rem' }}><div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 600 }}>临床意义</div><div style={{ background: 'var(--card-hover)', borderRadius: '10px', padding: '0.875rem', fontSize: '0.9rem', color: 'var(--foreground)' }}>{frontmatter['临床意义']}</div></div>}
          {frontmatter['相关疾病'] && Array.isArray(frontmatter['相关疾病']) && frontmatter['相关疾病'].length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 600 }}>相关疾病</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {frontmatter['相关疾病'].map((d: string, i: number) => <span key={i} style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 500 }}>{d}</span>)}
              </div>
            </div>
          )}
          {frontmatter['相关靶向药'] && Array.isArray(frontmatter['相关靶向药']) && frontmatter['相关靶向药'].length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 600 }}>相关靶向药</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {frontmatter['相关靶向药'].map((drug: string, i: number) => {
                  const color = drugColors[drug] || '#64748b';
                  return <span key={i} style={{ background: color + '20', color, border: `1px solid ${color}40`, borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 500 }}>{drug}</span>;
                })}
              </div>
            </div>
          )}
          {bodyContent && <div><div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '0.75rem', fontWeight: 600 }}>详细内容</div><MarkdownContent content={bodyContent} /></div>}
        </div>
      </div>
    </div>
  );
}

type TabId = 'overview' | 'gross' | 'microscopy' | 'ihc' | 'diff' | 'guidelines' | 'literature' | 'treatment';

export default function DiseasePage({ params }: { params: Promise<{ system: string; disease: string }> }) {
  const { system, disease } = use(params);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [markerModal, setMarkerModal] = useState<{ slug: string; content: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    diseases: { slug: string; system: string; disease: string; diseaseZh: string }[];
    markers: { slug: string; name: string }[];
  } | null>(null);

  useEffect(() => {
    fetch(`/api/notes/${system}/${disease}`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(data => { setNote(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [system, disease]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const timer = setTimeout(async () => {
      try {
        const [notesRes, markersRes] = await Promise.all([
          fetch('/api/notes'),
          fetch('/api/markers')
        ]);
        const notes = await notesRes.json();
        const markers = await markersRes.json();
        const q = searchQuery.toLowerCase();
        const matchedDiseases = notes.filter((n: any) =>
          n.diseaseZh.includes(q) || n.disease.toLowerCase().includes(q) || n.systemZh.includes(q)
        ).map((n: any) => ({ slug: n.slug, system: n.system, disease: n.disease, diseaseZh: n.diseaseZh }));
        const matchedMarkers = markers.filter((m: any) =>
          m.slug.toLowerCase().includes(q) || m.content.toLowerCase().includes(q)
        ).map((m: any) => {
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
  const treatmentText = extractSection(note.rawContent, '治疗方案');

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: '📖 概述' },
    { id: 'gross', label: '📦 大体观察', count: grossText ? 1 : 0 },
    { id: 'microscopy', label: '🔬 镜下特征', count: microscopyText ? 1 : 0 },
    { id: 'ihc', label: '🧪 免疫组化', count: note.ihcMarkers?.length },
    { id: 'diff', label: '⚖️ 鉴别诊断', count: note.differentialDiagnosis?.length || (diffText ? 1 : 0) },
    { id: 'guidelines', label: '📋 指南', count: note.guidelines?.length },
    { id: 'literature', label: '📚 文献', count: note.literature?.length },
    { id: 'treatment', label: '💊 治疗方案', count: treatmentText ? 1 : 0 },
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
        )
      )}

      {activeTab === 'treatment' && (
        treatmentText
          ? <MarkdownContent content={treatmentText} />
          : <p style={{ color: 'var(--muted)' }}>暂无治疗方案内容</p>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative' }}>
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
          <div style={{ marginTop: '0.5rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            {searchResults.diseases.length === 0 && searchResults.markers.length === 0 && (
              <div style={{ padding: '1rem', color: 'var(--muted)', textAlign: 'center' }}>未找到相关病种或标记物</div>
            )}
            {searchResults.diseases.length > 0 && (
              <div>
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', background: 'var(--card-hover)', fontWeight: 600 }}>病种</div>
                {searchResults.diseases.map((d: any) => (
                  <a key={d.slug} href={`/knowledge/${d.system}/${d.slug}`}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--foreground)', textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--card-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div><div style={{ fontWeight: 500 }}>{d.diseaseZh}</div><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{d.disease}</div></div>
                    <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>→</span>
                  </a>
                ))}
              </div>
            )}
            {searchResults.markers.length > 0 && (
              <div>
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', background: 'var(--card-hover)', fontWeight: 600 }}>标记物</div>
                {searchResults.markers.map((m: any) => (
                  <div key={m.slug} onClick={() => {
                    fetch(`/api/markers/${encodeURIComponent(m.slug)}`)
                      .then(r => r.json())
                      .then(data => {
                        if (data.content) { setMarkerModal({ slug: m.name || m.slug, content: data.content }); setSearchQuery(''); setSearchResults(null); }
                      });
                  }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--foreground)', cursor: 'pointer' }}
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

      {/* Marker detail modal */}
      {markerModal && (
        <MarkerModal
          slug={markerModal.slug}
          content={markerModal.content}
          onClose={() => setMarkerModal(null)}
        />
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
                    <div className="flex flex-wrap items-center gap-2">
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
