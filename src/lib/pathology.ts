import fs from 'fs';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const yaml = require('js-yaml');

// ── Shared Types ──────────────────────────────────────────────────

export interface IHCMarker {
  marker: string;
  result: string;
  description?: string;
}

export interface MicroscopyFeature {
  feature: string;
  description: string;
  imageUrl?: string;
  imageCaption?: string;
}

export interface PathologyNote {
  slug: string;
  system: 'breast' | 'lung' | 'gi';
  systemZh: string;
  disease: string;
  diseaseZh: string;
  overview: string;
  microscopy: MicroscopyFeature[];
  ihcMarkers: IHCMarker[];
  differentialDiagnosis: string[];
  clinicalSignificance: string;
  treatment?: string;
  guidelines: { name: string; summary: string; url?: string }[];
  literature: {
    title: string; journal: string; year: number;
    pmid?: string; pmcid?: string; summary: string;
    url?: string; localHtml?: string; jumpUrl?: string;
  }[];
  status: 'todo' | 'in-progress' | 'done';
  updatedAt: string;
  rawContent?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  items: PathologyNote[];
}

export interface PathologyMarker {
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

// ── Constants ─────────────────────────────────────────────────────

const LEARNING_DIR = process.env.PATHOLOGY_DATA_DIR || /*turbopackIgnore: true*/ '/root/.openclaw/workspace/pathology-learning';

export const SYSTEMS = [
  { key: 'breast', zh: '乳腺病理' },
  { key: 'lung', zh: '肺部病理' },
  { key: 'gi', zh: '消化系统病理' },
] as const;

// Subspecialty definitions with related systems
export const SUBSPECIALTIES = [
  { key: 'breast-pathology', zh: '乳腺病理', systems: ['breast'], icon: '🔬', color: '#f472b6' },
  { key: 'pulmonary-pathology', zh: '肺部病理', systems: ['lung'], icon: '🫁', color: '#60a5fa' },
  { key: 'gi-pathology', zh: '消化病理', systems: ['gi'], icon: '🟠', color: '#fb923c' },
  { key: 'molecular-pathology', zh: '分子病理', systems: ['breast', 'lung', 'gi'], icon: '🧬', color: '#a78bfa' },
  { key: 'immunohistochemistry', zh: '免疫组化', systems: ['breast', 'lung', 'gi'], icon: '🧪', color: '#34d399' },
  { key: 'cytopathology', zh: '细胞病理', systems: ['breast', 'lung', 'gi'], icon: '🔭', color: '#fbbf24' },
] as const;

// ── YAML Frontmatter Parser (unified) ─────────────────────────────

function parseYamlFrontmatter(content: string): { meta: Record<string, unknown>; body: string } {
  const lines = content.split('\n');
  const yamlStart = lines.findIndex(l => l.trim() === '---');

  if (yamlStart < 0) return { meta: {}, body: content };

  const yamlEnd = lines.findIndex((l, i) => i > yamlStart && l.trim() === '---');
  if (yamlEnd <= yamlStart) return { meta: {}, body: content };

  const yamlContent = lines.slice(yamlStart + 1, yamlEnd).join('\n');
  let meta: Record<string, unknown> = {};
  try {
    meta = yaml.load(yamlContent) as Record<string, unknown>;
  } catch {
    // Invalid YAML, return empty meta
  }

  const body = lines.slice(yamlEnd + 1).join('\n');
  return { meta, body };
}

// ── Note Parsing ──────────────────────────────────────────────────

function parseMarkdownMeta(content: string): Partial<PathologyNote> & { rawContent: string } {
  const { meta: yamlMeta } = parseYamlFrontmatter(content);

  // Key mapping: Chinese YAML keys -> English output keys
  const keyMap: Record<string, string> = {
    '疾病': 'disease',
    '中文名': 'diseaseZh',
    '系统': 'system',
    '状态': 'status',
  };

  const result: Record<string, unknown> = {};

  for (const [cn, en] of Object.entries(keyMap)) {
    if (yamlMeta[cn] !== undefined) {
      result[en] = yamlMeta[cn];
    }
  }

  // Map guidelines array
  if (yamlMeta['指南'] && Array.isArray(yamlMeta['指南'])) {
    result['guidelines'] = (yamlMeta['指南'] as Array<Record<string, unknown>>).map(g => ({
      name: String(g['name'] || ''),
      summary: String(g['summary'] || ''),
      url: g['url'] ? String(g['url']) : undefined,
    }));
  }

  // Map literature array
  if (yamlMeta['文献'] && Array.isArray(yamlMeta['文献'])) {
    result['literature'] = (yamlMeta['文献'] as Array<Record<string, unknown>>).map(l => ({
      title: String(l['title'] || ''),
      journal: String(l['journal'] || ''),
      year: Number(l['year']) || 0,
      pmid: l['pmid'] ? String(l['pmid']) : undefined,
      pmcid: l['pmcid'] ? String(l['pmcid']) : undefined,
      summary: String(l['summary'] || ''),
      url: l['url'] ? String(l['url']) : undefined,
      localHtml: l['localHtml'] ? String(l['localHtml']) : undefined,
      jumpUrl: l['jumpUrl'] ? String(l['jumpUrl']) : undefined,
    }));
  }

  // Parse IHC markers from markdown body (fixed: \Z -> $)
  const ihcMarkers: IHCMarker[] = [];
  const ihcSection = content.match(/## 免疫组化标记物\n([\s\S]*?)(?=\n## |$)/i);
  if (ihcSection) {
    for (const line of ihcSection[1].split('\n')) {
      const m = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|[^\n]*$/);
      if (!m) continue;
      const firstCell = m[1].trim();
      if (firstCell === '---' || firstCell === '----' || firstCell.startsWith('-')) continue;
      const pipeCount = (line.match(/\|/g) || []).length;
      if (pipeCount > 4) continue;
      if (!m[1].includes('标记物')) {
        ihcMarkers.push({
          marker: m[1].replace(/\*\*/g, '').trim(),
          result: m[2].replace(/\*\*/g, '').trim(),
        });
      }
    }
  }

  // Parse overview section (fixed: \Z -> $)
  const overviewSection = content.match(/## 疾病概述\n([\s\S]*?)(?=\n## |$)/i);
  if (overviewSection) result['overview'] = overviewSection[1].trim();

  // Parse treatment section (fixed: \Z -> $)
  const treatSection = content.match(/## 治疗方案\n([\s\S]*?)(?=\n## |$)/i);
  if (treatSection) result['treatment'] = treatSection[1].trim();

  // Parse microscopy images
  const microscopy: MicroscopyFeature[] = [];
  const microSection = content.match(/## 病理特征\n([\s\S]*?)(?=## |\n##|$)/i);
  if (microSection) {
    for (const line of microSection[1].split('\n')) {
      const imgM = line.match(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/);
      if (imgM) {
        microscopy.push({
          feature: imgM[1],
          description: '',
          imageUrl: imgM[2],
        });
      }
    }
  }

  // Raw content starts after first markdown heading
  const lines = content.split('\n');
  const rawContentStart = lines.findIndex(l => l.startsWith('## ') || l.startsWith('# '));

  return {
    ...result,
    ihcMarkers,
    microscopy,
    rawContent: rawContentStart >= 0 ? lines.slice(rawContentStart).join('\n') : content,
  };
}

// ── Marker Parsing ────────────────────────────────────────────────

export function parseMarkerMarkdown(content: string): PathologyMarker {
  const { meta: yamlMeta } = parseYamlFrontmatter(content);

  return {
    slug: '',
    name: String(yamlMeta['标记物'] || ''),
    nameEn: String(yamlMeta['英文名'] || ''),
    abbreviation: String(yamlMeta['缩写'] || ''),
    system: String(yamlMeta['系统'] || ''),
    function: String(yamlMeta['功能'] || ''),
    interpretation: String(yamlMeta['判读标准'] || ''),
    clinicalSignificance: String(yamlMeta['临床意义'] || ''),
    relatedDiseases: Array.isArray(yamlMeta['相关疾病']) ? yamlMeta['相关疾病'] as string[] : [],
    relatedTargetedTherapies: Array.isArray(yamlMeta['相关靶向药']) ? yamlMeta['相关靶向药'] as string[] : [],
    content,
  };
}

// ── Data Access Functions ─────────────────────────────────────────

export async function getAllNotes(): Promise<PathologyNote[]> {
  const notes: PathologyNote[] = [];

  for (const sys of SYSTEMS) {
    const sysDir = path.join(LEARNING_DIR, sys.key);
    if (!fs.existsSync(sysDir)) continue;

    const files = fs.readdirSync(sysDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const slug = file.replace('.md', '');
      const filePath = path.join(sysDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = parseMarkdownMeta(content);
      const stat = fs.statSync(filePath);

      notes.push({
        slug,
        system: sys.key as PathologyNote['system'],
        systemZh: sys.zh,
        disease: parsed.disease || slug,
        diseaseZh: parsed.diseaseZh || slug,
        overview: parsed.overview || '',
        microscopy: parsed.microscopy || [],
        ihcMarkers: parsed.ihcMarkers || [],
        differentialDiagnosis: parsed.differentialDiagnosis
          ? (typeof parsed.differentialDiagnosis === 'string' ? [parsed.differentialDiagnosis] : parsed.differentialDiagnosis)
          : [],
        clinicalSignificance: parsed.clinicalSignificance || '',
        treatment: parsed.treatment || '',
        guidelines: parsed.guidelines || [],
        literature: parsed.literature || [],
        status: (parsed.status as PathologyNote['status']) || 'todo',
        updatedAt: stat.mtime.toISOString().split('T')[0],
      });
    }
  }

  return notes;
}

export async function getNote(system: string, disease: string): Promise<PathologyNote | null> {
  // Path traversal protection
  if (system.includes('..') || disease.includes('..')) return null;

  const filePath = path.join(LEARNING_DIR, system, `${disease}.md`);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseMarkdownMeta(content);
  const sysMeta = SYSTEMS.find(s => s.key === system);
  const stat = fs.statSync(filePath);

  return {
    slug: disease,
    system: system as PathologyNote['system'],
    systemZh: sysMeta?.zh || system,
    disease: parsed.disease || disease,
    diseaseZh: parsed.diseaseZh || disease,
    overview: parsed.overview || '',
    microscopy: parsed.microscopy || [],
    ihcMarkers: parsed.ihcMarkers || [],
    differentialDiagnosis: parsed.differentialDiagnosis
      ? (typeof parsed.differentialDiagnosis === 'string' ? [parsed.differentialDiagnosis] : parsed.differentialDiagnosis)
      : [],
    clinicalSignificance: parsed.clinicalSignificance || '',
    treatment: parsed.treatment || '',
    guidelines: parsed.guidelines || [],
    literature: parsed.literature || [],
    status: (parsed.status as PathologyNote['status']) || 'todo',
    updatedAt: stat.mtime.toISOString().split('T')[0],
    rawContent: parsed.rawContent || '',
  };
}

export async function getSystems() {
  return SYSTEMS;
}

export async function getAllMarkers(): Promise<PathologyMarker[]> {
  const markersDir = path.join(LEARNING_DIR, 'markers');
  if (!fs.existsSync(markersDir)) return [];

  const files = fs.readdirSync(markersDir).filter(f => f.endsWith('.md'));
  const markers: PathologyMarker[] = [];

  for (const file of files) {
    const slug = file.replace('.md', '');
    const filePath = path.join(markersDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseMarkerMarkdown(content);
    markers.push({ ...parsed, slug });
  }

  return markers;
}

export async function getMarker(slug: string): Promise<PathologyMarker | null> {
  // Path traversal protection
  if (slug.includes('..') || slug.includes('/')) return null;

  const markersDir = path.join(LEARNING_DIR, 'markers');
  const filePath = path.join(markersDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseMarkerMarkdown(content);
  return { ...parsed, slug };
}

// ── Aggregation Helpers ───────────────────────────────────────────

export async function getAllGuidelines(): Promise<{ disease: string; diseaseZh: string; system: string; systemZh: string; slug: string; guidelines: PathologyNote['guidelines'] }[]> {
  const notes = await getAllNotes();
  return notes
    .filter(n => n.guidelines && n.guidelines.length > 0)
    .map(n => ({
      disease: n.disease,
      diseaseZh: n.diseaseZh,
      system: n.system,
      systemZh: n.systemZh,
      slug: n.slug,
      guidelines: n.guidelines,
    }));
}

export async function getAllLiterature(): Promise<{ disease: string; diseaseZh: string; system: string; systemZh: string; slug: string; literature: PathologyNote['literature'] }[]> {
  const notes = await getAllNotes();
  return notes
    .filter(n => n.literature && n.literature.length > 0)
    .map(n => ({
      disease: n.disease,
      diseaseZh: n.diseaseZh,
      system: n.system,
      systemZh: n.systemZh,
      slug: n.slug,
      literature: n.literature,
    }));
}

// Build cross-reference map: marker slug -> related diseases
export async function getMarkerDiseaseMap(): Promise<Record<string, { disease: string; diseaseZh: string; system: string; slug: string }[]>> {
  const notes = await getAllNotes();
  const map: Record<string, { disease: string; diseaseZh: string; system: string; slug: string }[]> = {};

  for (const note of notes) {
    for (const ihc of note.ihcMarkers) {
      const markerSlug = ihc.marker.replace(/\*\*/g, '').replace(/[（(][^)）]+[)）]$/, '').trim();
      if (!map[markerSlug]) map[markerSlug] = [];
      map[markerSlug].push({
        disease: note.disease,
        diseaseZh: note.diseaseZh,
        system: note.system,
        slug: note.slug,
      });
    }
  }

  return map;
}
