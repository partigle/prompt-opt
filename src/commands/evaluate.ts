import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, existsSync } from 'fs';
import { basename } from 'path';
import { evaluateSummary } from '../lib/llmClient.js';
import { saveEvaluation } from '../lib/storage.js';
import { getLogger } from '../logs/index.js';
import { detectScene } from '../lib/sceneDetector.js';

const evaluateCmd = new Command('evaluate')
  .description('对比评估生成总结与参考总结')
  .requiredOption('-g, --generated <file>', 'AI 生成的总结文件 (MD)')
  .requiredOption('-r, --reference <file>', '参考总结文件 (MD)')
  .option('-o, --output <file>', '评估结果输出文件 (JSON)')
  .option('-m, --model <model>', '评估使用的模型', 'qwen-max')
  .option('-s, --scene <scene>', '场景类型 (不指定则自动检测)')
  .option('-p, --prompt <file>', '使用的提示词文件（用于记录）')
  .action(async (options: {
    generated: string;
    reference: string;
    output?: string;
    model: string;
    scene?: string;
    prompt?: string;
  }) => {
    const logger = getLogger();
    logger.start('evaluate', [], options);
    
    console.log(chalk.blue('📊 评估对比中...\n'));
    
    let detectedScene = options.scene;
    
    // 自动检测场景
    if (!detectedScene) {
      console.log(chalk.gray('🔍 自动检测场景...'));
      try {
        const generatedContent = readFileSync(options.generated, 'utf-8');
        const result = await detectScene(generatedContent);
        detectedScene = result.scene;
        console.log(chalk.gray(`   检测到场景: ${detectedScene}`));
      } catch (e) {
        detectedScene = 'other';
        console.log(chalk.yellow(`   检测失败，使用默认场景: ${detectedScene}`));
      }
    }
    
    try {
      // 1. 读取生成总结
      if (!existsSync(options.generated)) {
        throw new Error(`生成总结文件不存在: ${options.generated}`);
      }
      const generatedContent = readFileSync(options.generated, 'utf-8');
      console.log(chalk.gray(`📄 已加载生成总结: ${basename(options.generated)}`));
      
      // 2. 读取参考总结
      if (!existsSync(options.reference)) {
        throw new Error(`参考总结文件不存在: ${options.reference}`);
      }
      const referenceContent = readFileSync(options.reference, 'utf-8');
      console.log(chalk.gray(`📄 已加载参考总结: ${basename(options.reference)}`));
      
      // 3. 调用 LLM 评估
      console.log(chalk.gray(`🤖 调用 ${options.model} 评估中...`));
      const result = await evaluateSummary(generatedContent, referenceContent, options.model);
      
      // 4. 显示结果
      console.log(chalk.green('\n✅ 评估结果:'));
      console.log(`  总分: ${chalk.cyan(result.total)} / 100`);
      console.log(`  等级: ${getGradeColor(result.grade)}${result.grade}`);
      console.log(chalk.gray('\n  维度得分:'));
      console.log(`    - 信息完整度: ${result.completeness}`);
      console.log(`    - 详细程度: ${result.detail}`);
      console.log(`    - 细致程度: ${result.thoroughness}`);
      console.log(`    - 字数差异: ${result.word_count_diff}`);
      
      if (result.strengths && result.strengths.length > 0) {
        console.log(chalk.gray('\n  优点:'));
        result.strengths.forEach(s => console.log(chalk.green(`    ✅ ${s}`)));
      }
      
      if (result.weaknesses && result.weaknesses.length > 0) {
        console.log(chalk.gray('\n  不足:'));
        result.weaknesses.forEach(w => console.log(chalk.yellow(`    ⚠️ ${w}`)));
      }
      
      if (result.suggestions && result.suggestions.length > 0) {
        console.log(chalk.gray('\n  改进建议:'));
        result.suggestions.forEach(s => console.log(chalk.blue(`    💡 ${s}`)));
      }
      
      // 5. 保存评估结果
      const outputPath = options.output || saveEvaluation(options.generated, options.reference, result);
      if (!options.output) {
        console.log(chalk.green(`\n💾 评估结果已保存: ${outputPath}`));
      }
      
      // Save to logger for tracking
      logger.saveEvaluation({
        promptId: basename(options.generated),
        scene: detectedScene,
        scores: {
          total: result.total,
          completeness: result.completeness,
          detail: result.detail,
          thoroughness: result.thoroughness
        },
        summary: result.grade,
        timestamp: new Date().toISOString()
      });
      
      logger.end(true, { outputPath, scores: result });
      
    } catch (error) {
      logger.end(false, null, (error as Error).message);
      console.error(chalk.red(`\n❌ 错误: ${(error as Error).message}`));
      process.exit(1);
    }
  });

function getGradeColor(grade: string): (str: string) => string {
  switch (grade) {
    case 'S': return chalk.green;
    case 'A': return chalk.green;
    case 'B': return chalk.cyan;
    case 'C': return chalk.yellow;
    case 'D': return chalk.red;
    default: return chalk.gray;
  }
}

export default evaluateCmd;
