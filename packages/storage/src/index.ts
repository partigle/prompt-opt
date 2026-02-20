/**
 * Unified Storage Layer
 * 
 * Encapsulates all file operations with:
 * - File locking for concurrent safety
 * - Unified API
 * - Error handling
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import type { StorageOptions, FileLock, ReadOptions, WriteOptions, ListOptions, ListResult } from './types.js';

// Lock map for concurrent file access
const locks = new Map<string, number>();
const lockWaiters = new Map<string, () => void>();

/**
 * Acquire file lock
 */
async function acquireLock(filePath: string, timeout: number = 5000): Promise<FileLock> {
  const startTime = Date.now();
  
  while (locks.get(filePath) === 1) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Lock timeout for: ${filePath}`);
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  locks.set(filePath, 1);
  
  return {
    release: () => {
      locks.set(filePath, 0);
      const waiter = lockWaiters.get(filePath);
      if (waiter) {
        lockWaiters.delete(filePath);
        waiter();
      }
    }
  };
}

/**
 * Storage class
 */
export class Storage {
  private basePath: string;
  private lockTimeout: number;
  
  constructor(options: StorageOptions = {}) {
    this.basePath = options.basePath || process.cwd();
    this.lockTimeout = options.lockTimeout || 5000;
  }
  
  /**
   * Resolve path relative to base
   */
  private resolve(relativePath: string): string {
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }
    return path.join(this.basePath, relativePath);
  }
  
  /**
   * Check if path exists
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(filePath));
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Read file content
   */
  async read(filePath: string, options: ReadOptions = {}): Promise<string> {
    const resolvedPath = this.resolve(filePath);
    const lock = await acquireLock(resolvedPath);
    try {
      return await fs.readFile(resolvedPath, options.encoding || 'utf-8');
    } finally {
      lock.release();
    }
  }
  
  /**
   * Write file content
   */
  async write(filePath: string, content: string, options: WriteOptions = {}): Promise<void> {
    const resolvedPath = this.resolve(filePath);
    const lock = await acquireLock(resolvedPath);
    try {
      if (options.mkdir) {
        const dir = path.dirname(resolvedPath);
        await fs.mkdir(dir, { recursive: true });
      }
      await fs.writeFile(resolvedPath, content, options.encoding || 'utf-8');
    } finally {
      lock.release();
    }
  }
  
  /**
   * Read file as JSON
   */
  async readJSON<T = any>(filePath: string): Promise<T> {
    const content = await this.read(filePath);
    return JSON.parse(content);
  }
  
  /**
   * Write JSON to file
   */
  async writeJSON(filePath: string, data: any, options: WriteOptions = {}): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await this.write(filePath, content, { ...options, encoding: 'utf-8' });
  }
  
  /**
   * List directory contents
   */
  async list(dirPath: string, options: ListOptions = {}): Promise<ListResult[]> {
    const resolvedPath = this.resolve(dirPath);
    const results: ListResult[] = [];
    
    const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(resolvedPath, entry.name);
      
      // Filter by extension if specified
      if (options.extensions && options.extensions.length > 0) {
        const ext = path.extname(entry.name).slice(1);
        if (!options.extensions.includes(ext)) {
          continue;
        }
      }
      
      const stats = await fs.stat(fullPath);
      
      results.push({
        path: fullPath,
        name: entry.name,
        isDirectory: entry.isDirectory(),
        size: stats.size,
        modifiedTime: stats.mtimeMs
      });
      
      // Recursive
      if (options.recursive && entry.isDirectory()) {
        const subResults = await this.list(path.join(dirPath, entry.name), options);
        results.push(...subResults);
      }
    }
    
    return results;
  }
  
  /**
   * Create directory
   */
  async mkdir(dirPath: string): Promise<void> {
    const resolvedPath = this.resolve(dirPath);
    await fs.mkdir(resolvedPath, { recursive: true });
  }
  
  /**
   * Delete file or directory
   */
  async delete(filePath: string): Promise<void> {
    const resolvedPath = this.resolve(filePath);
    const lock = await acquireLock(resolvedPath);
    try {
      const stats = await fs.stat(resolvedPath);
      if (stats.isDirectory()) {
        await fs.rm(resolvedPath, { recursive: true });
      } else {
        await fs.unlink(resolvedPath);
      }
    } finally {
      lock.release();
    }
  }
  
  /**
   * Copy file
   */
  async copy(source: string, destination: string): Promise<void> {
    const resolvedSource = this.resolve(source);
    const resolvedDest = this.resolve(destination);
    const lock = await acquireLock(resolvedDest);
    try {
      await fs.copyFile(resolvedSource, resolvedDest);
    } finally {
      lock.release();
    }
  }
  
  /**
   * Move/rename file
   */
  async move(source: string, destination: string): Promise<void> {
    const resolvedSource = this.resolve(source);
    const resolvedDest = this.resolve(destination);
    const lock = await acquireLock(resolvedDest);
    try {
      await fs.rename(resolvedSource, resolvedDest);
    } finally {
      lock.release();
    }
  }
  
  /**
   * Get file stats
   */
  async stat(filePath: string): Promise<{
    size: number;
    isDirectory: boolean;
    isFile: boolean;
    modifiedTime: number;
    createdTime: number;
  }> {
    const resolvedPath = this.resolve(filePath);
    const stats = await fs.stat(resolvedPath);
    return {
      size: stats.size,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      modifiedTime: stats.mtimeMs,
      createdTime: stats.birthtimeMs
    };
  }
  
  /**
   * Ensure directory exists
   */
  async ensureDir(dirPath: string): Promise<void> {
    const resolvedPath = this.resolve(dirPath);
    await fs.mkdir(resolvedPath, { recursive: true });
  }
}

/**
 * Default storage instance
 */
export const storage = new Storage();

export default Storage;
