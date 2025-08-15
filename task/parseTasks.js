const fs = require('fs');
const path = require('path');

// 读取YAML文件
const yaml = require('js-yaml');

// 读取2025S3.yaml文件
const yamlFilePath = path.join(__dirname, '2025S3.yaml');
const fileContents = fs.readFileSync(yamlFilePath, 'utf8');
const data = yaml.load(fileContents);

// 初始化任务列表
let tasks = {};

// 解析todo字段
if (data.todo) {
    for (const [taskName, taskArray] of Object.entries(data.todo)) {
        tasks[taskName] = [];
        for (const task of taskArray) {
            // 获取任务的键（时间）和值（任务名称）
            const timeKey = Object.keys(task)[0];
            const taskDetails = task[timeKey];
            const duration = parseInt(timeKey);
            const name = typeof taskDetails === 'string' ? taskDetails : taskDetails.name || 'Unnamed Task';
            
            // 创建任务对象
            let taskObj = {
                duration: duration,
                name: name
            };
            
            // 如果有readme字段，则添加到任务对象中
            if (task.readme) {
                taskObj.readme = task.readme;
            }
            
            // 如果有bind字段，则递归处理
            if (task.bind) {
                taskObj.bind = [];
                for (const subTask of task.bind) {
                    const subTimeKey = Object.keys(subTask)[0];
                    const subTaskDetails = subTask[subTimeKey];
                    const subDuration = parseInt(subTimeKey);
                    const subName = typeof subTaskDetails === 'string' ? subTaskDetails : subTaskDetails.name || 'Unnamed Subtask';
                    
                    let subTaskObj = {
                        duration: subDuration,
                        name: subName
                    };
                    
                    if (subTask.readme) {
                        subTaskObj.readme = subTask.readme;
                    }
                    
                    // 如果子任务还有bind字段，则继续递归处理
                    if (subTask.bind) {
                        subTaskObj.bind = [];
                        // 这里可以继续递归处理更深层次的bind，但为了简化，我们只处理到第二层
                        for (const subSubTask of subTask.bind) {
                            const subSubTimeKey = Object.keys(subSubTask)[0];
                            const subSubTaskDetails = subSubTask[subSubTimeKey];
                            const subSubDuration = parseInt(subSubTimeKey);
                            const subSubName = typeof subSubTaskDetails === 'string' ? subSubTaskDetails : subSubTaskDetails.name || 'Unnamed Sub-subtask';
                            
                            let subSubTaskObj = {
                                duration: subSubDuration,
                                name: subSubName
                            };
                            
                            if (subSubTask.readme) {
                                subSubTaskObj.readme = subSubTask.readme;
                            }
                            
                            subTaskObj.bind.push(subSubTaskObj);
                        }
                    }
                    
                    taskObj.bind.push(subTaskObj);
                }
            }
            
            tasks[taskName].push(taskObj);
        }
    }
}

// 将解析后的任务列表写入JSON文件
const jsonFilePath = path.join(__dirname, 'tasks.json');
fs.writeFileSync(jsonFilePath, JSON.stringify(tasks, null, 2));

console.log(`Tasks have been parsed and saved to ${jsonFilePath}`);