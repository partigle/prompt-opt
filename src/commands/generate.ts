import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { basename } from 'path';
import { generateSummary } from '../lib/llmClient.js';
import { detectScene } from '../lib/sceneDetector.js';
import { saveOutput } from '../lib/storage.js';
import { getLogger } from '../logs/index.js';

const generateCmd = new Command('generate')
  .description('使用提示词生成总结')
  .requiredOption('-d, --data <file>', '对话数据文件路径 (TXT)')
  .requiredOption('-p, --prompt <file>', '提示词文件路径 (MD)')
  .option('-s, --scene <scene>', '场景类型 (如 product/weekly)')
  .option('-o, --output <file>', '输出文件路径')
  .option('-m, --model <model>', '使用的模型 (qwen-max|deepseek-v3|doubao)', 'qwen-max')
  .action(async (options: {
    data: string;
    prompt: string;
    scene?: string;
    output?: string;
    model: string;
  }) => {
    const logger = getLogger();
    logger.start('generate', [], options);
    
    console.log(chalk.blue('📝 生成总结中...\n'));
    
    try {
      // 1. 读取对话数据
      if (!existsSync(options.data)) {
        throw new Error(`对话数据文件不存在: ${options.data}`);
      }
      const dataContent = readFileSync(options.data, 'utf-8');
      console.log(chalk.gray(`📄 已加载对话数据: ${basename(options.data)}`));
      
      // 2. 读取提示词
      if (!existsSync(options.prompt)) {
        throw new Error(`提示词文件不存在: ${options.prompt}`);
      }
      const promptContent = readFileSync(options.prompt, 'utf-8');
      console.log(chalk.gray(`📄 已加载提示词: ${basename(options.prompt)}`));
      
      // 3. 确定场景
      let scene = options.scene;
      if (!scene) {
        console.log(chalk.gray('🔍 自动检测场景...'));
        const detection = await detectScene(dataContent);
        scene = detection.scene;
        console.log(chalk.gray(`   检测到场景: ${scene}`));
      }
      
      // 4. 调用 LLM 生成总结
      console.log(chalk.gray(`🤖 调用模型: ${options.model}...`));
      const summary = await generateSummary(dataContent, promptContent, options.model);
      
      // 5. 保存结果
      const outputPath = options.output || saveOutput(scene!, summary);
      writeFileSync(outputPath, summary, 'utf-8');
      
      console.log(chalk.green(`\n✅ 总结已生成:`));
      console.log(chalk.cyan(`   ${outputPath}`));
      
      logger.end(true, { outputPath, scene, model: options.model });
      
    } catch (error) {
      logger.end(false, null, (error as Error).message);
      console.error(chalk.red(`\n❌ 错误: ${(error as Error).message}`));
      process.exit(1);
    }
  });

export default generateCmd;
