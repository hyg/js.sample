const config = require("./config.js");
const syncthing = require('node-syncthing');

const options = {
    host: 'localhost',
    port: 8384,
    apiKey: config.APIkey,
    eventListener: true,
    retries: 10,
};

//Create an instance
const st = syncthing(options);

st.stats.folders((err,res) => {
    if (!err) {
        console.log(res) //pong
    } else {
        console.error(err)
    }
})
st.stats.devices((err,res) => {
    if (!err) {
        console.log(res) //pong
    } else {
        console.error(err)
    }
})

//With Callback
st.system.ping((err, res) => {
    if (!err) {
        console.log(res.ping) //pong
    } else {
        console.error(err)
    }
})

//With Promises
st.system.ping().then((res) => {
    console.log(res.ping) //pong
}).catch((err) => {
    console.error(err)
})

//Listen to events
st.on('ping', () => {
    console.log('pong')
})

st.on('error', (err) => {
    console.error(err)
})

//Removing event listeners will stop the event polling
st.removeAllListeners('ping')
st.removeAllListeners('error')