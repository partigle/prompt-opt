import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { basename } from 'path';
import { optimizePrompt } from '../lib/llmClient.js';
import { savePromptVersion } from '../lib/storage.js';

const optimizeCmd = new Command('optimize')
  .description('优化提示词（基于评估结果）')
  .requiredOption('-p, --prompt <file>', '待优化的提示词文件 (MD)')
  .requiredOption('-e, --evaluation <file>', '评估结果文件 (JSON)')
  .option('-o, --output <file>', '优化建议输出文件')
  .option('-m, --model <model>', '优化使用的模型', 'qwen-max')
  .option('-s, --save', '直接保存为新版本（需指定场景）')
  .option('--scene <scene>', '场景类型（与 --save 配合使用）')
  .action(async (options: {
    prompt: string;
    evaluation: string;
    output?: string;
    model: string;
    save: boolean;
    scene?: string;
  }) => {
    console.log(chalk.blue('✨ 提示词优化中...\n'));
    
    try {
      // 1. 读取提示词
      if (!existsSync(options.prompt)) {
        throw new Error(`提示词文件不存在: ${options.prompt}`);
      }
      const promptContent = readFileSync(options.prompt, 'utf-8');
      console.log(chalk.gray(`📄 已加载提示词: ${basename(options.prompt)}`));
      
      // 2. 读取评估结果
      if (!existsSync(options.evaluation)) {
        throw new Error(`评估结果文件不存在: ${options.evaluation}`);
      }
      const evaluation = JSON.parse(readFileSync(options.evaluation, 'utf-8'));
      console.log(chalk.gray(`📄 已加载评估结果: 等级 ${evaluation.grade}, 总分 ${evaluation.total}`));
      
      // 3. 调用 LLM 优化
      console.log(chalk.gray(`🤖 调用 ${options.model} 优化中...`));
      const optimizedPrompt = await optimizePrompt(promptContent, evaluation, options.model);
      
      // 4. 输出结果
      if (options.save) {
        if (!options.scene) {
          throw new Error('保存版本需要指定 --scene');
        }
        const result = savePromptVersion(options.scene, optimizedPrompt, `基于评估结果自动优化`);
        console.log(chalk.green(`\n✅ 新版本已保存:`));
        console.log(`  场景: ${options.scene}`);
        console.log(`  版本: v${result.version}`);
        console.log(`  路径: ${result.filepath}`);
      } else if (options.output) {
        writeFileSync(options.output, optimizedPrompt, 'utf-8');
        console.log(chalk.green(`\n✅ 优化建议已保存: ${options.output}`));
      } else {
        console.log(chalk.green('\n📝 优化后的提示词:\n'));
        console.log(optimizedPrompt);
        console.log(chalk.gray('\n使用 -o <file> 保存到文件，或使用 --save --scene <scene> 保存为新版本'));
      }
      
    } catch (error) {
      console.error(chalk.red(`\n❌ 错误: ${(error as Error).message}`));
      process.exit(1);
    }
  });

export default optimizeCmd;
