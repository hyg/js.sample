var RemoteStorage = require('remotestoragejs');

const remoteStorage = new RemoteStorage({
//    serverAddress: 'https://api.remote.storage',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    instanceId: 'my-cool-app'
  });
//console.log("remoteStorage:",remoteStorage);

remoteStorage.on('connected', () => {
  const userAddress = remoteStorage.remote.userAddress;
  console.debug(`${userAddress} connected their remote storage.`);
  remoteStorage.setItem('projectname', "PSMD");
})


remoteStorage.on('network-offline', () => {
  console.debug(`We're offline now.`);
})

remoteStorage.on('network-online', () => {
  console.debug(`Hooray, we're back online.`);
})