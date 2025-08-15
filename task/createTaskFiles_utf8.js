const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 读取调整后的任务JSON文件
const tasksAdjustedPath = path.join(__dirname, 'tasks_adjusted.json');
const tasks = JSON.parse(fs.readFileSync(tasksAdjustedPath, 'utf8'));

// 创建data目录
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 读取t.js.timeformat.yaml作为模板
const templatePath = path.join(__dirname, 't.js.timeformat.yaml');
const templateContent = fs.readFileSync(templatePath, 'utf8');
const template = yaml.load(templateContent);

// 递归函数来创建任务文件
function createTaskFiles(taskList, groupName, parentDir = dataDir) {
    for (const task of taskList) {
        try {
            // 创建任务目录
            const taskDirName = task.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5().\-\s]/g, '_').trim();
            const taskDirPath = path.join(parentDir, taskDirName);
            if (!fs.existsSync(taskDirPath)) {
                fs.mkdirSync(taskDirPath, { recursive: true });
            }

            // 创建任务YAML文件
            const taskYamlPath = path.join(taskDirPath, `${taskDirName}.yaml`);
            
            // 构建readme内容
            let readmeContent = `任务名称: ${task.name}\n`;
            readmeContent += `所属分组: ${groupName}\n`;
            readmeContent += `预计时长: ${task.duration} 分钟\n\n`;
            
            if (task.readme && Array.isArray(task.readme)) {
                readmeContent += "任务描述:\n";
                for (const item of task.readme) {
                    if (typeof item === 'string') {
                        readmeContent += `- ${item}\n`;
                    } else {
                        // 处理对象形式的readme项
                        for (const [key, value] of Object.entries(item)) {
                            readmeContent += `- ${key}: ${value}\n`;
                        }
                    }
                }
            } else {
                readmeContent += "任务描述: 暂无详细描述。\n";
            }
            
            if (task.dependsOn && task.dependsOn.length > 0) {
                readmeContent += `\n依赖任务:\n`;
                for (const dep of task.dependsOn) {
                    readmeContent += `- ${dep}\n`;
                }
            }
            
            // 添加从对话中获取的额外信息
            if (groupName === 'PSMD') {
                if (task.name.includes('machines model')) {
                    readmeContent += `\n补充说明:\n`;
                    readmeContent += "- 这是PSMD新版本的核心工具之一。\n";
                    readmeContent += "- 与term manifest code/text任务并行，但为term任务提供基础支持。\n";
                }
                if (task.name.includes('term + COM')) {
                    readmeContent += `\n补充说明:\n`;
                    readmeContent += "- 这是旧版本的任务，与新版本的machines和term工具无关。\n";
                }
                if (task.name.includes('智在科技项目准备') || task.name.includes('子1609')) {
                    readmeContent += `\n补充说明:\n`;
                    readmeContent += "- 这两个任务属于同一个父项目'智在科技'，是兄弟任务。\n";
                }
            }
            
            if (groupName === 'ego') {
                if (task.name.includes('entry的按月归并')) {
                    readmeContent += `\n补充说明:\n`;
                    readmeContent += "- 此任务依赖于 'js: embedded dbs' 任务的完成。\n";
                }
            }
            
            if (groupName === 'learn') {
                if (task.name.includes('MCP in ts')) {
                    readmeContent += `\n补充说明:\n`;
                    readmeContent += "- 此任务必须在 'learn: MCP in nodejs' 任务完成后才能开始。\n";
                }
                if (task.name.includes('业务规则引擎')) {
                    readmeContent += `\n补充说明:\n`;
                    readmeContent += "- 'Drools/DRL替代' 是此任务的子任务。\n";
                }
            }
            
            if (groupName === 'raw') {
                if (task.name.includes('新版营养成分详情，允许多种营养成分。')) {
                    readmeContent += `\n补充说明:\n`;
                    readmeContent += "- '整理代码...' 是其子任务，'新版本food预算决算' 是孙子任务。\n";
                    readmeContent += "- '新版食材排序...' 是其并行子任务，优先级高于 '新版本food预算决算'。\n";
                }
            }
            
            if (groupName === 'xuemen') {
                if (task.name.includes('kernel模型升级')) {
                    readmeContent += `\n补充说明:\n`;
                    readmeContent += "- 此任务是 '重新设计S2状态下的学门基本管理制度' 的一部分。\n";
                }
            }

            const taskData = {
                ...template,
                name: task.name,
                id: generateId(), // 生成唯一ID
                "parent id": groupName, // 父任务ID设为组名
                start: "2025-07-01", // 默认开始日期
                dependencies: task.dependsOn || [],
                readme: readmeContent,
                step: [],
                log: []
            };
            
            // 如果有bind子任务，则递归创建
            if (task.bind) {
                createTaskFiles(task.bind, task.name, taskDirPath);
            }
            
            // 如果有subTasks子任务，则递归创建
            if (task.subTasks) {
                createTaskFiles(task.subTasks, task.name, taskDirPath);
            }
            
            // 手动构建YAML内容以避免编码问题
            let yamlContent = '';
            yamlContent += `name: ${taskData.name}\n`;
            yamlContent += `id: ${taskData.id}\n`;
            yamlContent += `parent id: ${taskData["parent id"]}\n`;
            yamlContent += `start: ${taskData.start}\n`;
            yamlContent += `dependencies:\n`;
            if (taskData.dependencies && Array.isArray(taskData.dependencies) && taskData.dependencies.length > 0) {
                for (const dep of taskData.dependencies) {
                    yamlContent += `  - ${dep}\n`;
                }
            }
            yamlContent += `path: ${taskData.path || ''}\n`;
            yamlContent += 'readme: |\n';
            const readmeLines = taskData.readme.split('\n');
            for (const line of readmeLines) {
                if (line.trim() !== '') {
                    yamlContent += `  ${line}\n`;
                } else {
                    yamlContent += `  \n`;
                }
            }
            yamlContent += 'step:\n';
            yamlContent += 'log:\n';
            
            fs.writeFileSync(taskYamlPath, yamlContent, 'utf8');
            
            console.log(`Created task file: ${taskYamlPath}`);
        } catch (error) {
            console.error(`Error creating task file for ${task.name}:`, error);
        }
    }
}

// 生成唯一ID (简化版)
function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

try {
    // 为每个分组创建任务文件
    for (const [groupName, taskList] of Object.entries(tasks)) {
        const groupDirPath = path.join(dataDir, groupName);
        if (!fs.existsSync(groupDirPath)) {
            fs.mkdirSync(groupDirPath);
        }
        createTaskFiles(taskList, groupName, groupDirPath);
    }

    console.log('所有任务文件已创建并保存在 data 文件夹中。');
} catch (error) {
    console.error("An error occurred while creating task files:", error);
}