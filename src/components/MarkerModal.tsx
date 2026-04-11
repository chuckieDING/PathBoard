'use client';

import { MarkdownContent } from './MarkdownContent';

const DRUG_COLORS: Record<string, string> = {
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

interface MarkerModalProps {
  slug: string;
  content: string;
  onClose: () => void;
  relatedDiseases?: { disease: string; diseaseZh: string; system: string; slug: string }[];
}

export function MarkerModal({ slug, content, onClose, relatedDiseases }: MarkerModalProps) {
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter: Record<string, string | string[]> = {};
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={onClose}>
      <div style={{ background: 'var(--card)', borderRadius: '16px', maxWidth: '720px', width: '100%', maxHeight: '85vh', overflow: 'auto', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '1.5rem 2rem 1rem', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>{frontmatter['标记物'] || slug}</h2>
              {frontmatter['英文名'] && <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>{frontmatter['英文名']}</p>}
            </div>
            <button onClick={onClose} style={{ background: 'var(--card-hover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', padding: '0.5rem 0.75rem', color: 'var(--muted)' }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem 2rem 2rem' }}>
          {/* Metadata grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {frontmatter['系统'] && (
              <div style={{ background: 'var(--card-hover)', borderRadius: '10px', padding: '0.875rem' }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '0.25rem', fontWeight: 600 }}>系统/器官</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>{frontmatter['系统']}</div>
              </div>
            )}
            {frontmatter['功能'] && (
              <div style={{ background: 'var(--card-hover)', borderRadius: '10px', padding: '0.875rem' }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '0.25rem', fontWeight: 600 }}>功能</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>{frontmatter['功能']}</div>
              </div>
            )}
          </div>

          {frontmatter['判读标准'] && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 600 }}>判读标准</div>
              <div style={{ background: 'var(--card-hover)', borderRadius: '10px', padding: '0.875rem', fontSize: '0.9rem', color: 'var(--foreground)' }}>{frontmatter['判读标准']}</div>
            </div>
          )}

          {frontmatter['临床意义'] && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 600 }}>临床意义</div>
              <div style={{ background: 'var(--card-hover)', borderRadius: '10px', padding: '0.875rem', fontSize: '0.9rem', color: 'var(--foreground)' }}>{frontmatter['临床意义']}</div>
            </div>
          )}

          {/* Related diseases from frontmatter */}
          {frontmatter['相关疾病'] && Array.isArray(frontmatter['相关疾病']) && frontmatter['相关疾病'].length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 600 }}>相关疾病</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {frontmatter['相关疾病'].map((d: string, i: number) => (
                  <span key={i} style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 500 }}>{d}</span>
                ))}
              </div>
            </div>
          )}

          {/* Cross-referenced diseases (from IHC data) */}
          {relatedDiseases && relatedDiseases.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 600 }}>使用此标记物的病种</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {relatedDiseases.map((d, i) => (
                  <a
                    key={i}
                    href={`/knowledge/${d.system}/${d.slug}`}
                    style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none' }}
                  >
                    {d.diseaseZh}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Targeted therapies */}
          {frontmatter['相关靶向药'] && Array.isArray(frontmatter['相关靶向药']) && frontmatter['相关靶向药'].length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 600 }}>相关靶向药</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {frontmatter['相关靶向药'].map((drug: string, i: number) => {
                  const color = DRUG_COLORS[drug] || '#64748b';
                  return <span key={i} style={{ background: color + '20', color, border: `1px solid ${color}40`, borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 500 }}>{drug}</span>;
                })}
              </div>
            </div>
          )}

          {/* Full markdown content */}
          {bodyContent && (
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '0.75rem', fontWeight: 600 }}>详细内容</div>
              <MarkdownContent content={bodyContent} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
