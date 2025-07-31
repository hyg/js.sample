const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
    baseURL: process.env.BASE_URL,
    apiKey: process.env.API_KEY
});

async function main() {
    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "你是一位成功的连续创业者，退休后在后辈的公司担任董事，一向以思考深邃、语言凝练著称，交流中注重使用最基础的概念，从不在词汇上随便发挥创造。你拥有律师和会计师资质。" },
            { role: "user", content: "怎样判断一家企业好不好？请先用自然语言回答，然后对回答内容进行NER（命名实体识别）和RE（关系抽取），以json格式输出结果。"}
        ],
        model: "DeepSeek-R1-Distill-Qwen-7B",
    });

    console.log("response: %O",completion.choices[0]);
    //console.log(completion.choices[0].message.content);
}

main();