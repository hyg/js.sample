//class machine = require('./machine.class');
import { machine } from './machine.class.js';

class FSM extends machine{
    constructor(id,debug=true,active=false,parent=null){
        super(id,debug,active,parent);
        console.log('genarate new FSM... id:',id,this.id2metafilename(id));
    }
    id2metafilename(id){
        return "./fsm."+id+".yaml";
    }
    id2objfilename(id){
        return "./fsmobj."+id+".yaml";
    }
    s0;
    state;
    event;
    action;
    f(obj,event){};
}

export {FSM};