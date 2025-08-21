## my claude code 

- 简化prompt
- 兼容openAI的Assistant API（ /v1/chat/completions ）
- 未来考虑兼容Agent API（ /v1/responses ）

### my prompt

- 日志分析工具：https://yuyz0112.github.io/claude-code-reverse/visualize.html
- 沿用prompt名称。
- import {prompt} from "./prompts.js";


#### system workflow prompt

- l01()
    - getSystemWorkflowPrompt(): 主体部分
    - getCodeReferencesPrompt(): Code References部分

#### check-new-topic prompt

- E$B()
    - CheckNewTopicPrompt

#### system reminder start prompt

- lF1()
    - getSystemReminderStartPrompt()

#### system reminder end prompt

- OD8()
    - case "todo": getSystemReminderEndPrompt()

#### compact prompt

- uMB(A)
    - CompactPrompt1;
    - getCompactPrompt2(A);

#### Task Tool

- $hB()
    - getTaskToolPrompt()

