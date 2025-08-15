const fs = require('fs');
const path = require('path');
const Table = require('cli-table3');
const moment = require('moment');

// 读取调整后的任务JSON文件
const tasksAdjustedPath = path.join(__dirname, 'tasks_adjusted.json');
const tasks = JSON.parse(fs.readFileSync(tasksAdjustedPath, 'utf8'));

// 读取t.js.timeformat.yaml作为模板
const templatePath = path.join(__dirname, 't.js.timeformat.yaml');
const templateContent = fs.readFileSync(templatePath, 'utf8');

// 显示树形结构图
function displayTree() {
    console.log('\n=== 任务树形结构图 ===\n');
    
    function printTasks(taskList, prefix = '', isLast = true) {
        for (let i = 0; i < taskList.length; i++) {
            const task = taskList[i];
            const isLastTask = i === taskList.length - 1;
            const currentPrefix = prefix + (isLast ? '└── ' : '├── ');
            const childPrefix = prefix + (isLast ? '    ' : '│   ');
            
            console.log(`${currentPrefix}${task.name} (${task.duration}分钟)`);
            
            // 打印bind子任务
            if (task.bind && task.bind.length > 0) {
                printTasks(task.bind, childPrefix, isLastTask && (!task.subTasks || task.subTasks.length === 0));
            }
            
            // 打印subTasks子任务
            if (task.subTasks && task.subTasks.length > 0) {
                printTasks(task.subTasks, childPrefix, isLastTask);
            }
        }
    }
    
    for (const [groupName, taskList] of Object.entries(tasks)) {
        console.log(`\n${groupName}:`);
        printTasks(taskList, '', true);
    }
}

// 显示甘特图
function displayGantt() {
    console.log('\n=== 任务甘特图 ===\n');
    
    // 创建一个表格来显示甘特图
    const table = new Table({
        head: ['任务名称', '开始时间', '结束时间', '持续时间(分钟)'],
        colWidths: [30, 20, 20, 15]
    });
    
    // 简化的甘特图显示，按组排列任务
    let currentTime = moment('2025-07-01 00:00');
    
    for (const [groupName, taskList] of Object.entries(tasks)) {
        for (const task of taskList) {
            const startTime = currentTime.format('YYYY-MM-DD HH:mm');
            const endTime = currentTime.add(task.duration, 'minutes').format('YYYY-MM-DD HH:mm');
            
            table.push([
                `${groupName}: ${task.name}`,
                startTime,
                endTime,
                task.duration
            ]);
            
            // 添加bind子任务
            if (task.bind) {
                for (const subTask of task.bind) {
                    const subStartTime = currentTime.format('YYYY-MM-DD HH:mm');
                    const subEndTime = currentTime.add(subTask.duration, 'minutes').format('YYYY-MM-DD HH:mm');
                    
                    table.push([
                        `  -> ${subTask.name}`,
                        subStartTime,
                        subEndTime,
                        subTask.duration
                    ]);
                }
            }
            
            // 添加subTasks子任务
            if (task.subTasks) {
                for (const subTask of task.subTasks) {
                    const subStartTime = currentTime.format('YYYY-MM-DD HH:mm');
                    const subEndTime = currentTime.add(subTask.duration, 'minutes').format('YYYY-MM-DD HH:mm');
                    
                    table.push([
                        `  -> ${subTask.name}`,
                        subStartTime,
                        subEndTime,
                        subTask.duration
                    ]);
                }
            }
        }
    }
    
    console.log(table.toString());
}

// 主函数
function main() {
    console.log('欢迎使用任务管理CLI工具！');
    
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('请提供命令: tree 或 gantt');
        return;
    }
    
    const command = args[0];
    
    switch (command) {
        case 'tree':
            displayTree();
            break;
        case 'gantt':
            displayGantt();
            break;
        default:
            console.log('未知命令。请使用: tree 或 gantt');
    }
}

main();