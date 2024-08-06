import crypto from 'crypto';
import createIpid, { getDid } from 'did-ipid';

const pem = crypto.createPrivateKey("pem");
const did = await getDid(pem);
//=> Returns the DID associated to a private key in PEM format.
console.log("pem:\n%s",pem);
console.log("did:\n%s",did);

const ipid = await createIpid(ipfs);

const didDocument1 = await ipid.resolve(did);
//const didDocument = await ipid.resolve('did:ipid:QmUTE4cxTxihntPEFqTprgbqyyS9YRaRcC8FXp6PACEjFG');
//=> Resolves a DID and returns the respective DID Document.
console.log("didDocument1:\n%s",didDocument1);

const didDocument2 = await ipid.create(pem, (document) => {
    const publicKey = document.addPublicKey({
    	type: 'RsaVerificationKey2018',
        publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
    });

    const authentication = document.addAuthentication(publicKey.id);

    const service = document.addService({
    	id: 'hub',
    	type: 'HubService',
    	serviceEndpoint: 'https://hub.example.com/',
    });
});
//=> Creates a new DID and the corresponding DID Document based on the provided private key pem.
//=> The DID Document is published with the added publicKey, authentication and service.
console.log("didDocument2:\n%s",didDocument2);

const didDocument3 = await ipid.update(pem, (document) => {
    document.removeService('hub');

    document.addService({
    	id: 'messages',
    	type: 'MessagingService',
    	serviceEndpoint: 'https://example.com/messages/8377464',
    });
});
//=> Updates a DID Document based on the DID associated to the provided private key pem.
//=> The DID Document is published without the `hub` service and with a new one called `messages`. 
console.log("didDocument3:\n%s",didDocument3);