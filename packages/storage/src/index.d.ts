/**
 * Unified Storage Layer
 *
 * Encapsulates all file operations with:
 * - File locking for concurrent safety
 * - Unified API
 * - Error handling
 */
import type { StorageOptions, ReadOptions, WriteOptions, ListOptions, ListResult } from './types.js';
/**
 * Storage class
 */
export declare class Storage {
    private basePath;
    private lockTimeout;
    constructor(options?: StorageOptions);
    /**
     * Resolve path relative to base
     */
    private resolve;
    /**
     * Check if path exists
     */
    exists(filePath: string): Promise<boolean>;
    /**
     * Read file content
     */
    read(filePath: string, options?: ReadOptions): Promise<string>;
    /**
     * Write file content
     */
    write(filePath: string, content: string, options?: WriteOptions): Promise<void>;
    /**
     * Read file as JSON
     */
    readJSON<T = any>(filePath: string): Promise<T>;
    /**
     * Write JSON to file
     */
    writeJSON(filePath: string, data: any, options?: WriteOptions): Promise<void>;
    /**
     * List directory contents
     */
    list(dirPath: string, options?: ListOptions): Promise<ListResult[]>;
    /**
     * Create directory
     */
    mkdir(dirPath: string): Promise<void>;
    /**
     * Delete file or directory
     */
    delete(filePath: string): Promise<void>;
    /**
     * Copy file
     */
    copy(source: string, destination: string): Promise<void>;
    /**
     * Move/rename file
     */
    move(source: string, destination: string): Promise<void>;
    /**
     * Get file stats
     */
    stat(filePath: string): Promise<{
        size: number;
        isDirectory: boolean;
        isFile: boolean;
        modifiedTime: number;
        createdTime: number;
    }>;
    /**
     * Ensure directory exists
     */
    ensureDir(dirPath: string): Promise<void>;
}
/**
 * Default storage instance
 */
export declare const storage: Storage;
export default Storage;
