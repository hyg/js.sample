
export{machine,FSM};

interface machine {
    debug: boolean;
    active: boolean;
    parent: machine;
    init(id:string): machine;
    save(obj:machine):boolean;
    load(id:string):machine;
    log(obj:machine,content:object): string;
    joint(id1:string,id2:string,termid:string): machine;
    split(obj:machine,data:object): machine;
}

interface FSM extends machine{
    s0:string;
    state:[string];
    event:[string];
    action:[(obj:FSM)=>FSM];
    f(obj:FSM,event:string):FSM;
}