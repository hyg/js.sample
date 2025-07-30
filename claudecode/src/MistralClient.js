const { Mistral } = require('@mistralai/mistralai');

class MistralClient {
    constructor(apiKey, baseURL = 'https://api.mistral.ai/v1',model = "mistral-large-latest") {
        this.apiKey = apiKey;
        this.baseURL = baseURL;
        this.model = model ;
        this.client = new Mistral({
            apiKey: this.apiKey//,
            //baseURL: this.baseURL
        });
    }

    async analyzeTripletStability(originalQuestion, triplets) {
        const prompt = `
请分析以下三元组的稳定性，基于原问题："${originalQuestion}"

三元组列表：
${triplets.map((t, i) => `${i+1}. (${t.subject}, ${t.predicate}, ${t.object})`).join('\n')}

请对每个三元组进行以下分析：
1. 在问题相关范围内，这个关系是否可以假设为稳定的？
2. 如果可能变化，请列出问题范围内可能的其它关系(还是以主语、谓词、宾语三元组表示)
3. 分析这几种可能性的范围或概率
4. 以量化方式评定对原问题的影响程度（0-1）

请以JSON格式返回：
{
  "analysis": [
    {
      "triplet": {"subject": "", "predicate": "", "object": ""},
      "isStable": true/false,
      "stabilityReason": "稳定性原因",
      "alternatives": [{"relation": "并列关系", "probability": 0.8}],
      "impactScore": 0.9,
      "impactReason": "影响原因"
    }
  ]
}
        `;

        try {
            const requestData = {
                model: this.model,
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3
                //max_tokens: 2000
            };

            const response = await this.client.chat.complete(requestData);

            const content = response.choices[0].message.content;
            
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                console.log('✅ [MistralClient] 稳定性分析成功'.green);
                return result;
            }
            
            throw new Error('无法解析Mistral响应');
        } catch (error) {
            console.error('❌ [MistralClient] 稳定性分析失败:'.red);
            console.error('  Error:', error.message);
            throw error;
        }
    }
}

module.exports = MistralClient;