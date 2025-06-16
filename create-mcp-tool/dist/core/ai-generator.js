var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from 'axios';
export class AIGenerator {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.together.xyz/v1/chat/completions';
    }
    analyzeDescription(description) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const prompt = `Analyze this description of needed MCP tools and extract structured information.

Description: "${description}"

Please analyze and return a JSON object with:
1. toolCategories: Array of categories needed (choose from: "api", "file", "notification", "database", "auth")
2. suggestedIntegrations: Array of integrations (choose from: "github", "slack", "email", "aws-s3")
3. customTools: Array of specific tools with {name, description, category}

Think about what the user needs based on their description. Look for:
- API mentions (GitHub, Slack, REST APIs) → "api" category + specific integrations
- File operations (read, write, manage files) → "file" category
- Notifications (send messages, alerts) → "notification" category
- Database operations → "database" category
- Authentication needs → "auth" category

Return only valid JSON, no other text:`;
            try {
                const response = yield axios.post(this.baseURL, {
                    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful assistant that analyzes software requirements and returns structured JSON responses. Always return valid JSON only, no markdown or additional text.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 1000
                }, {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                const content = (_b = (_a = response.data.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                if (!content)
                    throw new Error('No content from Together AI');
                // Remove markdown and parse JSON
                let cleanContent = content.trim().replace(/```json\n?|```/g, '');
                const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
                const jsonString = jsonMatch ? jsonMatch[0] : cleanContent;
                const parsed = JSON.parse(jsonString);
                if (!parsed.toolCategories || !parsed.suggestedIntegrations || !parsed.customTools) {
                    throw new Error('Invalid response structure from Together AI');
                }
                return parsed;
            }
            catch (error) {
                console.error('AI analysis failed:', error);
                return this.createFallbackAnalysis(description);
            }
        });
    }
    createFallbackAnalysis(description) {
        const lowerDesc = description.toLowerCase();
        const toolCategories = [];
        const suggestedIntegrations = [];
        const customTools = [];
        const patterns = {
            api: ['github', 'api', 'http', 'rest', 'request', 'endpoint', 'webhook'],
            file: ['file', 'read', 'write', 'upload', 'download', 'storage', 'document'],
            notification: ['slack', 'notification', 'message', 'email', 'alert', 'notify', 'send'],
            database: ['database', 'db', 'sql', 'mongo', 'postgres', 'mysql', 'query'],
            auth: ['auth', 'login', 'token', 'oauth', 'authenticate', 'permission']
        };
        const integrationPatterns = {
            github: ['github', 'git', 'repository', 'repo', 'issue', 'pull request', 'pr'],
            slack: ['slack', 'channel', 'workspace', 'bot'],
            email: ['email', 'mail', 'smtp', 'sendgrid', 'mailgun'],
            'aws-s3': ['s3', 'aws', 'bucket', 'storage', 'cloud storage']
        };
        for (const [category, keywords] of Object.entries(patterns)) {
            if (keywords.some(keyword => lowerDesc.includes(keyword))) {
                toolCategories.push(category);
            }
        }
        for (const [integration, keywords] of Object.entries(integrationPatterns)) {
            if (keywords.some(keyword => lowerDesc.includes(keyword))) {
                suggestedIntegrations.push(integration);
            }
        }
        if (toolCategories.includes('api')) {
            customTools.push({
                name: 'apiRequestTool',
                description: 'Make HTTP API requests',
                category: 'api'
            });
        }
        if (suggestedIntegrations.includes('github')) {
            customTools.push({
                name: 'githubTool',
                description: 'GitHub API operations',
                category: 'api'
            });
        }
        if (suggestedIntegrations.includes('slack')) {
            customTools.push({
                name: 'slackTool',
                description: 'Send Slack notifications',
                category: 'notification'
            });
        }
        if (toolCategories.includes('file')) {
            customTools.push({
                name: 'fileOperationTool',
                description: 'File read/write operations',
                category: 'file'
            });
        }
        if (toolCategories.length === 0) {
            toolCategories.push('api');
            customTools.push({
                name: 'genericApiTool',
                description: 'Generic API operations based on your description',
                category: 'api'
            });
        }
        return {
            toolCategories: [...new Set(toolCategories)],
            suggestedIntegrations: [...new Set(suggestedIntegrations)],
            customTools
        };
    }
}
