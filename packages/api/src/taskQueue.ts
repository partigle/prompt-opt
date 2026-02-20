/**
 * Task Queue - In-memory task management
 * 
 * Handles task creation, status tracking, and async execution
 */

import type { Task } from '../../engine/dist/index.js';

// In-memory task storage
const tasks = new Map<string, Task>();

/**
 * Create a new task
 */
export function createTask(type: Task['type'], input: any): Task {
  const id = `task_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  const task: Task = {
    id,
    type,
    status: 'pending',
    progress: 0,
    input,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  tasks.set(id, task);
  return task;
}

/**
 * Get task by ID
 */
export function getTask(id: string): Task | undefined {
  return tasks.get(id);
}

/**
 * Update task status
 */
export function updateTask(id: string, updates: Partial<Task>): Task | undefined {
  const task = tasks.get(id);
  if (!task) return undefined;
  
  const updated = {
    ...task,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  tasks.set(id, updated);
  return updated;
}

/**
 * List tasks with optional filters
 */
export function listTasks(options: {
  status?: Task['status'];
  type?: Task['type'];
  limit?: number;
  offset?: number;
} = {}): Task[] {
  let result = Array.from(tasks.values());
  
  if (options.status) {
    result = result.filter(t => t.status === options.status);
  }
  
  if (options.type) {
    result = result.filter(t => t.type === options.type);
  }
  
  // Sort by creation time (newest first)
  result.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const offset = options.offset || 0;
  const limit = options.limit || 50;
  
  return result.slice(offset, offset + limit);
}

/**
 * Delete task
 */
export function deleteTask(id: string): boolean {
  return tasks.delete(id);
}

/**
 * Clear all completed tasks (older than 24h)
 */
export function cleanupOldTasks(): number {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  
  let deleted = 0;
  for (const [id, task] of tasks.entries()) {
    const createdAt = new Date(task.createdAt).getTime();
    if (task.status !== 'running' && createdAt < dayAgo) {
      tasks.delete(id);
      deleted++;
    }
  }
  
  return deleted;
}

export default {
  createTask,
  getTask,
  updateTask,
  listTasks,
  deleteTask,
  cleanupOldTasks
};
