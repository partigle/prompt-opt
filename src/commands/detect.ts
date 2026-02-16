import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { detectScene } from '../lib/sceneDetector.js';

const detectCmd = new Command('detect')
  .description('检测对话场景类型')
  .argument('<file>', '对话数据文件路径 (TXT)')
  .option('-o, --output <file>', '输出结果到文件 (JSON)')
  .action(async (file: string, options: { output?: string }) => {
    console.log(chalk.blue('🔍 场景检测中...\n'));
    
    try {
      // Check file exists
      if (!existsSync(file)) {
        throw new Error(`文件不存在: ${file}`);
      }
      
      // Read file
      const content = readFileSync(file, 'utf-8');
      
      // Detect scene
      const result = await detectScene(content);
      
      // Output result
      console.log(chalk.green('✅ 检测结果:'));
      console.log(`  场景: ${chalk.cyan(result.scene)}`);
      console.log(`  置信度: ${chalk.yellow((result.confidence * 100).toFixed(1) + '%')}`);
      console.log(`  关键词: ${result.keywords.join(', ')}`);
      
      // Save to file if specified
      if (options.output) {
        writeFileSync(options.output, JSON.stringify(result, null, 2), 'utf-8');
        console.log(chalk.green(`\n✅ 结果已保存到: ${options.output}`));
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ 错误: ${(error as Error).message}`));
      process.exit(1);
    }
  });

export default detectCmd;
