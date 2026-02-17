import * as fs from 'fs';
import * as path from 'path';

export interface LogEntry {
  timestamp: string;
  command: string;
  input: {
    args: string[];
    options: Record<string, any>;
  };
  output?: {
    success: boolean;
    data?: any;
    error?: string;
    duration: number;
  };
  status: 'success' | 'error' | 'pending';
  sessionId?: string;
}

export interface LogStats {
  totalCommands: number;
  successCount: number;
  errorCount: number;
  avgDuration: number;
}

class Logger {
  private logDir: string;
  private currentLog: LogEntry | null = null;
  private startTime: number = 0;

  constructor(logDir: string = path.join(process.cwd(), 'logs')) {
    this.logDir = logDir;
    this.ensureDir();
  }

  private ensureDir(): void {
    const dirs = ['commands', 'evaluations', 'analysis'];
    dirs.forEach(dir => {
      const dirPath = path.join(this.logDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  start(command: string, args: string[] = [], options: Record<string, any> = {}): void {
    this.startTime = Date.now();
    this.currentLog = {
      timestamp: new Date().toISOString(),
      command,
      input: { args, options },
      status: 'pending'
    };
  }

  end(success: boolean, data?: any, error?: string): void {
    if (!this.currentLog) return;

    const duration = Date.now() - this.startTime;
    this.currentLog.output = {
      success,
      data,
      error,
      duration
    };
    this.currentLog.status = success ? 'success' : 'error';

    this.save(this.currentLog);
    this.currentLog = null;
  }

  private save(entry: LogEntry): void {
    const date = new Date().toISOString().split('T')[0];
    const filename = `${entry.command}_${date}.jsonl`;
    const filepath = path.join(this.logDir, 'commands', filename);

    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(filepath, line);
  }

  // Save evaluation result
  saveEvaluation(evaluation: {
    promptId: string;
    scene: string;
    scores: Record<string, number>;
    summary: string;
    timestamp: string;
  }): void {
    const date = new Date().toISOString().split('T')[0];
    const filepath = path.join(this.logDir, 'evaluations', `${date}.jsonl`);
    
    const line = JSON.stringify(evaluation) + '\n';
    fs.appendFileSync(filepath, line);
  }

  // Get statistics
  getStats(command?: string, days: number = 7): LogStats {
    const stats: LogStats = {
      totalCommands: 0,
      successCount: 0,
      errorCount: 0,
      avgDuration: 0
    };

    const logsDir = path.join(this.logDir, 'commands');
    if (!fs.existsSync(logsDir)) return stats;

    const files = fs.readdirSync(logsDir)
      .filter(f => f.endsWith('.jsonl'))
      .slice(-days);

    let totalDuration = 0;

    files.forEach(file => {
      const content = fs.readFileSync(path.join(logsDir, file), 'utf-8');
      content.split('\n').filter(Boolean).forEach(line => {
        try {
          const entry: LogEntry = JSON.parse(line);
          if (command && entry.command !== command) return;
          
          stats.totalCommands++;
          if (entry.status === 'success') stats.successCount++;
          if (entry.status === 'error') stats.errorCount++;
          if (entry.output?.duration) totalDuration += entry.output.duration;
        } catch {}
      });
    });

    stats.avgDuration = stats.totalCommands > 0 
      ? Math.round(totalDuration / stats.totalCommands) 
      : 0;

    return stats;
  }

  // Query logs
  query(filters: {
    command?: string;
    status?: 'success' | 'error';
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): LogEntry[] {
    const logsDir = path.join(this.logDir, 'commands');
    if (!fs.existsSync(logsDir)) return [];

    const files = fs.readdirSync(logsDir)
      .filter(f => f.endsWith('.jsonl'));

    const results: LogEntry[] = [];

    files.forEach(file => {
      const content = fs.readFileSync(path.join(logsDir, file), 'utf-8');
      content.split('\n').filter(Boolean).forEach(line => {
        try {
          const entry: LogEntry = JSON.parse(line);
          
          if (filters.command && entry.command !== filters.command) return;
          if (filters.status && entry.status !== filters.status) return;
          if (filters.startDate && entry.timestamp < filters.startDate) return;
          if (filters.endDate && entry.timestamp > filters.endDate) return;
          
          results.push(entry);
        } catch {}
      });
    });

    return results.slice(-(filters.limit || 100));
  }

  // Get evaluation statistics by scene
  getEvaluationStats(scene?: string, days: number = 7): Array<{
    scene: string;
    count: number;
    avgScore: number;
    scores: Record<string, number[]>;
  }> {
    const evalDir = path.join(this.logDir, 'evaluations');
    if (!fs.existsSync(evalDir)) return [];

    const files = fs.readdirSync(evalDir)
      .filter(f => f.endsWith('.jsonl'))
      .slice(-days);

    const byScene: Record<string, { count: number; totalScore: number; scores: Record<string, number[]> }> = {};

    files.forEach(file => {
      const content = fs.readFileSync(path.join(evalDir, file), 'utf-8');
      content.split('\n').filter(Boolean).forEach(line => {
        try {
          const evalEntry: any = JSON.parse(line);
          if (scene && evalEntry.scene !== scene) return;
          
          if (!byScene[evalEntry.scene]) {
            byScene[evalEntry.scene] = { count: 0, totalScore: 0, scores: {} };
          }
          
          byScene[evalEntry.scene].count++;
          const score = evalEntry.scores?.total || evalEntry.scores?.['总分'] || 0;
          byScene[evalEntry.scene].totalScore += score;
          
          // Collect individual scores
          if (evalEntry.scores) {
            Object.entries(evalEntry.scores).forEach(([key, value]) => {
              if (!byScene[evalEntry.scene].scores[key]) {
                byScene[evalEntry.scene].scores[key] = [];
              }
              byScene[evalEntry.scene].scores[key].push(value as number);
            });
          }
        } catch {}
      });
    });

    return Object.entries(byScene).map(([scene, data]) => ({
      scene,
      count: data.count,
      avgScore: data.count > 0 ? data.totalScore / data.count : 0,
      scores: data.scores
    }));
  }
}

export default Logger;
export { Logger };
