import { Command } from 'commander';
import chalk from 'chalk';
import { getLogger } from '../logs/index.js';
import * as fs from 'fs';

interface DailyTrend {
  date: string;
  total: number;
  success: number;
  error: number;
  successRate: number;
  avgDuration: number;
}

const insightCmd = new Command('insight')
  .description('查看日志分析和建议')
  .option('-c, --command <cmd>', '查看特定命令 (detect|generate|evaluate|optimize)')
  .option('-d, --days <days>', '查看天数 (默认7)', '7')
  .option('-o, --output <file>', '输出报告到文件')
  .option('-t, --trend', '显示每日趋势')
  .option('-a, --alert <threshold>', '成功率告警阈值 (默认80)')
  .option('-s, --scene <scene>', '按场景统计')
  .option('--claude', '生成 CLAUDE.md 改进建议')
  .option('--claudemd <file>', '输出 CLAUDE.md 到指定文件')
  .action(async (options: {
    command?: string;
    days?: string;
    output?: string;
    trend?: boolean;
    alert?: string;
    scene?: string;
    claude?: boolean;
    claudemd?: string;
  }) => {
    const logger = getLogger();
    const days = parseInt(options.days || '7');
    const alertThreshold = parseInt(options.alert || '80');
    
    console.log(chalk.blue('📊 日志分析中...\n'));
    
    try {
      // Get stats
      const stats = logger.getStats(options.command, days);
      
      console.log(chalk.green('📈 统计概览:'));
      console.log(`  总命令数: ${chalk.cyan(stats.totalCommands)}`);
      console.log(`  成功: ${chalk.green(stats.successCount)}`);
      console.log(`  失败: ${chalk.red(stats.errorCount)}`);
      console.log(`  平均耗时: ${chalk.yellow(stats.avgDuration + 'ms')}`);
      
      // Calculate success rate
      const successRate = stats.totalCommands > 0 
        ? ((stats.successCount / stats.totalCommands) * 100).toFixed(1) 
        : '0';
      console.log(`  成功率: ${chalk.cyan(successRate + '%')}`);
      
      // Alert if below threshold
      if (parseFloat(successRate) < alertThreshold) {
        console.log(chalk.red(`\n⚠️  警告: 成功率 ${successRate}% 低于阈值 ${alertThreshold}%`));
      }
      
      // Daily trend visualization
      if (options.trend) {
        const trends = calculateDailyTrends(logger, options.command, days);
        if (trends.length > 0) {
          console.log(chalk.green('\n📈 每日趋势:'));
          trends.forEach(t => {
            const rateColor = t.successRate >= 80 ? chalk.green : t.successRate >= 60 ? chalk.yellow : chalk.red;
            const bar = '█'.repeat(Math.round(t.successRate / 10));
            console.log(`  ${t.date}: ${rateColor(bar)} ${t.successRate}% (${t.success}/${t.total})`);
          });
        }
      }
      
      // Get recent logs for pattern analysis
      const recentLogs = logger.query({
        command: options.command,
        limit: 50
      });
      
      // Analyze patterns
      if (recentLogs.length > 0) {
        console.log(chalk.green('\n🔍 模式分析:'));
        
        // Command distribution
        const cmdCounts: Record<string, number> = {};
        recentLogs.forEach(log => {
          cmdCounts[log.command] = (cmdCounts[log.command] || 0) + 1;
        });
        
        console.log(chalk.gray('  命令分布:'));
        Object.entries(cmdCounts).forEach(([cmd, count]) => {
          console.log(`    - ${cmd}: ${count}次`);
        });
        
        // Error analysis
        const errors = recentLogs.filter(l => l.status === 'error');
        if (errors.length > 0) {
          console.log(chalk.gray('\n  错误分析:'));
          
          // Categorize errors
          const errorTypes: Record<string, string[]> = {
            '超时': [],
            '格式错误': [],
            '评估低分': [],
            '其他': []
          };
          
          errors.forEach(err => {
            const errorMsg = err.output?.error || 'Unknown';
            if (errorMsg.includes('timeout') || errorMsg.includes('超时')) {
              errorTypes['超时'].push(err.command);
            } else if (errorMsg.includes('format') || errorMsg.includes('格式')) {
              errorTypes['格式错误'].push(err.command);
            } else if (errorMsg.includes('low') || errorMsg.includes('低')) {
              errorTypes['评估低分'].push(err.command);
            } else {
              errorTypes['其他'].push(`${err.command}: ${errorMsg.slice(0, 30)}`);
            }
          });
          
          Object.entries(errorTypes).forEach(([type, items]) => {
            if (items.length > 0) {
              console.log(`    ${type}: ${items.length}次`);
            }
          });
        }
        
        // Scene-based statistics from evaluations
        if (options.scene || options.command === 'evaluate') {
          const evalStats = getEvaluationStats(logger, options.scene, days);
          if (evalStats.length > 0) {
            console.log(chalk.green('\n📊 场景统计:'));
            evalStats.forEach(s => {
              const scoreColor = s.avgScore >= 80 ? chalk.green : s.avgScore >= 60 ? chalk.yellow : chalk.red;
              console.log(`    - ${s.scene}: ${scoreColor(s.avgScore.toFixed(1))}分 (${s.count}次评估)`);
            });
          }
        }
        
        // Generate suggestions
        console.log(chalk.green('\n💡 改进建议:'));
        
        if (parseFloat(successRate) < 80) {
          console.log(chalk.yellow('  ⚠️ 成功率较低，建议检查错误日志'));
        }
        
        if (stats.avgDuration > 30000) {
          console.log(chalk.yellow('  ⚠️ 平均耗时较长，考虑优化提示词或使用更快模型'));
        }
        
        // Best performing command
        const cmdSuccess: Record<string, { success: number; total: number }> = {};
        recentLogs.forEach(log => {
          if (!cmdSuccess[log.command]) {
            cmdSuccess[log.command] = { success: 0, total: 0 };
          }
          cmdSuccess[log.command].total++;
          if (log.status === 'success') {
            cmdSuccess[log.command].success++;
          }
        });
        
        let bestCmd = '';
        let bestRate = 0;
        Object.entries(cmdSuccess).forEach(([cmd, data]) => {
          const rate = data.success / data.total;
          if (rate > bestRate) {
            bestRate = rate;
            bestCmd = cmd;
          }
        });
        
        if (bestCmd) {
          console.log(chalk.green(`  ✅ 表现最好的命令: ${bestCmd} (${(bestRate * 100).toFixed(1)}%)`));
        }
        
        // Save to file if requested
        if (options.output) {
          const report = generateReport(stats, recentLogs, cmdCounts);
          fs.writeFileSync(options.output, report, 'utf-8');
          console.log(chalk.green(`\n📄 报告已保存: ${options.output}`));
        }
        
        // Generate CLAUDE.md suggestions
        if (options.claude || options.claudemd) {
          const evalStats = logger.getEvaluationStats(undefined, days);
          const claudeMd = generateClaudeSuggestions(stats, recentLogs, evalStats);
          
          if (options.claudemd) {
            fs.writeFileSync(options.claudemd, claudeMd, 'utf-8');
            console.log(chalk.green(`\n📄 CLAUDE.md 已保存: ${options.claudemd}`));
          } else {
            console.log(chalk.green('\n' + claudeMd));
          }
        }
      }
      
    } catch (error) {
      console.error(chalk.red(`\n❌ 错误: ${(error as Error).message}`));
      process.exit(1);
    }
  });

function generateReport(stats: any, _logs: any[], cmdCounts: Record<string, number>): string {
  const successRate = stats.totalCommands > 0 
    ? ((stats.successCount / stats.totalCommands) * 100).toFixed(1) 
    : '0';
  
  let report = `# Prompt Optimizer 分析报告
  
## 统计概览

- 总命令数: ${stats.totalCommands}
- 成功: ${stats.successCount}
- 失败: ${stats.errorCount}
- 成功率: ${successRate}%
- 平均耗时: ${stats.avgDuration}ms

## 命令分布

`;
  
  Object.entries(cmdCounts).forEach(([cmd, count]) => {
    report += `- ${cmd}: ${count}次\n`;
  });
  
  report += `\n## 建议

`;
  
  if (parseFloat(successRate) < 80) {
    report += '- 成功率较低，建议检查错误日志\n';
  }
  
  if (stats.avgDuration > 30000) {
    report += '- 平均耗时较长，考虑优化\n';
  }
  
  report += `\n生成时间: ${new Date().toISOString()}\n`;
  
  return report;
}

function generateClaudeSuggestions(stats: any, logs: any[], evalStats: any[]): string {
  const suggestions: string[] = [];
  const successRate = stats.totalCommands > 0 
    ? (stats.successCount / stats.totalCommands) * 100 
    : 0;
  
  // Performance-based suggestions
  if (successRate < 80) {
    suggestions.push('- 成功率较低，建议检查错误模式，增加错误处理');
  }
  
  if (stats.avgDuration > 30000) {
    suggestions.push('- 平均耗时较长，建议优化提示词或使用更快模型');
  }
  
  // Command-specific suggestions
  const cmdStats: Record<string, { success: number; total: number }> = {};
  logs.forEach((log: any) => {
    if (!cmdStats[log.command]) {
      cmdStats[log.command] = { success: 0, total: 0 };
    }
    cmdStats[log.command].total++;
    if (log.status === 'success') {
      cmdStats[log.command].success++;
    }
  });
  
  // Find worst performing command
  let worstCmd = '';
  let worstRate = 100;
  Object.entries(cmdStats).forEach(([cmd, data]) => {
    const rate = (data.success / data.total) * 100;
    if (rate < worstRate && data.total > 2) {
      worstRate = rate;
      worstCmd = cmd;
    }
  });
  
  if (worstCmd) {
    suggestions.push(`- ${worstCmd} 命令成功率最低 (${worstRate.toFixed(1)}%)，建议优化相关提示词`);
  }
  
  // Scene-specific suggestions
  if (evalStats.length > 0) {
    const lowScenes = evalStats.filter(s => s.avgScore < 70);
    if (lowScenes.length > 0) {
      suggestions.push(`- 以下场景评估分数较低: ${lowScenes.map(s => s.scene).join(', ')}，建议针对性优化提示词`);
    }
  }
  
  let claudeMd = `# 🤖 Prompt Optimizer 改进建议

> 基于历史数据分析自动生成
> 生成时间: ${new Date().toISOString()}

## 📊 整体表现

- 成功率: ${successRate.toFixed(1)}%
- 平均耗时: ${stats.avgDuration}ms
- 总命令数: ${stats.totalCommands}

## 💡 改进建议

${suggestions.length > 0 ? suggestions.map(s => s).join('\n') : '- 暂无明显问题，继续保持！'}

## 📈 趋势建议

`;
  
  // Add trend analysis
  const trends = calculateDailyTrends({ query: () => logs } as any, undefined, 7);
  if (trends.length >= 2) {
    const firstDay = trends[0];
    const lastDay = trends[trends.length - 1];
    const trend = lastDay.successRate - firstDay.successRate;
    
    if (trend > 10) {
      claudeMd += '- 趋势向好！成功率提升了 ' + trend.toFixed(1) + '%\n';
    } else if (trend < -10) {
      claudeMd += '- ⚠️ 趋势下滑！成功率下降了 ' + Math.abs(trend).toFixed(1) + '%\n';
    } else {
      claudeMd += '- 趋势稳定\n';
    }
  }
  
  claudeMd += `\n---\n*此文件由 po insight --claude 自动生成*\n`;
  
  return claudeMd;
}

function calculateDailyTrends(logger: any, command?: string, days: number = 7): DailyTrend[] {
  const logs = logger.query({ command, limit: 500 });
  
  // Group by date
  const byDate: Record<string, DailyTrend> = {};
  
  logs.forEach((log: any) => {
    const date = log.timestamp.split('T')[0];
    if (!byDate[date]) {
      byDate[date] = { date, total: 0, success: 0, error: 0, successRate: 0, avgDuration: 0 };
    }
    byDate[date].total++;
    if (log.status === 'success') {
      byDate[date].success++;
    } else {
      byDate[date].error++;
    }
    byDate[date].avgDuration += log.output?.duration || 0;
  });
  
  // Calculate rates and sort by date
  return Object.values(byDate)
    .map(t => ({
      ...t,
      successRate: t.total > 0 ? Math.round((t.success / t.total) * 100) : 0,
      avgDuration: t.total > 0 ? Math.round(t.avgDuration / t.total) : 0
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-days);
}

interface SceneStat {
  scene: string;
  count: number;
  avgScore: number;
}

function getEvaluationStats(logger: any, scene?: string, days: number = 7): SceneStat[] {
  const stats = logger.getEvaluationStats(scene, days) as Array<{ scene: string; count: number; avgScore: number }>;
  return stats.map((s: { scene: string; count: number; avgScore: number }) => ({
    scene: s.scene,
    count: s.count,
    avgScore: s.avgScore
  }));
}

export default insightCmd;
