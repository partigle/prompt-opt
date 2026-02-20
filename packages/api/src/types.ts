/**
 * API Types
 */

export interface CreateTaskRequest {
  type: 'detect' | 'generate' | 'evaluate' | 'optimize';
  input: {
    content?: string;
    data?: string;
    prompt?: string;
    generated?: string;
    reference?: string;
    evaluation?: any;
    model?: string;
  };
}

export interface TaskQuery {
  status?: 'pending' | 'running' | 'success' | 'failed';
  type?: string;
  limit?: number;
  offset?: number;
}

export interface APIConfig {
  port: number;
  host: string;
  cors: boolean;
}
