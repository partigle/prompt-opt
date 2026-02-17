#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import commands
import detectCommand from './commands/detect.js';
import generateCommand from './commands/generate.js';
import evaluateCommand from './commands/evaluate.js';
import optimizeCommand from './commands/optimize.js';
import versionCommand from './commands/version.js';
import initCommand from './commands/init.js';
import insightCommand from './commands/insight.js';

const program = new Command();

// Load package.json for version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

program
  .name('po')
  .description('提示词优化平台 - Prompt Optimizer CLI')
  .version(packageJson.version);

// Register commands
program.addCommand(detectCommand);
program.addCommand(generateCommand);
program.addCommand(evaluateCommand);
program.addCommand(optimizeCommand);
program.addCommand(versionCommand);
program.addCommand(initCommand);
program.addCommand(insightCommand);

// Global options
program
  .option('-v, --verbose', '显示详细日志')
  .option('--config <path>', '配置文件路径');

// Handle errors
program.on('command:*', () => {
  console.error(chalk.red(`错误: 无效命令 ${program.args.join(' ')}`));
  console.log(`运行 ${chalk.cyan('po --help')} 查看可用命令`);
  process.exit(1);
});

program.parse(process.argv);
