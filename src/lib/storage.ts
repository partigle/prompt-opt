/**
 * 存储管理 - Storage Manager
 * 
 * 管理提示词版本、输出文件、评估结果
 */

import { 
  readFileSync, 
  writeFileSync, 
  existsSync, 
  mkdirSync, 
  readdirSync,
  statSync
} from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 项目根目录
const PROJECT_ROOT = join(__dirname, '../..');

// 目录定义
const DIRS = {
  prompts: join(PROJECT_ROOT, 'prompts'),
  outputs: join(PROJECT_ROOT, 'outputs'),
  evaluations: join(PROJECT_ROOT, 'evaluations'),
  dialogue: join(PROJECT_ROOT, 'dialogue'),
};

// 场景列表
const SCENES = [
  'product/weekly', 'product/review', 'product/launch',
  'marketing/weekly', 'marketing/campaign', 'marketing/brand', 'marketing/partnership',
  'sales/meeting', 'sales/negotiation', 'sales/channel',
  'strategy/meeting', 'strategy/management', 'strategy/review',
  'hr/interview', 'hr/performance', 'hr/exit', 'hr/team',
  'rd/tech-review', 'rd/planning', 'rd/incident',
  'other/finance', 'other/legal'
];

/**
 * 初始化目录结构
 */
export function initDirs(): void {
  for (const [, path] of Object.entries(DIRS)) {
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
      console.log(`📁 创建目录: ${path}`);
    }
  }
  
  // 创建场景子目录
  for (const scene of SCENES) {
    const sceneDir = join(DIRS.prompts, scene);
    if (!existsSync(sceneDir)) {
      mkdirSync(sceneDir, { recursive: true });
    }
  }
}

/**
 * 保存输出文件
 */
export function saveOutput(scene: string, content: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${timestamp}.md`;
  const dir = join(DIRS.outputs, scene);
  
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  const filepath = join(dir, filename);
  writeFileSync(filepath, content, 'utf-8');
  
  return filepath;
}

/**
 * 获取场景提示词
 */
export function getPromptByScene(scene: string, version: string | null = null): string {
  const dir = join(DIRS.prompts, scene);
  
  if (!existsSync(dir)) {
    throw new Error(`场景目录不存在: ${scene}`);
  }
  
  // 如果指定版本
  if (version) {
    const filepath = join(dir, `v${version}.md`);
    if (existsSync(filepath)) {
      return filepath;
    }
    throw new Error(`提示词版本不存在: v${version}`);
  }
  
  // 否则读取 default.md 或最新的 v*.md
  const defaultPath = join(dir, 'default.md');
  if (existsSync(defaultPath)) {
    return defaultPath;
  }
  
  // 查找最新版本
  const files = readdirSync(dir)
    .filter(f => f.startsWith('v') && f.endsWith('.md'))
    .sort()
    .reverse();
  
  if (files.length > 0) {
    return join(dir, files[0]);
  }
  
  throw new Error(`场景 ${scene} 没有提示词文件`);
}

/**
 * 保存提示词版本
 */
export function savePromptVersion(
  scene: string, 
  content: string, 
  note: string = ''
): { version: number; filepath: string } {
  const dir = join(DIRS.prompts, scene);
  
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  // 获取当前版本号
  const versions = listPromptVersions(scene);
  const nextVersion = versions.length + 1;
  
  const filepath = join(dir, `v${nextVersion}.md`);
  writeFileSync(filepath, content, 'utf-8');
  
  // 更新索引
  updatePromptIndex(scene, nextVersion, note);
  
  return { version: nextVersion, filepath };
}

/**
 * 列出提示词版本
 */
export function listPromptVersions(scene: string): Array<{
  version: string;
  path: string;
  modified: Date;
}> {
  const dir = join(DIRS.prompts, scene);
  
  if (!existsSync(dir)) {
    return [];
  }
  
  return readdirSync(dir)
    .filter(f => f.startsWith('v') && f.endsWith('.md'))
    .map(f => ({
      version: f.replace('.md', ''),
      path: join(dir, f),
      modified: statSync(join(dir, f)).mtime
    }))
    .sort((a, b) => b.version.localeCompare(a.version));
}

/**
 * 更新提示词索引
 */
function updatePromptIndex(scene: string, version: number, note: string): void {
  const indexPath = join(DIRS.prompts, '_meta', 'index.json');
  
  let index: { scenes: Record<string, { versions: Array<{ id: string; created_at: string; note: string }>; current_version: string | null }> } = { scenes: {} };
  if (existsSync(indexPath)) {
    index = JSON.parse(readFileSync(indexPath, 'utf-8'));
  }
  
  if (!index.scenes[scene]) {
    index.scenes[scene] = { versions: [], current_version: null };
  }
  
  index.scenes[scene].versions.push({
    id: `v${version}`,
    created_at: new Date().toISOString(),
    note
  });
  index.scenes[scene].current_version = `v${version}`;
  
  // 确保目录存在
  const metaDir = join(DIRS.prompts, '_meta');
  if (!existsSync(metaDir)) {
    mkdirSync(metaDir, { recursive: true });
  }
  
  writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
}

/**
 * 保存评估结果
 */
export function saveEvaluation(
  _generatedPath: string, 
  _referencePath: string, 
  result: object
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `eval_${timestamp}.json`;
  const dir = DIRS.evaluations;
  
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  const filepath = join(dir, filename);
  writeFileSync(filepath, JSON.stringify(result, null, 2), 'utf-8');
  
  return filepath;
}

/**
 * 下载提示词版本
 */
export function downloadPromptVersion(
  scene: string, 
  version: string, 
  outputPath: string
): string {
  const dir = join(DIRS.prompts, scene);
  const versionFile = version.includes('.md') ? version : `v${version}.md`;
  const filepath = join(dir, versionFile);
  
  if (!existsSync(filepath)) {
    throw new Error(`提示词版本不存在: ${scene}/${versionFile}`);
  }
  
  const content = readFileSync(filepath, 'utf-8');
  writeFileSync(outputPath, content, 'utf-8');
  
  return outputPath;
}

export { DIRS, SCENES };
