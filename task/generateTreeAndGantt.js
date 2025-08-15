const fs = require('fs');
const path = require('path');

// 读取解析后的JSON文件
const jsonFilePath = path.join(__dirname, 'tasks.json');
const tasks = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

// 生成树形结构图
function generateTree(tasks, indent = 0) {
    let tree = '';
    const indentStr = ' '.repeat(indent);
    
    for (const [taskName, taskArray] of Object.entries(tasks)) {
        tree += `${indentStr}- ${taskName}\n`;
        for (const task of taskArray) {
            tree += `${indentStr}  - ${task.name} (${task.duration} minutes)\n`;
            if (task.bind) {
                tree += generateTree({ [task.name]: task.bind }, indent + 4);
            }
        }
    }
    
    return tree;
}

// 生成甘特图数据
function generateGanttData(tasks) {
    let ganttData = [];
    let startDate = new Date('2025-07-01T00:00:00');
    let currentDate = new Date(startDate);
    
    for (const [taskName, taskArray] of Object.entries(tasks)) {
        for (const task of taskArray) {
            const endDate = new Date(currentDate.getTime() + task.duration * 60000);
            ganttData.push({
                name: `${taskName}: ${task.name}`,
                start: currentDate.toISOString(),
                end: endDate.toISOString()
            });
            currentDate = endDate;
            
            // 处理bind字段
            if (task.bind) {
                for (const subTask of task.bind) {
                    const subEndDate = new Date(currentDate.getTime() + subTask.duration * 60000);
                    ganttData.push({
                        name: `${taskName}: ${task.name} -> ${subTask.name}`,
                        start: currentDate.toISOString(),
                        end: subEndDate.toISOString()
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
const treeFilePath = path.join(__dirname, 'task_tree.txt');
fs.writeFileSync(treeFilePath, tree);

// 生成甘特图数据并保存到文件
const ganttData = generateGanttData(tasks);
const ganttFilePath = path.join(__dirname, 'gantt_data.json');
fs.writeFileSync(ganttFilePath, JSON.stringify(ganttData, null, 2));

console.log(`Tree structure has been saved to ${treeFilePath}`);
console.log(`Gantt chart data has been saved to ${ganttFilePath}`);