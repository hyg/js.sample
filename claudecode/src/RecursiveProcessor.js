const readline = require('readline-sync');
const colors = require('colors');

class RecursiveProcessor {
    constructor(dialogueManager) {
        this.manager = dialogueManager;
        this.questionTree = dialogueManager.questionTree;
    }

    async process(currentReport, parentNode = null) {
        const unstableItems = currentReport.stabilityAnalysis?.filter(
            item => !item.isStable && item.impactScore > 0.3
        ) || [];

        if (unstableItems.length === 0) {
            console.log('\n✅ 所有关系都已稳定，无需进一步分析'.green);
            return;
        }

        console.log(`\n🔍 发现 ${unstableItems.length} 个高影响不稳定关系，按影响程度排序:`.yellow);
        
        unstableItems.sort((a, b) => b.impactScore - a.impactScore);

        for (const item of unstableItems) {
            await this.processUnstableItem(item, currentReport, parentNode);
        }
    }

    async processUnstableItem(item, currentReport, parentNode) {
        console.log(`\n📊 处理三元组: ${item.triplet.subject}-${item.triplet.predicate}-${item.triplet.object}`.cyan);
        console.log(`   影响分数: ${item.impactScore}/1.0`.yellow);
        
        if (item.alternatives?.length > 0) {
            console.log(`   可能的替代关系:`.gray);
            item.alternatives.forEach(alt => {
                console.log(`     • ${alt.relation} (概率: ${alt.probability})`);
            });
        }

        const choices = item.alternatives?.map(alt => alt.relation) || [];
        choices.push('继续深入当前关系');
        choices.push('跳过');

        const selected = readline.keyInSelect(
            choices,
            `是否深入探讨这个三元组关系?`.cyan
        );

        if (selected === -1 || choices[selected] === '跳过') {
            console.log('跳过此关系'.gray);
            return;
        }

        const selectedRelation = choices[selected];
        const newQuestion = this.generateNewQuestion(
            currentReport.originalQuestion,
            item.triplet,
            selectedRelation
        );

        const newNode = this.questionTree.addChild(
            parentNode || this.questionTree.root,
            newQuestion,
            currentReport.systemPrompt,
            {
                originalTriplet: item.triplet,
                selectedRelation,
                impactScore: item.impactScore
            }
        );

        console.log(`\n🔄 开始递归分析新问题: ${newQuestion}`.green);
        
        const newReport = await this.manager.runSingleCycle(
            newQuestion,
            currentReport.systemPrompt,
            newNode.id
        );

        await this.process(newReport, newNode);
    }

    generateNewQuestion(originalQuestion, triplet, selectedRelation) {
        return `在问题"${originalQuestion}"的上下文中，关于"${triplet.subject} ${triplet.predicate} ${triplet.object}"的关系，如果考虑"${selectedRelation}"的可能性，会如何影响整体结论？`;
    }

    printCurrentTree() {
        this.questionTree.printTree();
    }
}

module.exports = RecursiveProcessor;