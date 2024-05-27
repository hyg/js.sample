var StateMachine = require('javascript-state-machine');

var fsm = new StateMachine({
    init: 's1',
    transitions: [
      { name: 'a', from: 's1',to: 's2' },
      { name: 'a', from: 's2',to: 's3'  },
      { name: 'a', from: 's3',to: 's4'    },
      { name: 'a', from: 's4',to: 's5' },
      { name: 'a', from: 's5',to: 's1' },
      { name: 'b', from: 's1',to: 's3' },
      { name: 'b', from: 's3',to: 's5' },
      { name: 'b', from: 's5',to: 's2' },
      { name: 'b', from: 's2',to: 's4' },
      { name: 'b', from: 's4',to: 's1' }
    ]
  });

  console.log("state:",fsm.state);
  fsm.a();
  console.log("state:",fsm.state);
  fsm.a();
  console.log("state:",fsm.state);
  fsm.a();
  console.log("state:",fsm.state);
  fsm.a();
  console.log("state:",fsm.state);
  fsm.a();
  console.log("state:",fsm.state);
  fsm.b();
  console.log("state:",fsm.state);
  fsm.b();
  console.log("state:",fsm.state);
  fsm.b();
  console.log("state:",fsm.state);
  fsm.b();
  console.log("state:",fsm.state);
  fsm.b();