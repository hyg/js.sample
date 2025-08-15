const fs = require('fs');
const path = require('path');

// 读取解析后的JSON文件
const jsonFilePath = path.join(__dirname, 'tasks.json');
let tasks = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

// 根据问答调整任务关系
function adjustTaskRelationships(tasks) {
    // PSMD: machines model, term manifest code/text, term + COM -> deploy 是独立的新版本任务
    // PSMD: 子1609 和 智在科技项目准备 是兄弟任务，属于隐含的父项目"智在科技"
    // 在tasks.json中，它们已经是平级的，所以不需要额外调整结构。
    // 但我们可以在注释或后续处理中标记它们属于同一个项目。
    
    // PSMD: 同一个工具的同一个level是text、law、code的次序
    // 这在tasks.json中已经通过schema manifest law v0 -> schema level 2 schema for law v1 和
    // eventemitter sample -> schema level 2 schema for code v1 体现。
    
    // ego: entry的按月归并 依赖于 js: embedded dbs
    // 这种跨组依赖需要特殊标记。我们将在任务对象中添加 dependsOn 字段。
    // 首先找到 js: embedded dbs 的索引
    const jsTasks = tasks.js;
    const embeddedDbsIndex = jsTasks.findIndex(t => t.name === 'embedded dbs');
    if (embeddedDbsIndex !== -1) {
        // 找到 ego: entry的按月归并
        const egoTasks = tasks.ego;
        const entryMergeIndex = egoTasks.findIndex(t => t.name === 'entry的按月归并');
        if (entryMergeIndex !== -1) {
            // 添加依赖关系
            if (!egoTasks[entryMergeIndex].dependsOn) {
                egoTasks[entryMergeIndex].dependsOn = [];
            }
            // 为了简化，我们用任务名来表示依赖
            egoTasks[entryMergeIndex].dependsOn.push('js: embedded dbs');
        }
    }
    
    // learn: MCP in ts 依赖于 learn: MCP in nodejs
    const learnTasks = tasks.learn;
    const mcpNodeJsIndex = learnTasks.findIndex(t => t.name === 'MCP in nodejs');
    const mcpTsIndex = learnTasks.findIndex(t => t.name === 'MCP in ts');
    if (mcpNodeJsIndex !== -1 && mcpTsIndex !== -1) {
        if (!learnTasks[mcpTsIndex].dependsOn) {
            learnTasks[mcpTsIndex].dependsOn = [];
        }
        learnTasks[mcpTsIndex].dependsOn.push('learn: MCP in nodejs');
    }
    
    // raw: 调整子任务优先级和依赖
    const rawTasks = tasks.raw;
    const parentTaskIndex = rawTasks.findIndex(t => t.name === '新版营养成分详情，允许多种营养成分。');
    if (parentTaskIndex !== -1) {
        const parentTask = rawTasks[parentTaskIndex];
        // 假设 bind 数组中的任务是子任务
        if (parentTask.bind && parentTask.bind.length > 0) {
            // 找到 "整理代码..." 子任务
            const refactorTaskIndex = parentTask.bind.findIndex(t => t.name === '整理代码，理顺food.js几个成员函数之间的调用关系');
            // 找到 "新版营养成分详情" (主任务A) - 它应该是一个顶级任务，不是bind里的
            // 实际上，根据tasks.json, "新版营养成分详情，允许多种营养成分。" 是顶级任务，
            // 它的bind里有 "整理代码..." 和 "新版食材排序..."。
            // 我们需要重新组织这个结构。
            
            // 根据问答，正确的结构应该是：
            // "新版营养成分详情，允许多种营养成分。" (父)
            //   -> "整理代码，理顺food.js几个成员函数之间的调用关系" (子，前置)
            //       -> "新版本food预算决算" (孙，依赖整理代码，优先级低)
            //   -> "新版营养成分详情" (子，并行A，优先级高)
            //   -> "新版食材排序，包括升序、降序、特定值距离、多种营养成分特定值组合距离。" (子，并行B，优先级高)
            
            // 但是 tasks.json 的原始结构是：
            // "新版营养成分详情，允许多种营养成分。"
            //   bind: [
            //     { name: "整理代码...", bind: [{ name: "新版本food预算决算" }] },
            //     { name: "新版营养成分详情" },
            //     { name: "新版食材排序..." }
            //   ]
            
            // 这个结构已经基本符合我们的要求，除了"新版营养成分详情"和"新版食材排序"是并行的，
            // 而"新版本food预算决算"依赖于"整理代码"。
            // 优先级信息需要在后续处理甘特图时体现。
        }
    }
    
    // learn: 业务规则引擎（BRMS） 是 drools/DRL替代 的父任务
    const droolsIndex = learnTasks.findIndex(t => t.name === 'Drools/DRL替代');
    const brmsIndex = learnTasks.findIndex(t => t.name === '业务规则引擎（BRMS）');
    if (droolsIndex !== -1 && brmsIndex !== -1) {
        // 在当前的tasks.json结构中，Drools/DRL替代是独立任务。
        // 我们需要将其作为BRMS的子任务。
        // 由于tasks.json的结构是 { groupName: [task1, task2, ...] }，
        // 我们不能直接嵌套。我们需要在BRMS任务中添加一个字段来表示子任务。
        // 或者，我们可以在BRMS任务中添加一个 notes 字段说明其包含 Drools/DRL替代。
        // 但更标准的做法是修改结构。这里我们选择在BRMS任务中添加subTasks字段。
        if (!learnTasks[brmsIndex].subTasks) {
            learnTasks[brmsIndex].subTasks = [];
        }
        // 将Drools/DRL替代任务移动到BRMS的子任务列表中
        // 注意：这会改变原数组，需要小心处理索引
        const droolsTask = learnTasks.splice(droolsIndex, 1)[0]; // 移除并获取
        // 由于splice改变了数组，brmsIndex可能也需要调整
        const adjustedBrmsIndex = brmsIndex > droolsIndex ? brmsIndex - 1 : brmsIndex;
        learnTasks[adjustedBrmsIndex].subTasks.push(droolsTask);
    }

    // learn: helia dag-json 与 js: YARRRML 没有关系
    // 这一点在tasks.json中已经体现，它们是独立的任务。
    
    // js: node.js 子任务可以独立
    // 这一点在tasks.json中已经通过bind体现，且它们是并行的。
    
    // xuemen: kernel模型升级 是 重新设计S2... 的一部分
    // 这一点在tasks.json中是平级任务。我们需要标记依赖关系。
    const xuemenTasks = tasks.xuemen;
    const redesignIndex = xuemenTasks.findIndex(t => t.name === '重新设计S2状态下的学门基本管理制度');
    const kernelIndex = xuemenTasks.findIndex(t => t.name === 'kernel模型升级');
    if (redesignIndex !== -1 && kernelIndex !== -1) {
        if (!xuemenTasks[kernelIndex].dependsOn) {
            xuemenTasks[kernelIndex].dependsOn = [];
        }
        xuemenTasks[kernelIndex].dependsOn.push('xuemen: 重新设计S2状态下的学门基本管理制度');
    }
    
    // 返回调整后的任务对象
    return tasks;
}

// 执行调整
tasks = adjustTaskRelationships(tasks);

// 保存调整后的任务结构 (可选，用于调试)
const adjustedJsonFilePath = path.join(__dirname, 'tasks_adjusted.json');
fs.writeFileSync(adjustedJsonFilePath, JSON.stringify(tasks, null, 2));

console.log(`Adjusted task relationships and saved to ${adjustedJsonFilePath}`);

// 重新生成树形结构图
function generateTree(tasks, indent = 0) {
    let tree = '';
    const indentStr = ' '.repeat(indent);
    
    for (const [taskName, taskArray] of Object.entries(tasks)) {
        tree += `${indentStr}- ${taskName}\n`;
        for (const task of taskArray) {
            tree += `${indentStr}  - ${task.name} (${task.duration} minutes)\n`;
            // 显示子任务 (bind)
            if (task.bind) {
                tree += generateTree({ [task.name]: task.bind }, indent + 4);
            }
            // 显示新增的子任务 (subTasks)
            if (task.subTasks) {
                for (const subTask of task.subTasks) {
                    tree += `${indentStr}    - ${subTask.name} (${subTask.duration} minutes) (Sub-task of ${task.name})\n`;
                    if (subTask.bind) {
                         tree += generateTree({ [subTask.name]: subTask.bind }, indent + 8);
                    }
                }
            }
            // 显示依赖关系
            if (task.dependsOn && task.dependsOn.length > 0) {
                tree += `${indentStr}    Depends on: ${task.dependsOn.join(', ')}\n`;
            }
        }
    }
    
    return tree;
}

// 生成甘特图数据，考虑依赖和优先级
function generateGanttData(tasks) {
    let ganttData = [];
    // 使用一个更真实的起始日期
    let startDate = new Date('2025-07-01T00:00:00');
    let currentDate = new Date(startDate);
    
    // 创建一个任务映射，方便查找
    let taskMap = {};
    for (const [groupName, taskArray] of Object.entries(tasks)) {
        for (const task of taskArray) {
            const fullName = `${groupName}: ${task.name}`;
            taskMap[fullName] = { ...task, group: groupName, fullName };
            // 也添加子任务到映射中
            if (task.subTasks) {
                for (const subTask of task.subTasks) {
                    const subFullName = `${groupName}: ${task.name} -> ${subTask.name}`;
                    taskMap[subFullName] = { ...subTask, group: groupName, fullName: subFullName, parent: fullName };
                }
            }
            // 也添加bind子任务到映射中
            if (task.bind) {
                for (const subTask of task.bind) {
                    const subFullName = `${groupName}: ${task.name} -> ${subTask.name}`;
                    taskMap[subFullName] = { ...subTask, group: groupName, fullName: subFullName, parent: fullName };
                }
            }
        }
    }

    // 简化的甘特图生成，不处理复杂的依赖排序，仅按原始顺序和父子关系排列
    // 真实的甘特图需要拓扑排序来处理依赖，这里为了简化，我们保持原顺序，
    // 但会在任务名称中标注依赖和父子关系。
    for (const [groupName, taskArray] of Object.entries(tasks)) {
        for (const task of taskArray) {
            const fullName = `${groupName}: ${task.name}`;
            const taskInfo = taskMap[fullName];
            
            const endDate = new Date(currentDate.getTime() + task.duration * 60000);
            ganttData.push({
                name: fullName,
                start: currentDate.toISOString(),
                end: endDate.toISOString(),
                // 可以添加更多字段用于甘特图库
                dependsOn: task.dependsOn || [],
                group: groupName
            });
            currentDate = endDate;
            
            // 处理 bind 子任务
            if (task.bind) {
                for (const subTask of task.bind) {
                    const subEndDate = new Date(currentDate.getTime() + subTask.duration * 60000);
                    ganttData.push({
                        name: `${groupName}: ${task.name} -> ${subTask.name}`,
                        start: currentDate.toISOString(),
                        end: subEndDate.toISOString(),
                        dependsOn: subTask.dependsOn || [],
                        group: groupName
                    });
                    currentDate = subEndDate;
                }
            }
            
            // 处理 subTasks 子任务
            if (task.subTasks) {
                for (const subTask of task.subTasks) {
                    const subEndDate = new Date(currentDate.getTime() + subTask.duration * 60000);
                    ganttData.push({
                        name: `${groupName}: ${task.name} -> ${subTask.name}`,
                        start: currentDate.toISOString(),
                        end: subEndDate.toISOString(),
                        dependsOn: subTask.dependsOn || [],
                        group: groupName
                    });
                    currentDate = subEndDate;
                }
            }
        }
    }
    
    return ganttData;
}


// 生成树形结构图并保存到文件
const tree = generateTree(tasks);
const treeFilePath = path.join(__dirname, 'task_tree_adjusted.txt');
fs.writeFileSync(treeFilePath, tree);

// 生成甘特图数据并保存到文件
const ganttData = generateGanttData(tasks);
const ganttFilePath = path.join(__dirname, 'gantt_data_adjusted.json');
fs.writeFileSync(ganttFilePath, JSON.stringify(ganttData, null, 2));

console.log(`Adjusted tree structure has been saved to ${treeFilePath}`);
console.log(`Adjusted Gantt chart data has been saved to ${ganttFilePath}`);