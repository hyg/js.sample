const OpenAI = require('openai');

class KimiClient {
    constructor(apiKey, baseURL, model) {
        this.apiKey = apiKey;
        this.baseURL = baseURL;
        this.model = model;
        this.client = new OpenAI({
            apiKey: this.apiKey,
            baseURL: this.baseURL
        });
    }

    async chat(messages, model = this.model) {
        console.log('\n🔍 [KimiClient] API调用开始'.cyan);

        try {
            const requestData = {
                model: model || this.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            };
            
            const response = await this.client.chat.completions.create(requestData);
            
            const result = response.choices[0].message.content;
            console.log('✅ [KimiClient] API调用成功'.green);
            
            return result;
        } catch (error) {
            console.error('❌ [KimiClient] API调用失败:'.red);
            console.error('  Error:', error.message);
            throw error;
        }
    }
}

module.exports = KimiClient;
