/**
 * Prompt Optimizer Engine
 * 
 * Core logic library - Pure functions with structured input/output
 * No side effects, no console output, no file operations
 */

// Types
export type {
  DetectInput,
  DetectOutput,
  GenerateInput,
  GenerateOutput,
  EvaluateInput,
  EvaluateOutput,
  OptimizeInput,
  OptimizeOutput,
  EvaluationResult,
  Task,
  EngineResponse,
  ModelConfig
} from './types.js';

// Scene Detection
export { detect, getAllScenes, SCENE_KEYWORDS } from './sceneDetector.js';

// LLM Operations
export { generate, evaluate, optimize, getSupportedModels, MODELS } from './llmClient.js';

/**
 * Create a standardized engine response
 */
export function createResponse<T>(
  code: number,
  msg: string,
  data?: T,
  taskId?: string,
  status?: 'pending' | 'running' | 'success' | 'failed',
  progress?: number,
  error?: string
) {
  return {
    code,
    msg,
    taskId,
    status: status || (code === 0 ? 'success' : 'failed'),
    progress: progress ?? (code === 0 ? 100 : 0),
    data,
    error: error || null
  };
}

/**
 * Create a task ID
 */
export function createTaskId(type: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `task_${type}_${timestamp}_${random}`;
}
