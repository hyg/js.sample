var yaml = require('js-yaml');
const FPM = require('./FPM.js');

const { Command } = require('commander');
var program = new Command();

function log(...s) {
    s[0] = log.caller.name + "> " + s[0];
    console.log(...s);
}

const debug = false;
FPM.debug = debug;
var fpmobj ;

program
    .name('FPM sample')
    .description('a sample instance of FPM(Finite Protocol Machine) in manifest code.')
    .version('0.1.0');

const FPMcmd = program
    .command('fpm')
    .description('FPM entry');

FPMcmd
    .command("init <id>")
    .description('初始化：读取FPM元数据，从出事protocol开始。')
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
    .command("slipit [data]")
    .description('FPM分立，TBD。')
    .action((data) => {
        log("spilit:", data);
        fpmobj=FPM.load();
        var obj2 = FPM.spilit(fpmobj,data);
        FPM.save(fpmobj);
    });

FPMcmd
    .command("test [data]")
    .description('FPM测试，功能不定。')
    .action((data) => {
        log("test:", data);
        fpmobj=FPM.load();
    });

program.parse();