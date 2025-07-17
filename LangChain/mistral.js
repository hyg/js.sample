import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatMistralAI } from "@langchain/mistralai";

const model = new ChatMistralAI({
  model: "mistral-large-latest",
  temperature: 0
});

/* const messages = [
  new SystemMessage("Translate the following from English into Chinese"),
  new HumanMessage("hi!"),
];

var ret = await model.invoke(messages);
console.log(ret);
 */

import { z } from "zod";

const fruit = z.object({
  name: z.string().describe("品种名称"),
  solid: z.number().describe("可溶性固态物（平均值）"),
  sugarrate: z.string().optional().describe("甜酸比例"),
  period: z.string().describe("成熟时间"),
  place: z.string().describe("优势产地"),
  rating: z.number().optional().describe("这种水果品种的总分,从1到10"),
});

const structuredLlm = model.withStructuredOutput(fruit);
var ret = await structuredLlm.invoke("推荐一种八月成熟的水果。");
console.log(ret);