# 📋 Plan: Prompt Optimizer 飞轮系统构建

## Context

用户想要给 prompt-opt 项目添加飞轮系统：
1. 日志持久化
2. 效果追踪
3. 模式识别
4. 自动建议
5. ~~定时任务~~ (用户已取消)

## Steps

### Phase 1: 日志系统 (Log System) - ✅ 已完成
- [x] 1.1 创建日志目录结构 ✅
- [x] 1.2 设计日志格式 ✅
- [x] 1.3 实现 Logger 类 ✅
- [x] 1.4 集成到 detect/generate/evaluate/optimize/insight ✅
- [x] 1.5 version 命令集成日志 ✅
- [x] 1.6 init 命令集成日志 ✅
- [x] 1.7 场景自动识别 (evaluate 自动检测场景) ✅

### Phase 2: 效果追踪 (Effect Tracking) - ✅ 已完成
- [x] 2.1 评估结果存储结构 ✅
- [x] 2.2 evaluate 保存评分到 JSON ✅
- [x] 2.3 趋势计算可视化 (`po insight --trend`) ✅
- [x] 2.4 成功率告警阈值 (`po insight --alert 70`) ✅

### Phase 3: 模式识别 (Pattern Recognition) - ✅ 已完成
- [x] 3.1 场景分类统计 (`po insight --scene`) ✅
- [x] 3.2 错误类型分析 (超时/格式/评估低) ✅
- [ ] 3.3 生成分析报告 `logs/analysis/report.md`

### Phase 4: 自动建议 (Auto Suggestions) - ✅ 已完成
- [x] 4.1 历史数据分析 ✅
- [x] 4.2 生成 CLAUDE.md 改进建议 (`po insight --claude`) ✅
- [x] 4.3 `po insight` 命令已实现 ✅

### Phase 5: ~~定时任务~~ (已取消)

### Phase 6: 测试与部署 - ✅ 已完成
- [x] 6.1 单元测试 (创建测试数据并验证) ✅
- [x] 6.2 模拟运行完整流程 ✅
- [x] 6.3 GitHub PR (已推送到 prompt-opt main 分支) ✅

## 场景列表 (共 26 个场景)

**产品类**：产品周会 | 需求评审会 | 产品发布会
**营销类**：营销周会 | 推广策划会 | 品牌策略会 | 合作洽谈会
**销售类**：销售会议 | 客户谈判 | 渠道会议
**战略管理类**：战略会议 | 管理层例会 | 复盘会
**人事类**：面试 | 绩效面谈 | 离职面谈 | 团队建设
**研发类**：技术评审会 | 排期会 | 故障分析会
**其他**：财务会议 | 法务合规

## Risks
- 日志文件过大 → 添加日志轮转
- 测试数据不足 → 先生成模拟数据

## Validation needed
Yes - 请确认计划后再开始
