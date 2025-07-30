const readline = require('readline-sync');
const colors = require('colors');

class Step1Processor {
    constructor(openaiClient) {
        this.client = openaiClient;
    }

    async process() {
        console.log('\n📋 步骤1：用户输入和问题处理'.cyan);
        
        const systemPrompt = readline.question('请输入system提示词: '.yellow);
        const userQuestion = readline.question('请输入您的问题: '.yellow);

        //console.log('📝 [Step1Processor] 用户输入:'.blue);
        //console.log('  System Prompt:', systemPrompt);
        //console.log('  User Question:', userQuestion);

        return await this.processWithInput(userQuestion, systemPrompt);
    }

    async processWithInput(question, systemPrompt) {
        console.log('\n🔄 [Step1Processor] 开始调用KimiClient...'.gray);
        
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
        ];

        //console.log('📝 [Step1Processor] 构建的消息:'.blue);
        //console.log(JSON.stringify(messages, null, 2));

        try {
            const response = await this.client.chat(messages);
            
            const result = {
                systemPrompt,
                userQuestion: question,
                initialResponse: response,
                stepId: 'step-1-001'
            };

            console.log('✅ [Step1Processor] 步骤1完成'.green);
            console.log('  返回结果:', response);
            console.log('  返回结果长度:', response.length, '字符');
            
            return result;
        } catch (error) {
            console.error('❌ [Step1Processor] 步骤1处理失败:'.red, error.message);
            throw error;
        }
    }
}

module.exports = Step1Processor;