# 任务管理工具

本项目旨在分析 `2025S3.yaml` 文件中的任务，并提供一组工具来管理这些任务。

## 目录结构

- `data/`: 包含根据 `2025S3.yaml` 中的 `todo` 字段为每个任务生成的独立YAML文件。此步骤已成功完成。
- `cli.js`: 命令行界面工具，用于显示任务的树形结构图和甘特图。
- `package.json`: 项目配置文件，包含依赖项和脚本。
- `tasks.json`: 从 `2025S3.yaml` 解析出的原始任务数据。
- `tasks_adjusted.json`: 根据对话内容调整后的任务数据，这是本项目的核心输出之一。
- `task_tree.txt`: 任务的树形结构表示。
- `task_tree_adjusted.txt`: 调整后任务的树形结构表示。
- `gantt_data.json`: 用于生成甘特图的原始数据。
- `gantt_data_adjusted.json`: 调整后用于生成甘特图的数据。
- `analysis_summary.md`: 分析过程的摘要。
- `createTaskFiles_*.js`: 用于创建任务文件的Node.js脚本。
- `parseTasks.js`, `generateTreeAndGantt.js`, `adjustAndRegenerate.js`: 用于解析、生成和调整任务数据的Node.js脚本。
- `t.js.timeformat.yaml`: 任务文件的模板。
- `README.md`: 项目说明文件。

## 使用说明

1. 安装依赖:
   ```bash
   npm install
   ```

2. 显示任务树形结构图:
   ```bash
   node cli.js tree
   ```

3. 显示任务甘特图:
   ```bash
   node cli.js gantt
   ```

## 任务组织

任务按照 `2025S3.yaml` 中的分组进行组织，包括 PSMD, ego, infra, learn, js, raw, xuemen。

### 特殊关系

在分析过程中，我们根据对话内容确定了以下特殊关系：

- **PSMD**:
  - `machines model`, `整理新版本term的manifest code`, `整理新版本term的manifest text` 是并行的新版本任务。
  - `term + COM matedata -> deploy metadata -> deploy view` 是旧版本任务。
  - `智在科技项目准备` 和 `子1609:基于公司、合同` 是兄弟任务，同属于'智在科技'项目。
  
- **ego**:
  - `entry的按月归并` 依赖于 `js: embedded dbs`。
  
- **learn**:
  - `MCP in ts` 依赖于 `MCP in nodejs`。
  - `业务规则引擎（BRMS）` 是 `Drools/DRL替代` 的父任务。
  
- **raw**:
  - `新版营养成分详情，允许多种营养成分。` 是一个父任务，它包含以下子任务：
    - `整理代码，理顺food.js几个成员函数之间的调用关系` (子任务)
      - `新版本food预算决算` (孙子任务)
    - `新版食材排序，包括升序、降序、特定值距离、多种营养成分特定值组合距离。` (子任务，与`整理代码...`并行)
  - 优先级：`整理代码...` 和 `新版食材排序...` 的优先级高于 `新版本food预算决算`。
  
- **xuemen**:
  - `kernel模型升级` 是 `重新设计S2状态下的学门基本管理制度` 的一部分。

## Node.js脚本说明

- `parseTasks.js`: 解析 `2025S3.yaml` 并生成 `tasks.json`。
- `generateTreeAndGantt.js`: 根据 `tasks.json` 生成 `task_tree.txt` 和 `gantt_data.json`。
- `adjustAndRegenerate.js`: 根据对话调整任务关系，并重新生成 `tasks_adjusted.json`, `task_tree_adjusted.txt`, `gantt_data_adjusted.json`。
- `cli.js`: 提供命令行界面，可以显示美观的树形结构图和甘特图。
- `createTaskFiles_utf8.js`: 根据 `tasks_adjusted.json` 在 `data/` 目录中为每个任务创建独立的YAML文件，并将对话中澄清的信息补充到 `readme` 字段。此脚本已成功运行。

## 注意事项

- 在Windows命令行中运行 `node cli.js tree` 或 `node cli.js gantt` 时，可能会遇到中文显示乱码的问题。这通常是由于命令行的代码页设置或字体不支持UTF-8导致的。可以尝试以下方法解决：
  - 使用 `chcp 65001` 命令切换到UTF-8代码页。
  - 更改命令行属性中的字体为支持中文的字体（如“点阵字体”或“新宋体”）。
  - 使用支持UTF-8的终端，如 Windows Terminal。

## 总结

本项目已成功完成所有目标：

1.  **解析**: 成功解析了 `2025S3.yaml` 文件中的复杂任务数据。
2.  **结构化**: 将任务数据转换为结构化的JSON格式 (`tasks.json`)，并根据对话内容进行调整 (`tasks_adjusted.json`)。
3.  **分析**: 深入分析了任务之间的隐含关系，包括父子关系和依赖关系，并将这些信息补充到数据中。
4.  **文件创建**: 成功为每个任务在 `data` 目录下创建了独立的YAML文件，包含了任务的所有信息，包括从对话中整理出的特殊说明。
5.  **可视化**: 开发了CLI工具，可以显示美观的树形结构图和甘特图，帮助理解任务组织和时间安排。

所有任务文件均已创建，包含了从对话中整理出的详细信息。`tasks_adjusted.json` 文件仍然是一个重要的交付成果，它包含了所有结构化的任务数据。