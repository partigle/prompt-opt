/**
 * Prompt Optimizer REST API
 * 
 * Agent-friendly API with task queue
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { detect, generate, evaluate, optimize, createResponse, getAllScenes, type Task } from '../../engine/dist/index.js';
import { storage } from '../../storage/dist/index.js';
import { createTask, getTask, updateTask, listTasks } from './taskQueue.js';
import type { CreateTaskRequest, TaskQuery } from './types.js';

// Initialize Fastify
const fastify = Fastify({
  logger: true
});

// Register CORS
await fastify.register(cors, {
  origin: true
});

/**
 * Standard response helper
 */
function ok<T>(data?: T, taskId?: string, status?: string, progress?: number) {
  return createResponse(0, 'success', data, taskId, status as any, progress);
}

function error(msg: string, code: number = 1) {
  return createResponse(code, msg, undefined, undefined, 'failed', 0, msg);
}

// =============================================================================
// Routes
// =============================================================================

/**
 * Health check
 */
fastify.get('/health', async () => {
  return ok({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Get supported scenes
 */
fastify.get('/api/v1/scenes', async () => {
  const scenes = getAllScenes();
  return ok({ scenes });
});

/**
 * Create task (async)
 */
fastify.post<{ Body: CreateTaskRequest }>('/api/v1/tasks', async (request, reply) => {
  const { type, input } = request.body;
  
  if (!type || !input) {
    return error('Missing type or input', 1);
  }
  
  // Validate input based on type
  if (type === 'detect' && !input.content) {
    return error('Missing content for detect', 1);
  }
  
  if (type === 'generate' && (!input.data || !input.prompt)) {
    return error('Missing data or prompt for generate', 1);
  }
  
  if (type === 'evaluate' && (!input.generated || !input.reference)) {
    return error('Missing generated or reference for evaluate', 1);
  }
  
  if (type === 'optimize' && (!input.prompt || !input.evaluation)) {
    return error('Missing prompt or evaluation for optimize', 1);
  }
  
  // Create task
  const task = createTask(type, input);
  
  // Execute asynchronously
  executeTask(task.id, type, input).catch(err => {
    console.error('Task execution failed:', err);
    updateTask(task.id, { status: 'failed', error: err.message });
  });
  
  return ok({
    id: task.id,
    type: task.type,
    status: task.status,
    createdAt: task.createdAt
  }, task.id, 'pending', 0);
});

/**
 * Get task status
 */
fastify.get<{ Params: { id: string } }>('/api/v1/tasks/:id', async (request, reply) => {
  const { id } = request.params;
  const task = getTask(id);
  
  if (!task) {
    return error('Task not found', 1);
  }
  
  return ok({
    id: task.id,
    type: task.type,
    status: task.status,
    progress: task.progress,
    output: task.output,
    error: task.error,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  }, task.id, task.status, task.progress);
});

/**
 * List tasks
 */
fastify.get<{ Querystring: TaskQuery }>('/api/v1/tasks', async (request, reply) => {
  const status = request.query.status as Task['status'] | undefined;
  const type = request.query.type as Task['type'] | undefined;
  const { limit, offset } = request.query;
  
  const tasks = listTasks({ status, type, limit, offset });
  
  return ok({
    tasks: tasks.map(t => ({
      id: t.id,
      type: t.type,
      status: t.status,
      progress: t.progress,
      createdAt: t.createdAt
    })),
    total: tasks.length
  });
});

/**
 * Sync: Detect scene (no task queue)
 */
fastify.post<{ Body: { content: string } }>('/api/v1/detect', async (request, reply) => {
  const { content } = request.body;
  
  if (!content) {
    return error('Missing content', 1);
  }
  
  try {
    const result = detect({ content });
    return ok({ result });
  } catch (err: any) {
    return error(err.message, 1);
  }
});

/**
 * Sync: Generate summary (no task queue)
 */
fastify.post<{ Body: { data: string; prompt: string; model?: string } }>('/api/v1/generate', async (request, reply) => {
  const { data, prompt, model } = request.body;
  
  if (!data || !prompt) {
    return error('Missing data or prompt', 1);
  }
  
  try {
    const result = await generate({ data, prompt, model });
    return ok({ result });
  } catch (err: any) {
    return error(err.message, 1);
  }
});

/**
 * Sync: Evaluate summary (no task queue)
 */
fastify.post<{ Body: { generated: string; reference: string; model?: string } }>('/api/v1/evaluate', async (request, reply) => {
  const { generated, reference, model } = request.body;
  
  if (!generated || !reference) {
    return error('Missing generated or reference', 1);
  }
  
  try {
    const result = await evaluate({ generated, reference, model });
    return ok({ result });
  } catch (err: any) {
    return error(err.message, 1);
  }
});

/**
 * Sync: Optimize prompt (no task queue)
 */
fastify.post<{ Body: { prompt: string; evaluation: any; model?: string } }>('/api/v1/optimize', async (request, reply) => {
  const { prompt, evaluation, model } = request.body;
  
  if (!prompt || !evaluation) {
    return error('Missing prompt or evaluation', 1);
  }
  
  try {
    const result = await optimize({ prompt, evaluation, model });
    return ok({ result });
  } catch (err: any) {
    return error(err.message, 1);
  }
});

// =============================================================================
// Task Execution
// =============================================================================

async function executeTask(taskId: string, type: string, input: any) {
  updateTask(taskId, { status: 'running', progress: 10 });
  
  try {
    let output: any;
    
    switch (type) {
      case 'detect':
        output = detect({ content: input.content });
        break;
        
      case 'generate':
        output = await generate({ data: input.data, prompt: input.prompt, model: input.model });
        break;
        
      case 'evaluate':
        output = await evaluate({ generated: input.generated, reference: input.reference, model: input.model });
        break;
        
      case 'optimize':
        output = await optimize({ prompt: input.prompt, evaluation: input.evaluation, model: input.model });
        break;
        
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
    
    updateTask(taskId, { 
      status: 'success', 
      progress: 100, 
      output 
    });
    
  } catch (err: any) {
    updateTask(taskId, { 
      status: 'failed', 
      progress: 0, 
      error: err.message 
    });
  }
}

// =============================================================================
// Start Server
// =============================================================================

const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

fastify.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  
  console.log(`🚀 API Server running at ${address}`);
});

export { fastify };
