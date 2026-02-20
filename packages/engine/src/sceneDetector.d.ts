/**
 * Scene Detector - Pure Function
 *
 * Based on keyword matching to automatically detect meeting scenes
 */
import type { DetectInput, DetectOutput } from './types.js';
declare const SCENE_KEYWORDS: Record<string, string[]>;
/**
 * Detect scene from content
 * Pure function - no side effects
 */
export declare function detect(input: DetectInput): DetectOutput;
/**
 * Get all supported scenes
 */
export declare function getAllScenes(): string[];
export { SCENE_KEYWORDS };
