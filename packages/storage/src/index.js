/**
 * Unified Storage Layer
 *
 * Encapsulates all file operations with:
 * - File locking for concurrent safety
 * - Unified API
 * - Error handling
 */
import fs from 'fs/promises';
import path from 'path';
// Lock map for concurrent file access
const locks = new Map();
const lockWaiters = new Map();
/**
 * Acquire file lock
 */
async function acquireLock(filePath, timeout = 5000) {
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
    basePath;
    lockTimeout;
    constructor(options = {}) {
        this.basePath = options.basePath || process.cwd();
        this.lockTimeout = options.lockTimeout || 5000;
    }
    /**
     * Resolve path relative to base
     */
    resolve(relativePath) {
        if (path.isAbsolute(relativePath)) {
            return relativePath;
        }
        return path.join(this.basePath, relativePath);
    }
    /**
     * Check if path exists
     */
    async exists(filePath) {
        try {
            await fs.access(this.resolve(filePath));
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Read file content
     */
    async read(filePath, options = {}) {
        const resolvedPath = this.resolve(filePath);
        const lock = await acquireLock(resolvedPath);
        try {
            return await fs.readFile(resolvedPath, options.encoding || 'utf-8');
        }
        finally {
            lock.release();
        }
    }
    /**
     * Write file content
     */
    async write(filePath, content, options = {}) {
        const resolvedPath = this.resolve(filePath);
        const lock = await acquireLock(resolvedPath);
        try {
            if (options.mkdir) {
                const dir = path.dirname(resolvedPath);
                await fs.mkdir(dir, { recursive: true });
            }
            await fs.writeFile(resolvedPath, content, options.encoding || 'utf-8');
        }
        finally {
            lock.release();
        }
    }
    /**
     * Read file as JSON
     */
    async readJSON(filePath) {
        const content = await this.read(filePath);
        return JSON.parse(content);
    }
    /**
     * Write JSON to file
     */
    async writeJSON(filePath, data, options = {}) {
        const content = JSON.stringify(data, null, 2);
        await this.write(filePath, content, { ...options, encoding: 'utf-8' });
    }
    /**
     * List directory contents
     */
    async list(dirPath, options = {}) {
        const resolvedPath = this.resolve(dirPath);
        const results = [];
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
    async mkdir(dirPath) {
        const resolvedPath = this.resolve(dirPath);
        await fs.mkdir(resolvedPath, { recursive: true });
    }
    /**
     * Delete file or directory
     */
    async delete(filePath) {
        const resolvedPath = this.resolve(filePath);
        const lock = await acquireLock(resolvedPath);
        try {
            const stats = await fs.stat(resolvedPath);
            if (stats.isDirectory()) {
                await fs.rm(resolvedPath, { recursive: true });
            }
            else {
                await fs.unlink(resolvedPath);
            }
        }
        finally {
            lock.release();
        }
    }
    /**
     * Copy file
     */
    async copy(source, destination) {
        const resolvedSource = this.resolve(source);
        const resolvedDest = this.resolve(destination);
        const lock = await acquireLock(resolvedDest);
        try {
            await fs.copyFile(resolvedSource, resolvedDest);
        }
        finally {
            lock.release();
        }
    }
    /**
     * Move/rename file
     */
    async move(source, destination) {
        const resolvedSource = this.resolve(source);
        const resolvedDest = this.resolve(destination);
        const lock = await acquireLock(resolvedDest);
        try {
            await fs.rename(resolvedSource, resolvedDest);
        }
        finally {
            lock.release();
        }
    }
    /**
     * Get file stats
     */
    async stat(filePath) {
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
    async ensureDir(dirPath) {
        const resolvedPath = this.resolve(dirPath);
        await fs.mkdir(resolvedPath, { recursive: true });
    }
}
/**
 * Default storage instance
 */
export const storage = new Storage();
export default Storage;
//# sourceMappingURL=index.js.map