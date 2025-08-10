https://kai.nl.tab.digital/s/2SN5qnMKa2w3sMD

## check: [零散笔记]

### 本地部署

- https://docs.vllm.com.cn/en/latest/index.html
- https://vllm.hyper.ai/docs/getting-started/quickstart/
- https://docs.sglang.com.cn/
- https://xinference.cn/
- 个人用还是ollama方便，需要工业大规模部署就用vllm和sglang、xinference。vLLM高并发，sglang高吞吐量、xinference更大规模部署。ollama适应低配置硬件。

### reranker

- 对初次匹配的向量进行精确分析，重新排序。计算开销大，所以不能一开头就用。

### 快速部署

- https://edgeone.ai
	- 价格不贵，静态的企业官网也可以放过去。https://edgeone.ai/zh/pricing
	- 有MCP，支持AI IDE直接上传。