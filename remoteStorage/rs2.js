var RemoteStorage = require('remotestoragejs');

const remoteStorage = new RemoteStorage({
    serverAddress: 'https://api.remote.storage',
    userId: '123e4567-e89b-12d3-a456-426614174000'
  });

let name = remoteStorage.getItem('projectname');
console.log("project name:",name);