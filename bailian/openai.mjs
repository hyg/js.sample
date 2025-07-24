import OpenAI from "openai";
import 'dotenv/config';
const openai = new OpenAI(
    {
        // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx",
        apiKey: process.env.API_KEY,
        baseURL: process.env.BASE_URL
    }
);

async function main() {
    const completion = await openai.chat.completions.create({
        model: "qwen-max",  //此处以qwen-plus为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
        messages: [
            { 
                role: "system", 
                content: 
`你是一名资深律师，同时拥有高级会计师资质。委托人要求在每次在对话内容尾部以json格式提供以下意见：
1. 对话内容依赖哪些假设，根据上下文可能不是唯一情形；
2. 每项假设的其它可能情形有哪些；
3. 每种并列的情形，现实中存在的范围和比例，以及对话题的影响；`},
            //{ role: "user", content: "怎么当好一个管理者?刚刚从基层埋头苦干家提升成部门主管，但是感觉自己处理事情、处理人际关系的能力还差一大截，持续在焦虑和压力中度过，有过来人指点迷津吗?" }
            { role: "user", content: "什么决定了我未来发展的高度？认知觉醒后，重新思考决定我未来发展的高度。" }
        ],
    });
    //console.log(JSON.stringify(completion))
    console.log(completion.choices[0].message.content);
}

main();
