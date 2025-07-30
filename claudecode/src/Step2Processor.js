const colors = require('colors');

class Step2Processor {
    constructor(doubaoClient) {
        this.client = doubaoClient;
    }

    async process(step1Result) {
        console.log('\n📋 步骤2：NER和关系抽取'.cyan);
        console.log('🔄 [Step2Processor] 开始调用DoubaoClient...'.gray);
        
        //console.log('📝 [Step2Processor] 步骤1结果:'.blue);
        //console.log('  原始响应长度:', step1Result.initialResponse.length, '字符');
        //console.log('  预览:', step1Result.initialResponse.substring(0, 200) + '...');

        try {
            const nerResult = await this.client.extractEntitiesAndRelations(
                step1Result.initialResponse
            );

            console.log('📊 [Step2Processor] NER/RE结果:'.green);
            console.log('  实体数量:', nerResult.entities?.length || 0);
            console.log('  关系数量:', nerResult.relations?.length || 0);
            console.log('  实体详情:', JSON.stringify(nerResult.entities || [], null, 2));
            console.log('  关系详情:', JSON.stringify(nerResult.relations || [], null, 2));

            const result = {
                ...step1Result,
                nerResult: {
                    entities: nerResult.entities || [],
                    relations: nerResult.relations || [],
                    stepId: 'step-2-001'
                }
            };

            console.log('✅ [Step2Processor] 步骤2完成'.green);
            
            return result;
        } catch (error) {
            console.error('❌ [Step2Processor] 步骤2处理失败:'.red, error.message);
            throw error;
        }
    }
}

module.exports = Step2Processor;