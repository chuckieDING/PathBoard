import fs from 'fs';
import path from 'path';

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
  literature: { title: string; journal: string; year: number; pmid?: string; pmcid?: string; summary: string; url?: string; localHtml?: string; jumpUrl?: string }[];
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

const LEARNING_DIR = '/root/.openclaw/workspace/pathology-learning';
const SYSTEMS = [
  { key: 'breast', zh: '乳腺病理' },
  { key: 'lung', zh: '肺部病理' },
  { key: 'gi', zh: '消化系统病理' },
];

function parseMarkdownMeta(content: string): Partial<PathologyNote> & { rawContent: string } {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const yaml = require('js-yaml');

  let yamlMeta: Record<string, unknown> = {};
  const lines = content.split('\n');

  // Try YAML frontmatter parsing first
  const yamlStart = lines.findIndex(l => l.trim() === '---');
  if (yamlStart >= 0) {
    const yamlEnd = lines.findIndex((l, i) => i > yamlStart && l.trim() === '---');
    if (yamlEnd > yamlStart) {
      const yamlContent = lines.slice(yamlStart + 1, yamlEnd).join('\n');
      try {
        yamlMeta = yaml.load(yamlContent) as Record<string, unknown>;
      } catch {
        // Fall back to old parsing
      }
    }
  }

  // Key mapping: Chinese YAML keys -> English output keys
  const keyMap: Record<string, string> = {
    '疾病': 'disease',
    '中文名': 'diseaseZh',
    '系统': 'system',
    '状态': 'status',
  };

  const result: Record<string, unknown> = {};

  // Map simple keys
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

  // Parse IHC markers from markdown body
  const ihcMarkers: IHCMarker[] = [];
  const ihcSection = content.match(/## 免疫组化标记物\n([\s\S]*?)(?=\n## |\Z)/i);
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

  // Parse overview section
  const overviewSection = content.match(/## 疾病概述\n([\s\S]*?)(?=\n## |\Z)/i);
  if (overviewSection) result['overview'] = overviewSection[1].trim();

  // Parse treatment section
  const treatSection = content.match(/## 治疗方案\n([\s\S]*?)(?=\n## |\Z)/i);
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
  const rawContentStart = lines.findIndex(l => l.startsWith('## ') || l.startsWith('# '));

  return {
    ...result,
    ihcMarkers,
    microscopy,
    rawContent: rawContentStart >= 0 ? lines.slice(rawContentStart).join('\n') : content,
  };
}

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

// Marker types
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

export function parseMarkerMarkdown(content: string): PathologyMarker {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const yaml = require('js-yaml');

  let yamlMeta: Record<string, unknown> = {};
  const lines = content.split('\n');

  // Try YAML frontmatter parsing first
  const yamlStart = lines.findIndex(l => l.trim() === '---');
  if (yamlStart >= 0) {
    const yamlEnd = lines.findIndex((l, i) => i > yamlStart && l.trim() === '---');
    if (yamlEnd > yamlStart) {
      const yamlContent = lines.slice(yamlStart + 1, yamlEnd).join('\n');
      try {
        yamlMeta = yaml.load(yamlContent) as Record<string, unknown>;
      } catch {
        // Fall back
      }
    }
  }

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
  const markersDir = path.join(LEARNING_DIR, 'markers');
  const filePath = path.join(markersDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseMarkerMarkdown(content);
  return { ...parsed, slug };
}
