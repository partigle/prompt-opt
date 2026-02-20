const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  taskId?: string;
  status?: string;
  progress: number;
  data?: T;
  error?: string;
}

export async function detectScene(content: string): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}/api/v1/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return res.json();
}

export async function createTask(type: string, input: any): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}/api/v1/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, input }),
  });
  return res.json();
}

export async function getTaskStatus(taskId: string): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}/api/v1/tasks/${taskId}`);
  return res.json();
}

export async function listTasks(status?: string): Promise<ApiResponse> {
  const url = status 
    ? `${API_BASE}/api/v1/tasks?status=${status}`
    : `${API_BASE}/api/v1/tasks`;
  const res = await fetch(url);
  return res.json();
}

export async function generateSummary(data: string, prompt: string, model?: string): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}/api/v1/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, prompt, model }),
  });
  return res.json();
}

export async function evaluateSummary(generated: string, reference: string, model?: string): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}/api/v1/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ generated, reference, model }),
  });
  return res.json();
}
