/**
 * Scene Detector - Pure Function
 * 
 * Based on keyword matching to automatically detect meeting scenes
 */

import type { DetectInput, DetectOutput } from './types.js';

// Scene keyword mapping
const SCENE_KEYWORDS: Record<string, string[]> = {
  // Product
  'product/weekly': ['产品周会', '上周', '本周', '需求', '排期', '上线', '迭代', 'sprint', 'feature', 'roadmap'],
  'product/review': ['需求评审', 'PRD', '评审', 'Story', '用户故事', '验收标准', '优先级'],
  'product/launch': ['产品发布', '发布会', '新功能', '亮点', '演示', 'release', 'launch'],
  
  // Marketing
  'marketing/weekly': ['营销周会', '投放', '转化', '曝光', '活动', 'GMV', '业绩'],
  'marketing/campaign': ['策划', '方案', '创意', '目标人群', '营销活动', 'campaign'],
  'marketing/brand': ['品牌', '定位', '差异化', '价值观', '品牌策略', 'brand'],
  'marketing/partnership': ['合作', '洽谈', '伙伴', '渠道', 'partnership'],
  
  // Sales
  'sales/meeting': ['销售会议', '业绩', '目标', '客户', '签约', '跟进'],
  'sales/negotiation': ['谈判', '报价', '合同', '让步', '签约', '价格'],
  'sales/channel': ['渠道', '经销商', '代理', '分销', 'channel'],
  
  // Strategy
  'strategy/meeting': ['战略', '三年规划', '愿景', '竞争', '格局', 'strategy'],
  'strategy/management': ['管理层', '例会', '经营', 'CEO', '总裁', '高管'],
  'strategy/review': ['复盘', '总结', '经验', '教训', '回顾', 'review'],
  
  // HR
  'hr/interview': ['面试', '自我介绍', '项目经历', '离职', '优势', '面试官', '薪资', '到岗', '薪酬', '工资', '期望', '岗位', '入职', 'offer', '录用', '招聘', '求职者', '工作经验', '技能特长', '职业规划', '待遇', '薪水', '奖金', '福利', '级别', '应聘', '职位', '复试', '终面', '笔试', '初试', '人力', '沟通', '加班', '双休', '十三薪', '股票', '期权'],
  'hr/performance': ['绩效', '考核', 'KPI', '面谈', '评分'],
  'hr/exit': ['离职', '辞职', '退出', '面谈', '交接'],
  'hr/team': ['团建', '团队建设', '活动', '聚餐', 'team building'],
  
  // R&D
  'rd/tech-review': ['技术评审', '架构', '技术方案', '可行性', '风险', 'review'],
  'rd/planning': ['排期', '计划', '工期', '里程碑', '排期会'],
  'rd/incident': ['故障', '问题', 'incident', 'bug', '紧急', 'P0', 'P1'],
  
  // Other
  'other/finance': ['财务', '预算', '成本', '利润', '营收', 'finance'],
  'other/legal': ['法务', '合规', '合同', '法律', 'legal', 'compliance'],
};

/**
 * Detect scene from content
 * Pure function - no side effects
 */
export function detect(input: DetectInput): DetectOutput {
  const { content } = input;
  
  // 1. Keyword matching
  const scores: Record<string, number> = {};
  const foundKeywords: Record<string, string[]> = {};
  
  for (const [scene, keywords] of Object.entries(SCENE_KEYWORDS)) {
    scores[scene] = 0;
    foundKeywords[scene] = [];
    
    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        scores[scene] += 1;
        foundKeywords[scene].push(keyword);
      }
    }
  }
  
  // 2. Find highest scoring scene
  let maxScore = 0;
  let bestScene = 'other/finance';
  let bestKeywords: string[] = [];
  
  for (const [scene, score] of Object.entries(scores)) {
    if (score >= maxScore) {
      maxScore = score;
      bestScene = scene;
      bestKeywords = foundKeywords[scene];
    }
  }
  
  // 3. Calculate confidence
  const confidence = maxScore > 0 ? Math.min(maxScore / 3, 1) : 0.3;
  
  // 4. Fallback if confidence too low
  if (confidence < 0.3) {
    bestScene = 'product/weekly';
    bestKeywords = ['会议'];
  }
  
  return {
    scene: bestScene,
    confidence,
    keywords: bestKeywords.slice(0, 5),
    allScores: scores
  };
}

/**
 * Get all supported scenes
 */
export function getAllScenes(): string[] {
  return Object.keys(SCENE_KEYWORDS);
}

export { SCENE_KEYWORDS };
