const colors = require('colors');

class Step4Processor {
    async process(step3Result) {
        console.log('\n📋 步骤4：综合分析报告生成'.cyan);
        
        const report = {
            originalQuestion: step3Result.userQuestion,
            systemPrompt: step3Result.systemPrompt,
            initialResponse: step3Result.initialResponse,
            entities: step3Result.nerResult.entities,
            relations: step3Result.nerResult.relations,
            stabilityAnalysis: step3Result.stabilityAnalysis.analysis,
            reportId: `report-${Date.now()}`,
            stepId: 'step-4-001'
        };

        this.printReport(report);
        
        return report;
    }

    printReport(report) {
        console.log('\n' + '='.repeat(60).cyan);
        console.log('📊 综合分析报告'.cyan.bold);
        console.log('='.repeat(60).cyan);
        
        console.log(`\n📝 原始问题: ${report.originalQuestion}`.yellow);
        console.log(`🔧 系统提示: ${report.systemPrompt}`.gray);
        
        console.log(`\n🏷️  识别到的实体 (${report.entities?.length || 0}):`.green);
        report.entities?.forEach(entity => {
            console.log(`   • ${entity.text} (${entity.type})`);
        });

        console.log(`\n🔗 提取的关系 (${report.relations?.length || 0}):`.blue);
        report.relations?.forEach(relation => {
            console.log(`   • ${relation.subject} → ${relation.predicate} → ${relation.object}`);
        });

        console.log(`\n📈 稳定性分析 (${report.stabilityAnalysis?.length || 0}):`.magenta);
        report.stabilityAnalysis?.forEach(item => {
            const stableText = item.isStable ? '✅稳定' : '⚠️可变';
            console.log(`   ${stableText} ${item.triplet.subject}-${item.triplet.predicate}-${item.triplet.object}`);
            console.log(`   影响分数: ${item.impactScore}/1.0`);
            
            if (!item.isStable && item.alternatives?.length > 0) {
                console.log(`   替代关系: ${item.alternatives.map(alt => `${alt.relation}(${alt.probability})`).join(', ')}`);
            }
        });

        console.log('\n' + '='.repeat(60).cyan);
    }
}

module.exports = Step4Processor;