/**
 * LLM 客户端 - Multi-Model Support
 * 
 * 支持: QWEN MAX, DeepSeek V3, 豆包 1.8 (后续)
 * 使用原生 fetch API
 */

interface ModelConfig {
  name: string;
  provider: string;
  apiKeyEnv: string;
  endpoint: string;
  modelName: string;
}

// 模型配置
const MODELS: Record<string, ModelConfig> = {
  'qwen-max': {
    name: 'QWEN MAX',
    provider: 'aliyun',
    apiKeyEnv: 'DASHSCOPE_API_KEY',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    modelName: 'qwen-max',
  },
  'deepseek-v3': {
    name: 'DeepSeek V3',
    provider: 'deepseek',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    modelName: 'deepseek-chat',
  },
  'doubao': {
    name: '豆包 1.8',
    provider: 'douyin',
    apiKeyEnv: 'DOUBAO_API_KEY',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    modelName: 'doubao-pro-32k',
  }
};

/**
 * 获取模型配置
 */
function getModelConfig(modelKey: string): ModelConfig {
  const config = MODELS[modelKey];
  if (!config) {
    throw new Error(`不支持的模型: ${modelKey}. 支持的模型: ${Object.keys(MODELS).join(', ')}`);
  }
  return config;
}

/**
 * 调用 LLM 生成内容
 */
export async function generateSummary(
  data: string, 
  prompt: string, 
  model: string = 'qwen-max'
): Promise<string> {
  const config = getModelConfig(model);
  const apiKey = process.env[config.apiKeyEnv];
  
  if (!apiKey) {
    throw new Error(`未设置 API Key: ${config.apiKeyEnv}`);
  }
  
  // 构建消息
  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: data }
  ];
  
  try {
    // 使用原生 fetch API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5分钟超时
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: messages,
        temperature: 0.7,
        max_tokens: 8192
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API 错误: ${response.status} - ${errorData}`);
    }
    
    const result: any = await response.json();
    
    if (result.choices && result.choices[0]) {
      return result.choices[0].message.content;
    }
    
    throw new Error('LLM 返回格式错误');
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('请求超时');
    }
    throw new Error(`调用失败: ${error.message}`);
  }
}

/**
 * 评估总结 (LLM-as-a-Judge)
 */
export async function evaluateSummary(
  generated: string, 
  reference: string, 
  model: string = 'qwen-max'
): Promise<{
  completeness: number;
  detail: number;
  thoroughness: number;
  word_count_diff: number;
  total: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}> {
  const evaluationPrompt = `
你是一个专业的提示词评估专家。请对比以下两篇总结，从四个维度进行评估。

## 生成总结
${generated}

## 参考总结
${reference}

## 评估维度
1. 信息完整度 (0-100): 是否提取了所有重要信息？
2. 详细程度 (0-100): 细节是否充分展开？
3. 细致程度 (0-100): 是否有遗漏的关键点？
4. 字数差异 (0-100): 与参考总结的字数差距是否合理？

## 输出格式
请以 JSON 格式输出：
{
  "completeness": 数字,
  "detail": 数字,
  "thoroughness": 数字,
  "word_count_diff": 数字,
  "total": 数字,
  "grade": "S|A|B|C|D",
  "strengths": ["优点1", "优点2"],
  "weaknesses": ["不足1", "不足2"],
  "suggestions": ["建议1", "建议2"]
}
`;

  const config = getModelConfig(model);
  const apiKey = process.env[config.apiKeyEnv];
  
  if (!apiKey) {
    throw new Error(`未设置 API Key: ${config.apiKeyEnv}`);
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: [
          { role: 'system', content: '你是一个专业的评估专家，只返回 JSON 格式结果。' },
          { role: 'user', content: evaluationPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API 错误: ${response.status} - ${errorData}`);
    }
    
    const result: any = await response.json();
    return JSON.parse(result.choices[0].message.content);
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('评估超时');
    }
    throw new Error(`评估失败: ${error.message}`);
  }
}

/**
 * 优化提示词
 */
export async function optimizePrompt(
  prompt: string, 
  evaluation: {
    total: number;
    grade: string;
    weaknesses: string[];
    suggestions: string[];
  }, 
  model: string = 'qwen-max'
): Promise<string> {
  const optimizePromptText = `
你是一个提示词优化专家。根据以下评估结果，请提供提示词改进建议。

## 当前提示词
${prompt}

## 评估结果
- 总分: ${evaluation.total}
- 等级: ${evaluation.grade}
- 不足: ${evaluation.weaknesses.join(', ')}
- 建议: ${evaluation.suggestions.join(', ')}

请提供优化后的提示词，直接输出 MD 格式的提示词内容。
`;

  return generateSummary('', optimizePromptText, model);
}

export { MODELS };
