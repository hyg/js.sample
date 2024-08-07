import { machine } from './machine';

interface FSM extends machine{
    s0:string;
    state:[string];
    event:[string];
    action:[(obj:FSM)=>FSM];
    f(obj:FSM,event:string):FSM;
}

export const exampleFunction = () => {
    console.log("Hello from TypeScript!");
  }
  