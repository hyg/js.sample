var yaml = require('js-yaml');
const FPM = require('./FPM.js');
const FSM = require('./FSM.js');

const { Command } = require('commander');
var program = new Command();

function log(...s) {
    s[0] = log.caller.name + "> " + s[0];
    console.log(...s);
}

const debug = false;
FPM.debug = debug;
FSM.debug = debug;
var fpmobj ;
var fsmobj ;

program
    .name('FPM sample')
    .description('a sample instance of machines in manifest code.')
    .version('0.1.0');

// FPM
const FPMcmd = program
    .command('fpm')
    .description('FPM(Finite Protocol Machine) entry');

FPMcmd
    .command("init <id>")
    .description('初始化：读取 FPM(Finite Protocol Machine) 元数据，从出事protocol开始。')
    .action((id) => {
        log("init:", id);
        fpmobj = FPM.init(id);
        FPM.save(fpmobj);
        log("FPM:\n%s",yaml.dump(fpmobj));
    });

FPMcmd
    .command("log <content>")
    .description('事件处理')
    .action((content) => {
        log("log:", content);
        fpmobj=FPM.load();
        log("FPM:\n%s",yaml.dump(fpmobj));
        var effect = FPM.log(fpmobj,content);
        log("effect: %s",effect);
        FPM.save(fpmobj);
    });

FPMcmd
    .command("joint <id1> <id2> <termid>")
    .description('FPM合并。id2并入id1，由id1.termid修订id2的不可修订条款。')
    .action((id1,id2,termid) => {
        log("joint:",id1,id2,termid);
        fpmobj=FPM.load();
        fpmobj = FPM.joint(id1,id2,termid);
        FPM.save(fpmobj);
    });

FPMcmd
    .command("split [data]")
    .description('FPM分立，TBD。')
    .action((data) => {
        log("split:", data);
        fpmobj=FPM.load();
        var obj2 = FPM.split(fpmobj,data);
        FPM.save(fpmobj);
    });

FPMcmd
    .command("test [data]")
    .description('FPM测试，功能不定。')
    .action((data) => {
        log("test:", data);
        fpmobj=FPM.load();
    });

// FSM
const FSMcmd = program
    .command('fsm')
    .description('FSM(Finite State Machine) entry');

FSMcmd
    .command("init <id>")
    .description('初始化：读取 FSM(Finite State Machine) 元数据，从初始state开始。')
    .action((id) => {
        log("init:", id);
        fsmobj = FSM.init(id,0);
        log("FSM:\n%s",fsmobj);
        FSM.save(fsmobj);
        log("FSM:\n%s",yaml.dump(fsmobj));
    });

FSMcmd
    .command("event <content>")
    .description('事件处理')
    .action((content) => {
        log("event:", content);
        fsmobj=FSM.load();
        log("FSM:\n%s",yaml.dump(fsmobj));
        var ret = FSM.event(fsmobj,content);
        log("ret: %s",ret);
        FSM.save(fsmobj);
    });

FSMcmd
    .command("joint <id1> <id2> <termid>")
    .description('FSM合并。id2并入id1，由id1.termid修订id2的不可修订条款。')
    .action((id1,id2,termid) => {
        log("joint:",id1,id2,termid);
        fsmobj=FSM.load();
        fsmobj = FSM.joint(id1,id2,termid);
        FSM.save(fsmobj);
    });

FSMcmd
    .command("split [data]")
    .description('FSM分立，TBD。')
    .action((data) => {
        log("split:", data);
        fsmobj=FSM.load();
        var obj2 = FSM.split(fsmobj,data);
        FSM.save(fsmobj);
    });

FSMcmd
    .command("test [data]")
    .description('FSM测试，功能不定。')
    .action((data) => {
        log("test:", data);
        fsmobj=FSM.load();
    });

program.parse();