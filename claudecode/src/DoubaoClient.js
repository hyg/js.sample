const OpenAI = require('openai');

class DoubaoClient {
    constructor(apiKey, baseURL = 'https://ark.cn-beijing.volces.com/api/v3',model = 'ep-20250730155509-rlzcx') {
        this.apiKey = apiKey;
        this.baseURL = baseURL;
        this.model = model;
        this.client = new OpenAI({
            apiKey: this.apiKey,
            baseURL: this.baseURL
        });
    }

    async extractEntitiesAndRelations(text) {
        console.log('\n🔍 [DoubaoClient] NER/RE调用开始'.cyan);

        const prompt = `
请对以下文本进行命名实体识别(NER)和关系抽取(RE)。

文本内容：
${text}

请以JSON格式返回结果，格式如下：
{
  "entities": [
    {
      "text": "实体文本",
      "type": "实体类型",
      "start": 起始位置,
      "end": 结束位置
    }
  ],
  "relations": [
    {
      "subject": "主语实体",
      "predicate": "关系谓词",
      "object": "宾语实体",
      "confidence": 置信度(0-1)
    }
  ]
}

注意：
1. 实体类型包括：人物、组织、地点、时间、事件、概念等
2. 关系类型包括：所属、位于、参与、导致、包含等
3. 确保JSON格式正确且完整
        `;

        try {
            const requestData = {
                model: this.model,
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                disable_explanation: true, 
                "return_reasoning": false,  // 尝试这个替代参数
                "only_answer": true,  // 如果API支持，只返回答案
                max_tokens: 32000
            };

            const response = await this.client.chat.completions.create(requestData);

            const content = response.choices[0].message.content;
            
            // 提取JSON部分
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                console.log('✅ [DoubaoClient] NER/RE调用成功'.green);
                return result;
            }
            
            throw new Error('无法解析JSON响应');
        } catch (error) {
            console.error('❌ [DoubaoClient] NER/RE调用失败:'.red);
            console.error('  Error:', error.message);
            throw error;
        }
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

          const response = await this.client.chat.completions.create(requestData);

          const content = response.choices[0].message.content;
          
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
              const result = JSON.parse(jsonMatch[0]);
              console.log('✅ [DoubaoClient] 稳定性分析成功'.green);
              return result;
          }
          
          throw new Error('无法解析响应');
      } catch (error) {
          console.error('❌ [DoubaoClient] 稳定性分析失败:'.red);
          console.error('  Error:', error.message);
          throw error;
      }
  }
}

module.exports = DoubaoClient;