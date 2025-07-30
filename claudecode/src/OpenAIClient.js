const OpenAI = require('openai');

class OpenAIClient {
    constructor(apiKey, baseURL = 'https://api.openai.com/v1', model = 'gpt-3.5-turbo') {
        this.apiKey = apiKey;
        this.baseURL = baseURL;
        this.model = model;
        
        if (!this.apiKey) {
            throw new Error('API密钥不能为空');
        }
        
        this.client = new OpenAI({
            apiKey: this.apiKey,
            baseURL: this.baseURL
        });
    }

    async chat(messages, model = null) {
        console.log('\n🔍 [OpenAIClient] API调用开始'.cyan);

        try {
            const response = await this.client.chat.completions.create({
                model: model || this.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            });

            const result = response.choices[0].message.content;
            console.log('✅ [OpenAIClient] API调用成功'.green);
            
            return result;
        } catch (error) {
            console.error('❌ [OpenAIClient] API调用失败:'.red);
            console.error('  Error:', error.message);
            throw error;
        }
    }
}

module.exports = OpenAIClient;