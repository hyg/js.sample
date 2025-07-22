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

/* const fruit = z.object({
  name: z.string().describe("品种名称"),
  solid: z.number().describe("可溶性固态物（平均值）"),
  sugarrate: z.string().optional().describe("甜酸比例"),
  period: z.string().describe("成熟时间"),
  place: z.string().describe("优势产地"),
  rating: z.number().optional().describe("这种水果品种的总分,从1到10"),
});

const structuredLlm = model.withStructuredOutput(fruit);
var ret = await structuredLlm.invoke("推荐一种八月成熟的水果。");
console.log(ret); */

const error = z.array(
  z.object({
  id: z.number().describe("编号"),
  content: z.string().describe("违反规则的原文"),
  reason: z.string().describe("违规了什么规则")
}).describe("违规情况")).describe("违规情况列表");

const structuredLlm = model.withStructuredOutput(error);

const messages = [
  new SystemMessage(`以下规则已经生效，请检查对话内容是否符合以下规则：
1、到场项目成员报名，由记录员确定出席人数；
[注：记录员验明身份，确定达到合同要求的有效人数，是会议有效力的前提。因此放在第一步骤]

2、按照上一次会议纪要确定会议主持人、记录员，或者选举主持人、记录员；
[注：如果首选的主持人、记录员因故未到场，可能使用后备人员，因此在这里才确定。]

3、主持人宣布会议开始，此后发言全部保存为会议原始材料；
[注：到这个时候主持人才“赴任”。]

4、主持人公布已收到的动议以及提出者；

5、各项目成员提出其它希望讨论的动议，不限发言次序，每条动议发一条；

6、主持人选择一个动议，宣布进入讨论；

7、记录员复述动议；
[注：有的动议可能分散在先后几次发言中，表述比较口语化，因此安排两人互动来确定最终文字。]

8、动议提出者确认复述则进入9、修改复述则回到7、，如果是记录员本人提出的动议，复述后直接进入9；

9、社员根据主持人点名发言。如主持人允许自由发言，项目成员不得在60秒内连续发言两条。
[注：网络交流没有声音互相压制的问题，因此约定不连续发言即可自由发言。或者其他人发言，或者等候60秒即可发出下一条发言。]

10、如果有项目成员发言涉及修改动议，主持人可以决定回到步骤7、。如果修改后的动议表决通过，则原始动议不再讨论和表决；如果修改后的动议未表决通过，则回到原始动议继续讨论、表决。

11、主持人在讨论成熟后，宣布进入当前动议的表决环节，每个项目成员可以发言表决一次；

12、记录员计票并公布结果；
[注：可能出现重复发言，意思不确切的发言，所以安排记录员把关。]

13、主持人可以决定回到步骤6，或者宣布本次会议讨论结束，进入下一步骤；

14、如果涉及多方合同等正式规章的修改，由管理员根据表决结果修改并公布在指定位置；
[注：应该包含非项目成员可以获取的公布方式。]

15、记录员整理并公布会议纪要，涉及多方合同等正式规章的修改，应记载修改前后版本的公布位置；

16、主持人宣布会议结束，步骤2至此发言全部保存为会议原始材料。
[注：所有表决均为记名表决，因此保留全部发言记录备查。]

对以上简略议事规则的改进可以作为动议提出。
主持人会贴出以上步骤原文，表明目前进入哪个步骤。主持人、记录员提示当前步骤，纠正违反议事规则的发言不受条数限制。 

附件31.1. 规章条款的上下级关系，根据制定、修订权定义。
附件31.2. 人员的上下级关系，根据任免权定义。
附件31.3. 严格执行制定、修订程序。上级规章条款未生效（或被实质架空）时，不提交、不讨论下级规章条款。
附件31.4. 严格执行任免程序。上级人员未赴任（或被实质架空）时，不提名、不讨论下级人员。

注释:
- 以“规章条款”为单位。比如某公司章程有一条：股东会三分之二表决权通过可以修订章程。这条本身就在章程里面，所以也能修订自己。（比如修改为：股东会四分之三表决权通过可以修订章程。）这个条款就比章程的其它条款都高一级。无论怎么组合编集，都不影响这种层级关系。
- 比如规章写明A任免B和C，即使在其它文件使用“B是C上级”、“C接受B的指令”这类措辞，本标准下BC平级、都是A下级。A缺席时B讨论C的人选即违规（如果B是章程中有的账号，会立刻被强制注销财产充公）。
- 无法判断时按最坏情况处理，比如因保密制度不能阅读就按未生效、未被执行看待。
- 上级规章制定过程可以讨论规章草案下的工作场景，包括制定下级规章的场景。只有特定上级规章导致特定下级规章草案不能产生，引入讨论才有意义。一旦离开上级规章制定程序的时间、地点、人员这些条件就不能提前讨论下级规章，因为这时上级规章（下级规章制定修订程序）还没有生效，不应该暗示自己的内定角色。`),
  new HumanMessage(`会议详细记录...`),
];

var ret = await structuredLlm.invoke(messages);
console.log(ret);
