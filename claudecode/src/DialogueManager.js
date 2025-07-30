const readline = require('readline-sync');
const colors = require('colors');
const OpenAIClient = require('./OpenAIClient');
const KimiClient = require('./KimiClient');
const DoubaoClient = require('./DoubaoClient');
const MistralClient = require('./MistralClient');
const Step1Processor = require('./Step1Processor');
const Step2Processor = require('./Step2Processor');
const Step3Processor = require('./Step3Processor');
const Step4Processor = require('./Step4Processor');
const RecursiveProcessor = require('./RecursiveProcessor');
const QuestionTree = require('./QuestionTree');
require('dotenv').config();

class DialogueManager {
    constructor() {
        this.openaiClient = null;
        this.doubaoClient = null;
        this.mistralClient = null;
        this.questionTree = new QuestionTree();
        this.recursiveProcessor = null;
        
        this.step1Processor = null;
        this.step2Processor = null;
        this.step3Processor = null;
        this.step4Processor = new Step4Processor();
    }

    async initializeClients() {
        console.log('\n🔑 配置API密钥...'.cyan);
        
        const step1baseurl = process.env.STEP1_BASE_URL || 'https://api.openai.com/v1';
        const step1apikey = process.env.STEP1_API_KEY;
        const step1model = process.env.STEP1_MODEL || 'gpt-3.5-turbo';

        const step2apikey = process.env.STEP2_API_KEY;
        const step2baseurl = process.env.STEP2_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
        const step2model = process.env.STEP2_MODEL || 'ep-20250730155509-rlzcx';

        const step3apikey = process.env.STEP3_API_KEY;
        const step3baseurl = process.env.STEP3_BASE_URL || 'https://api.mistral.ai/v1';
        const step3model = process.env.STEP3_MODEL || 'mistral-large-latest';

        if (!step1apikey || !step2apikey || !step3apikey) {
            console.log('\n⚠️  检测到缺少环境变量，使用交互式输入...'.yellow);
            
            const step1apikey = readline.question('请输入第一步API密钥: '.yellow, { hideEchoBack: true });
            const step2apikey = readline.question('请输入第二步API密钥: '.yellow, { hideEchoBack: true });
            const step3apikey = readline.question('请输入第三步API密钥: '.yellow, { hideEchoBack: true });

            this.kimiClient = new KimiClient(step1apikey, step1baseurl, step1model);
            this.doubaoClient = new DoubaoClient(step2apikey, step2baseurl, step2model);
            this.mistralClient = new MistralClient(step3apikey, step3baseurl, step3model);
        } else {
            this.kimiClient = new KimiClient(step1apikey, step1baseurl, step1model);
            this.doubaoClient = new DoubaoClient(step2apikey, step2baseurl, step2model);
            this.mistralClient = new MistralClient(step3apikey, step3baseurl, step3model);
        }

        this.step1Processor = new Step1Processor(this.kimiClient);
        this.step2Processor = new Step2Processor(this.doubaoClient);
        this.step3Processor = new Step3Processor(this.mistralClient);
        //this.step3Processor = new Step3Processor(this.doubaoClient);
        this.recursiveProcessor = new RecursiveProcessor(this);
    }

    async start() {
        try {
            await this.initializeClients();
            
            console.log('\n🚀 开始第一轮对话分析...'.green);
            
            const initialReport = await this.runSingleCycle();
            
            console.log('\n🔄 开始递归分析流程...'.yellow);
            await this.recursiveProcessor.process(initialReport);
            
            console.log('\n✅ 分析完成！'.green);
            this.questionTree.printCurrentTree();
            
            this.saveResults();
            
        } catch (error) {
            console.error('对话管理器错误:'.red, error.message);
        }
    }

    async runSingleCycle(question = null, systemPrompt = null, nodeId = null) {
        let step1Result;
        
        if (question && systemPrompt) {
            step1Result = await this.step1Processor.processWithInput(question, systemPrompt);
        } else {
            step1Result = await this.step1Processor.process();
        }

        const step2Result = await this.step2Processor.process(step1Result);
        const step3Result = await this.step3Processor.process(step2Result);
        const finalReport = await this.step4Processor.process(step3Result);

        if (!nodeId) {
            this.questionTree.createRoot(
                finalReport.originalQuestion,
                finalReport.systemPrompt
            );
        }

        return finalReport;
    }

    saveResults() {
        const fs = require('fs');
        const path = require('path');
        
        const output = {
            tree: this.questionTree.toJSON(),
            mermaid: this.questionTree.generateMermaid(),
            generatedAt: new Date().toISOString()
        };

        const filename = `analysis-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(output, null, 2));
        
        console.log(`\n💾 结果已保存到: ${filename}`.green);
    }
}

module.exports = DialogueManager;