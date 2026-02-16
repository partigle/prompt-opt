/**
 * 场景检测结果
 */
export interface SceneDetectionResult {
  scene: string;
  confidence: number;
  keywords: string[];
  allScores?: Record<string, number>;
}

/**
 * 评估结果
 */
export interface EvaluationResult {
  completeness: number;
  detail: number;
  thoroughness: number;
  word_count_diff: number;
  total: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

/**
 * 提示词版本信息
 */
export interface PromptVersion {
  version: string;
  path: string;
  modified: Date;
}

/**
 * 场景元数据
 */
export interface SceneMeta {
  versions: Array<{
    id: string;
    created_at: string;
    note: string;
  }>;
  current_version: string | null;
}

/**
 * 提示词索引
 */
export interface PromptIndex {
  scenes: Record<string, SceneMeta>;
}

/**
 * CLI 选项
 */
export interface GlobalOptions {
  verbose: boolean;
  config?: string;
}

export interface DetectOptions {
  output?: string;
}

export interface GenerateOptions {
  data: string;
  prompt: string;
  scene?: string;
  output?: string;
  model: string;
}

export interface EvaluateOptions {
  generated: string;
  reference: string;
  output?: string;
  model: string;
  prompt?: string;
}

export interface OptimizeOptions {
  prompt: string;
  evaluation: string;
  output?: string;
  model: string;
  save: boolean;
  scene?: string;
}

export interface VersionListOptions {
  scene: string;
}

export interface VersionSaveOptions {
  prompt: string;
  scene: string;
  message?: string;
}

export interface VersionDownloadOptions {
  scene: string;
  version: string;
  output: string;
}
