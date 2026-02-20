/**
 * Prompt Optimizer Engine
 *
 * Core logic library - Pure functions with structured input/output
 * No side effects, no console output, no file operations
 */
export type { DetectInput, DetectOutput, GenerateInput, GenerateOutput, EvaluateInput, EvaluateOutput, OptimizeInput, OptimizeOutput, EvaluationResult, Task, EngineResponse, ModelConfig } from './types.js';
export { detect, getAllScenes, SCENE_KEYWORDS } from './sceneDetector.js';
export { generate, evaluate, optimize, getSupportedModels, MODELS } from './llmClient.js';
/**
 * Create a standardized engine response
 */
export declare function createResponse<T>(code: number, msg: string, data?: T, taskId?: string, status?: 'pending' | 'running' | 'success' | 'failed', progress?: number, error?: string): {
    code: number;
    msg: string;
    taskId: string | undefined;
    status: "pending" | "running" | "success" | "failed";
    progress: number;
    data: T | undefined;
    error: string | null;
};
/**
 * Create a task ID
 */
export declare function createTaskId(type: string): string;
