import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { initDirs, DIRS } from '../lib/storage.js';

const initCmd = new Command('init')
  .description('初始化项目结构')
  .argument('[name]', '项目名称')
  .option('-f, --force', '强制初始化（覆盖现有文件）')
  .action((name: string | undefined, options: { force: boolean }) => {
    console.log(chalk.blue('🚀 初始化提示词优化平台...\n'));
    
    // 项目名称
    const projectName = name || 'prompt-optimizer';
    
    // 初始化目录
    console.log(chalk.gray('📁 创建目录结构...'));
    initDirs();
    
    // 创建配置文件
    console.log(chalk.gray('⚙️ 创建配置文件...'));
    
    const configContent = `# 提示词优化平台配置
# API Keys (请在 .env 文件中设置)

# 阿里云 DashScope (QWEN)
# DASHSCOPE_API_KEY=your_key_here

# DeepSeek
# DEEPSEEK_API_KEY=your_key_here

# 豆包 (后续支持)
# DOUBAO_API_KEY=your_key_here

# 默认模型
default_model: qwen-max

# 支持的场景
scenes:
  - product/weekly
  - product/review
  - product/launch
  - marketing/weekly
  - marketing/campaign
  - marketing/brand
  - marketing/partnership
  - sales/meeting
  - sales/negotiation
  - sales/channel
  - strategy/meeting
  - strategy/management
  - strategy/review
  - hr/interview
  - hr/performance
  - hr/exit
  - hr/team
  - rd/tech-review
  - rd/planning
  - rd/incident
  - other/finance
  - other/legal
`;

    const configPath = join(DIRS.prompts, '../po.config.yaml');
    if (!existsSync(configPath) || options.force) {
      writeFileSync(configPath, configContent, 'utf-8');
      console.log(chalk.gray(`   创建: po.config.yaml`));
    }
    
    // 创建 .env.example
    const envExample = `# 提示词优化平台 - API Keys 配置
# 复制此文件为 .env 并填入你的 API Keys

# 阿里云 DashScope (QWEN MAX)
DASHSCOPE_API_KEY=

# DeepSeek
DEEPSEEK_API_KEY=

# 豆包 (后续支持)
DOUBAO_API_KEY=
`;

    const envPath = join(DIRS.prompts, '../.env.example');
    if (!existsSync(envPath)) {
      writeFileSync(envPath, envExample, 'utf-8');
      console.log(chalk.gray(`   创建: .env.example`));
    }
    
    // 创建 README
    const readmeContent = `# ${projectName}

提示词优化平台 CLI 工具

## 安装

\`\`\`bash
npm install
npm run build
\`\`\`

## 配置

1. 复制配置文件
\`\`\`bash
cp .env.example .env
\`\`\`

2. 在 .env 中填入你的 API Keys

## 使用

\`\`\`bash
# 检测场景
po detect 对话数据.txt

# 生成总结
po generate -d 对话.txt -p 提示词.md -s product/weekly

# 评估总结
po evaluate -g 生成.md -r 参考.md

# 优化提示词
po optimize -p 提示词.md -e 评估结果.json -o 优化后.md

# 版本管理
po version list product/weekly
po version save -p 提示词.md -s product/weekly -m "添加xxx"
\`\`\`

## 支持的场景

- 产品类: product/weekly, product/review, product/launch
- 营销类: marketing/weekly, marketing/campaign, marketing/brand, marketing/partnership
- 销售类: sales/meeting, sales/negotiation, sales/channel
- 战略管理: strategy/meeting, strategy/management, strategy/review
- 人事类: hr/interview, hr/performance, hr/exit, hr/team
- 研发类: rd/tech-review, rd/planning, rd/incident
- 其他: other/finance, other/legal

## 支持的模型

- QWEN MAX (默认)
- DeepSeek V3
- 豆包 1.8 (后续)
`;

    const readmePath = join(DIRS.prompts, '../README.md');
    if (!existsSync(readmePath) || options.force) {
      writeFileSync(readmePath, readmeContent, 'utf-8');
      console.log(chalk.gray(`   创建: README.md`));
    }
    
    console.log(chalk.green('\n✅ 初始化完成!'));
    console.log(chalk.gray('\n下一步:'));
    console.log('  1. cp .env.example .env');
    console.log('  2. 在 .env 中填入 API Keys');
    console.log('  3. npm run build 编译 TS');
    console.log('  4. po --help 查看命令');
    
  });

export default initCmd;
