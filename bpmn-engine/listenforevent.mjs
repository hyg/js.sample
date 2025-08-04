import { EventEmitter } from 'node:events';

import { Engine } from 'bpmn-engine';

const source = `
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <process id="theProcess" isExecutable="true">
    <dataObjectReference id="inputFromUserRef" dataObjectRef="inputFromUser" />
    <dataObject id="inputFromUser" />
    <startEvent id="theStart" />
    <userTask id="userTask">
      <ioSpecification id="inputSpec">
        <dataOutput id="userInput" name="sirname" />
      </ioSpecification>
      <dataOutputAssociation id="associatedWith" sourceRef="userInput" targetRef="inputFromUserRef" />
    </userTask>
    <endEvent id="theEnd" />
    <sequenceFlow id="flow1" sourceRef="theStart" targetRef="userTask" />
    <sequenceFlow id="flow2" sourceRef="userTask" targetRef="theEnd" />
  </process>
</definitions>`;

const engine = new Engine({
  name: 'listen example',
  source,
});

const listener = new EventEmitter();

listener.once('wait', (task) => {
  task.signal({
    ioSpecification: {
      dataOutputs: [
        {
          id: 'userInput',
          value: 'von Rosen',
        },
      ],
    },
  });
});

listener.on('flow.take', (flow) => {
  console.log(`flow <${flow.id}> was taken`);
});

engine.once('end', (execution) => {
  console.log(execution.environment.variables);
  console.log(`User sirname is ${execution.environment.output.data.inputFromUser}`);
});

engine.execute(
  {
    listener,
  },
  (err) => {
    if (err) throw err;
  }
);