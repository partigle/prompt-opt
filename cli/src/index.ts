/**
 * Prompt Optimizer CLI
 * 
 * Human-friendly CLI that calls Engine
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, existsSync } from 'fs';
import { detect, generate, evaluate, optimize, getAllScenes } from '../packages/engine/dist/index.js';
import { storage } from '../packages/storage/dist/index.js';

// =============================================================================
// Utils
// =============================================================================

function loadFile(path: string): string {
  if (!existsSync(path)) {
    throw new Error(`File not found: ${path}`);
  }
  return readFileSync(path, 'utf-8');
}

function ensureDir(path: string) {
  storage.ensureDir(path);
}

// =============================================================================
// Commands
// =============================================================================

// Scene detection
const detectCmd = new Command('detect')
  .description('Detect meeting scene from dialogue')
  .requiredOption('-d, --data <file>', 'Dialogue data file (TXT)')
  .option('-o, --output <file>', 'Output file')
  .action(async (options) => {
    console.log(chalk.blue('🔍 Detecting scene...\n'));
    
    const content = loadFile(options.data);
    const result = detect({ content });
    
    console.log(chalk.green('✅ Scene detected:'));
    console.log(chalk.cyan(`   Scene: ${result.scene}`));
    console.log(chalk.cyan(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`));
    console.log(chalk.gray(`   Keywords: ${result.keywords.join(', ')}`));
    
    if (options.output) {
      ensureDir('outputs');
      await storage.write(options.output, JSON.stringify(result, null, 2));
      console.log(chalk.gray(`\n📁 Saved to: ${options.output}`));
    }
  });

// Generate summary
const generateCmd = new Command('generate')
  .description('Generate summary from dialogue')
  .requiredOption('-d, --data <file>', 'Dialogue data file')
  .requiredOption('-p, --prompt <file>', 'Prompt template file')
  .option('-s, --scene <scene>', 'Scene type')
  .option('-o, --output <file>', 'Output file')
  .option('-m, --model <model>', 'Model (qwen-max|deepseek-v3)', 'qwen-max')
  .action(async (options) => {
    console.log(chalk.blue('📝 Generating summary...\n'));
    
    const data = loadFile(options.data);
    const prompt = loadFile(options.prompt);
    
    const result = await generate({ data, prompt, model: options.model });
    
    console.log(chalk.green('✅ Summary generated:'));
    console.log(chalk.gray(`   Model: ${result.model}`));
    
    if (options.output) {
      ensureDir('outputs');
      await storage.write(options.output, result.content);
      console.log(chalk.gray(`\n📁 Saved to: ${options.output}`));
    } else {
      console.log(chalk.cyan('\n--- Summary ---'));
      console.log(result.content);
    }
  });

// Evaluate summary
const evaluateCmd = new Command('evaluate')
  .description('Evaluate generated summary vs reference')
  .requiredOption('-g, --generated <file>', 'Generated summary file')
  .requiredOption('-r, --reference <file>', 'Reference summary file')
  .option('-o, --output <file>', 'Output JSON file')
  .option('-m, --model <model>', 'Model', 'qwen-max')
  .action(async (options) => {
    console.log(chalk.blue('📊 Evaluating...\n'));
    
    const generated = loadFile(options.generated);
    const reference = loadFile(options.reference);
    
    const result = await evaluate({ generated, reference, model: options.model });
    
    console.log(chalk.green('✅ Evaluation complete:'));
    console.log(chalk.cyan(`   Total: ${result.total}/100`));
    console.log(chalk.cyan(`   Grade: ${result.grade}`));
    console.log(chalk.gray(`   Completeness: ${result.completeness}`));
    console.log(chalk.gray(`   Detail: ${result.detail}`));
    console.log(chalk.gray(`   Thoroughness: ${result.thoroughness}`));
    
    if (result.strengths.length > 0) {
      console.log(chalk.green('\n💪 Strengths:'));
      result.strengths.forEach((s: string) => console.log(chalk.gray(`   • ${s}`)));
    }
    
    if (result.weaknesses.length > 0) {
      console.log(chalk.red('\n⚠️ Weaknesses:'));
      result.weaknesses.forEach((w: string) => console.log(chalk.gray(`   • ${w}`)));
    }
    
    if (options.output) {
      ensureDir('evaluations');
      await storage.writeJSON(options.output, result);
      console.log(chalk.gray(`\n📁 Saved to: ${options.output}`));
    }
  });

// Optimize prompt
const optimizeCmd = new Command('optimize')
  .description('Optimize prompt based on evaluation')
  .requiredOption('-p, --prompt <file>', 'Current prompt file')
  .requiredOption('-e, --evaluation <file>', 'Evaluation result file')
  .option('-o, --output <file>', 'Output prompt file')
  .option('-m, --model <model>', 'Model', 'qwen-max')
  .action(async (options) => {
    console.log(chalk.blue('✨ Optimizing prompt...\n'));
    
    const prompt = loadFile(options.prompt);
    const evaluation = await storage.readJSON(options.evaluation);
    
    const result = await optimize({ prompt, evaluation, model: options.model });
    
    console.log(chalk.green('✅ Prompt optimized!'));
    console.log(chalk.gray(`   Model: ${result.model}`));
    
    if (options.output) {
      ensureDir('prompts');
      await storage.write(options.output, result.content);
      console.log(chalk.gray(`\n📁 Saved to: ${options.output}`));
    } else {
      console.log(chalk.cyan('\n--- Optimized Prompt ---'));
      console.log(result.content);
    }
  });

// List scenes
const scenesCmd = new Command('scenes')
  .description('List all supported scenes')
  .action(() => {
    const scenes = getAllScenes();
    console.log(chalk.blue('📋 Supported Scenes:\n'));
    
    const categories: Record<string, string[]> = {};
    scenes.forEach(scene => {
      const [cat] = (scene as string).split('/');
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(scene);
    });
    
    Object.entries(categories).forEach(([cat, list]) => {
      console.log(chalk.cyan(`\n${cat}:`));
      list.forEach((s: string) => console.log(chalk.gray(`   ${s}`)));
    });
  });

// =============================================================================
// Main
// =============================================================================

const program = new Command();
program
  .name('po')
  .description('Prompt Optimizer - CLI Tool')
  .version('1.0.0');

program.addCommand(detectCmd);
program.addCommand(generateCmd);
program.addCommand(evaluateCmd);
program.addCommand(optimizeCmd);
program.addCommand(scenesCmd);

program.parse();
