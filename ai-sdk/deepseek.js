import { createDeepSeek } from '@ai-sdk/deepseek';
import { generateText } from 'ai';

//console.log("process.env.DEEPSEEK_API_KEY:",process.env.DEEPSEEK_API_KEY);
const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY ?? '',
});

try {
    const { text, reasoning } = await generateText({
        model: deepseek('deepseek-reasoner'),
        prompt: 'How many people will live in the world in 2040?',
    });

    console.log(reasoning);
    console.log(text);
} catch (err) {
    // 处理错误
    console.log("error:",err);
}
