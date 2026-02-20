/**
 * LLM Client - Multi-Model Support
 *
 * Supports: QWEN MAX, DeepSeek V3, 豆包 (future)
 * Pure functions with structured input/output
 */
// Model configurations
const MODELS = {
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
 * Get model configuration
 */
function getModelConfig(modelKey) {
    const config = MODELS[modelKey];
    if (!config) {
        throw new Error(`Unsupported model: ${modelKey}. Supported: ${Object.keys(MODELS).join(', ')}`);
    }
    return config;
}
/**
 * Call LLM API - Pure function
 */
async function callLLM(messages, model, options = {}) {
    const config = getModelConfig(model);
    const apiKey = process.env[config.apiKeyEnv];
    if (!apiKey) {
        throw new Error(`API Key not set: ${config.apiKeyEnv}`);
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min timeout
    try {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: config.modelName,
                messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 8192,
                ...(options.responseFormat && { response_format: options.responseFormat })
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorData}`);
        }
        const result = await response.json();
        if (result.choices && result.choices[0]) {
            return result.choices[0].message.content;
        }
        throw new Error('Invalid LLM response format');
    }
    catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}
/**
 * Generate summary from dialogue data
 */
export async function generate(input) {
    const { data, prompt, model = 'qwen-max' } = input;
    const messages = [
        { role: 'system', content: prompt },
        { role: 'user', content: data }
    ];
    const content = await callLLM(messages, model, {
        temperature: 0.7,
        maxTokens: 8192
    });
    return {
        content,
        model
    };
}
/**
 * Evaluate summary (LLM-as-a-Judge)
 */
export async function evaluate(input) {
    const { generated, reference, model = 'qwen-max' } = input;
    const evaluationPrompt = `
You are a professional prompt evaluator. Evaluate the following two summaries.

## Generated Summary
${generated}

## Reference Summary
${reference}

## Evaluation Dimensions
1. Completeness (0-100): Did it extract all important information?
2. Detail (0-100): Are details fully expanded?
3. Thoroughness (0-100): Are there any missing key points?
4. Word Count Diff (0-100): Is the word count difference reasonable?

## Output Format
Output in JSON:
{
  "completeness": number,
  "detail": number,
  "thoroughness": number,
  "word_count_diff": number,
  "total": number,
  "grade": "S|A|B|C|D",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": ["suggestion1", "suggestion2"]
}
`;
    const messages = [
        { role: 'system', content: 'You are a professional evaluator. Return only JSON.' },
        { role: 'user', content: evaluationPrompt }
    ];
    const content = await callLLM(messages, model, {
        temperature: 0.3,
        maxTokens: 4000,
        responseFormat: { type: 'json_object' }
    });
    const result = JSON.parse(content);
    return {
        total: result.total,
        grade: result.grade,
        completeness: result.completeness,
        detail: result.detail,
        thoroughness: result.thoroughness,
        word_count_diff: result.word_count_diff,
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        suggestions: result.suggestions || []
    };
}
/**
 * Optimize prompt based on evaluation
 */
export async function optimize(input) {
    const { prompt, evaluation, model = 'qwen-max' } = input;
    const optimizePromptText = `
You are a prompt optimization expert. Based on the evaluation results, provide improved prompt.

## Current Prompt
${prompt}

## Evaluation Results
- Total Score: ${evaluation.total}
- Grade: ${evaluation.grade}
- Weaknesses: ${evaluation.weaknesses.join(', ')}
- Suggestions: ${evaluation.suggestions.join(', ')}

Output the optimized prompt in Markdown format directly.
`;
    const messages = [
        { role: 'system', content: 'You are a prompt optimization expert.' },
        { role: 'user', content: optimizePromptText }
    ];
    const content = await callLLM(messages, model, {
        temperature: 0.7,
        maxTokens: 4000
    });
    return {
        content,
        model
    };
}
/**
 * Get supported models
 */
export function getSupportedModels() {
    return Object.keys(MODELS);
}
export { MODELS };
//# sourceMappingURL=llmClient.js.map