import OpenAI from "openai";
import { createInterface } from 'readline/promises';
import {meeting} from '../prompt/stub.mjs';
import 'dotenv/config';
const openai = new OpenAI(
    {
        // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx",
        apiKey: process.env.API_KEY,
        baseURL: process.env.BASE_URL
    }
);

async function getResponse(messages) {
    try {
        const completion = await openai.chat.completions.create({
            // 模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
            //model: "qwen-max",
            model: "Moonshot-Kimi-K2-Instruct",
            messages: messages,
        });
        //console.log("completion:%O", completion);
        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Error fetching response:", error);
        throw error;  // 重新抛出异常以便上层处理
    }
}

// 初始化 messages 数组
const messages = [
    {
        "role": "system",
        "content": meeting
    }
];

let assistant_output = "欢迎参与xx项目筹备会议，请开始发言。";
console.log(assistant_output);

const readline = createInterface({
    input: process.stdin,
    output: process.stdout
});

(async () => {
    while (!assistant_output.includes("我已了解您的工作标准")) {
        const user_input = await readline.question("请输入：");
        messages.push({ role: "user", content: user_input });
        try {
            const response = await getResponse(messages);
            assistant_output = response;
            messages.push({ role: "assistant", content: assistant_output });
            console.log("筹备助理:", assistant_output);
            console.log("\n");
        } catch (error) {
            console.error("获取响应时发生错误:", error);
        }
    }
    readline.close();
    //console.log("最后回复:\n",response);
    console.log("完整记录:\n", messages);
})();
