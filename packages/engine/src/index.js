/**
 * Prompt Optimizer Engine
 *
 * Core logic library - Pure functions with structured input/output
 * No side effects, no console output, no file operations
 */
// Scene Detection
export { detect, getAllScenes, SCENE_KEYWORDS } from './sceneDetector.js';
// LLM Operations
export { generate, evaluate, optimize, getSupportedModels, MODELS } from './llmClient.js';
/**
 * Create a standardized engine response
 */
export function createResponse(code, msg, data, taskId, status, progress, error) {
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
export function createTaskId(type) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `task_${type}_${timestamp}_${random}`;
}
//# sourceMappingURL=index.js.map