import { createMistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';

//console.log("process.env.MISTRAL_API_KEY:",process.env.MISTRAL_API_KEY);
const mistral = createMistral({
  // custom settings
  apiKey: process.env.MISTRAL_API_KEY ?? '',
});

try {
    const { text } = await generateText({
    model: mistral('mistral-large-latest'),
    prompt: '中国近年有哪些新品种水果在八月份成熟，请按照糖分排序，列出各品种的名称、糖分、简介、成熟期、优势产地。',
  });
    //console.log(reasoning);
    console.log(text);
} catch (err) {
    // 处理错误
    console.log("error:",err);
}
