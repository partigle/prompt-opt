/**
 * Storage Types
 */

export interface StorageOptions {
  basePath?: string;
  lockTimeout?: number;
}

export interface FileLock {
  release: () => void;
}

export interface ReadOptions {
  encoding?: BufferEncoding;
}

export interface WriteOptions {
  encoding?: BufferEncoding;
  mkdir?: boolean;
}

export interface ListOptions {
  recursive?: boolean;
  extensions?: string[];
}

export interface ListResult {
  path: string;
  name: string;
  isDirectory: boolean;
  size?: number;
  modifiedTime?: number;
}
