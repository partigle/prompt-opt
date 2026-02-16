# prompt-opt

提示词优化平台 CLI 工具

## 安装

```bash
npm install
npm run build
```

## 配置

1. 复制配置文件
```bash
cp .env.example .env
```

2. 在 .env 中填入你的 API Keys

## 使用

```bash
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
```

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
