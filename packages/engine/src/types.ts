/**
 * Engine Types - TypeScript Type Definitions
 */

// Detect Types
export interface DetectInput {
  content: string;
}

export interface DetectOutput {
  scene: string;
  confidence: number;
  keywords: string[];
  allScores: Record<string, number>;
}

// Generate Types
export interface GenerateInput {
  data: string;
  prompt: string;
  model?: string;
}

export interface GenerateOutput {
  content: string;
  model: string;
  tokens?: number;
}

// Evaluate Types
export interface EvaluateInput {
  generated: string;
  reference: string;
  model?: string;
}

export interface EvaluationResult {
  total: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  completeness: number;
  detail: number;
  thoroughness: number;
  word_count_diff: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface EvaluateOutput extends EvaluationResult {}

// Optimize Types
export interface OptimizeInput {
  prompt: string;
  evaluation: EvaluationResult;
  model?: string;
}

export interface OptimizeOutput {
  content: string;
  model: string;
}

// Task Types
export interface Task {
  id: string;
  type: 'detect' | 'generate' | 'evaluate' | 'optimize';
  status: 'pending' | 'running' | 'success' | 'failed';
  progress: number;
  input: any;
  output?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface EngineResponse<T = any> {
  code: number;
  msg: string;
  taskId?: string;
  status?: 'pending' | 'running' | 'success' | 'failed';
  progress: number;
  data?: T;
  error?: string;
}

// Model Config
export interface ModelConfig {
  name: string;
  provider: string;
  apiKeyEnv: string;
  endpoint: string;
  modelName: string;
}
