const colors = require('colors');

class Step3Processor {
    constructor(mistralClient) {
        this.client = mistralClient;
    }

    async process(step2Result) {
        console.log('\n📋 步骤3：三元组稳定性分析'.cyan);
        console.log('🔄 [Step3Processor] 开始调用MistralClient...'.gray);
        
        const relations = step2Result.nerResult.relations;
        if (!relations || relations.length === 0) {
            console.log('⚠️  [Step3Processor] 没有可分析的三元组'.yellow);
            return step2Result;
        }

        //console.log('📝 [Step3Processor] 待分析的三元组:'.blue);
        //console.log('  数量:', relations.length);
        //console.log('  详情:', JSON.stringify(relations, null, 2));

        try {
            const analysisResult = await this.client.analyzeTripletStability(
                step2Result.userQuestion,
                relations
            );

            console.log('📊 [Step3Processor] 稳定性分析结果:'.green);
            console.log('  分析数量:', analysisResult.analysis?.length || 0);
            console.log('  详情:', JSON.stringify(analysisResult.analysis || [], null, 2));

            const result = {
                ...step2Result,
                stabilityAnalysis: {
                    analysis: analysisResult.analysis || [],
                    stepId: 'step-3-001'
                }
            };

            console.log('✅ [Step3Processor] 步骤3完成'.green);
            
            return result;
        } catch (error) {
            console.error('❌ [Step3Processor] 步骤3处理失败:'.red, error.message);
            throw error;
        }
    }
}

module.exports = Step3Processor;