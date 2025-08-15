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
// 确保模板内容以UTF-8编码
const template = yaml.load(templateContent);

// 简化版本的创建任务文件函数
function createTaskFilesSimple(taskList, groupName, parentDir = dataDir) {
    for (const task of taskList) {
        try {
            // 创建任务目录 (使用更简单的命名方式)
            const safeTaskName = task.name.substring(0, 50).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
            const taskDirPath = path.join(parentDir, safeTaskName);
            if (!fs.existsSync(taskDirPath)) {
                fs.mkdirSync(taskDirPath, { recursive: true });
            }

            // 构建readme内容 (使用基本的ASCII字符避免编码问题)
            let readmeContent = `Task Name: ${task.name}
`;
            readmeContent += `Group: ${groupName}
`;
            readmeContent += `Estimated Duration: ${task.duration} minutes

`;
            
            if (task.readme && Array.isArray(task.readme)) {
                readmeContent += "Description:
";
                for (const item of task.readme) {
                    if (typeof item === 'string') {
                        readmeContent += `- ${item}
`;
                    }
                }
            } else {
                readmeContent += "Description: No detailed description available.
";
            }
            
            // 创建任务YAML文件
            const taskYamlPath = path.join(taskDirPath, `${safeTaskName}.yaml`);
            
            const taskData = {
                ...template,
                name: task.name,
                id: Math.random().toString(36).substring(2, 10), // 简单的ID生成
                "parent id": groupName,
                start: "2025-07-01",
                dependencies: task.dependsOn || [],
                readme: readmeContent,
                step: [],
                log: []
            };

            // 写入文件时指定UTF-8编码
            fs.writeFileSync(taskYamlPath, yaml.dump(taskData, { 
                lineWidth: -1,
                quotingType: '"'
            }), 'utf8');
            
            console.log(`Created task file: ${taskYamlPath}`);
            
            // 递归处理子任务
            if (task.bind) {
                createTaskFilesSimple(task.bind, task.name, taskDirPath);
            }
            if (task.subTasks) {
                createTaskFilesSimple(task.subTasks, task.name, taskDirPath);
            }
            
        } catch (error) {
            console.error(`Error creating task file for ${task.name}:`, error.message);
        }
    }
}

try {
    console.log("Starting to create task files...");
    // 为每个分组创建任务文件
    for (const [groupName, taskList] of Object.entries(tasks)) {
        const groupDirPath = path.join(dataDir, groupName);
        if (!fs.existsSync(groupDirPath)) {
            fs.mkdirSync(groupDirPath);
        }
        console.log(`Creating tasks for group: ${groupName}`);
        createTaskFilesSimple(taskList, groupName, groupDirPath);
    }

    console.log('All task files have been created and saved in the data folder.');
} catch (error) {
    console.error("An error occurred while creating task files:", error.message);
}