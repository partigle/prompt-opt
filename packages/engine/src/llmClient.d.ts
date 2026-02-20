/**
 * LLM Client - Multi-Model Support
 *
 * Supports: QWEN MAX, DeepSeek V3, 豆包 (future)
 * Pure functions with structured input/output
 */
import type { ModelConfig, GenerateInput, GenerateOutput, EvaluateInput, EvaluateOutput, OptimizeInput, OptimizeOutput } from './types.js';
declare const MODELS: Record<string, ModelConfig>;
/**
 * Generate summary from dialogue data
 */
export declare function generate(input: GenerateInput): Promise<GenerateOutput>;
/**
 * Evaluate summary (LLM-as-a-Judge)
 */
export declare function evaluate(input: EvaluateInput): Promise<EvaluateOutput>;
/**
 * Optimize prompt based on evaluation
 */
export declare function optimize(input: OptimizeInput): Promise<OptimizeOutput>;
/**
 * Get supported models
 */
export declare function getSupportedModels(): string[];
export { MODELS };
