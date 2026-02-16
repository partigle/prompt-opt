import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, existsSync } from 'fs';
import { listPromptVersions, savePromptVersion, downloadPromptVersion } from '../lib/storage.js';

const versionCmd = new Command('version')
  .description('提示词版本管理');

// 列出版本
versionCmd
  .command('list')
  .description('列出提示词版本')
  .argument('<scene>', '场景类型')
  .action((scene: string) => {
    try {
      const versions = listPromptVersions(scene);
      
      if (versions.length === 0) {
        console.log(chalk.yellow(`场景 ${scene} 没有版本记录`));
        return;
      }
      
      console.log(chalk.blue(`📋 ${scene} 版本历史:\n`));
      versions.forEach((v) => {
        const date = new Date(v.modified).toLocaleString('zh-CN');
        console.log(`  ${chalk.cyan(v.version)} - ${chalk.gray(date)}`);
      });
      
    } catch (error) {
      console.error(chalk.red(`错误: ${(error as Error).message}`));
    }
  });

// 保存版本
versionCmd
  .command('save')
  .description('保存提示词为新版本')
  .requiredOption('-p, --prompt <file>', '提示词文件 (MD)')
  .requiredOption('-s, --scene <scene>', '场景类型')
  .option('-m, --message <msg>', '版本说明')
  .action((options: { prompt: string; scene: string; message?: string }) => {
    try {
      if (!existsSync(options.prompt)) {
        throw new Error(`提示词文件不存在: ${options.prompt}`);
      }
      
      const content = readFileSync(options.prompt, 'utf-8');
      const result = savePromptVersion(options.scene, content, options.message || '');
      
      console.log(chalk.green(`✅ 版本已保存:`));
      console.log(`  场景: ${options.scene}`);
      console.log(`  版本: v${result.version}`);
      console.log(`  路径: ${result.filepath}`);
      
    } catch (error) {
      console.error(chalk.red(`错误: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// 下载版本
versionCmd
  .command('download')
  .description('下载指定版本的提示词')
  .requiredOption('-s, --scene <scene>', '场景类型')
  .requiredOption('-v, --version <version>', '版本号 (如 v1)')
  .requiredOption('-o, --output <file>', '输出文件路径')
  .action((options: { scene: string; version: string; output: string }) => {
    try {
      const outputPath = downloadPromptVersion(options.scene, options.version, options.output);
      console.log(chalk.green(`✅ 已下载: ${outputPath}`));
      
    } catch (error) {
      console.error(chalk.red(`错误: ${(error as Error).message}`));
      process.exit(1);
    }
  });

export default versionCmd;
