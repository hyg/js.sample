const { client, xml } = require("@xmpp/client");


const xmpp = client({
    service: "chat.jabb.im",
    domain: "jabbim.com",
    username: "learn",
    password: "123456",
});


xmpp.on("error", (err) => {
    console.error(err);
});

xmpp.on("offline", () => {
    console.log("offline");
});

xmpp.on("stanza", async (stanza) => {
    console.log(stanza);
    if (stanza.is("message")) {
        //console.log(stanza);
        const message = xml(
            "message",
            { type: "chat", to: "hyg@jabbim.com" },
            xml("body", {}, "你好。"),
        );
        await xmpp.send(message);
        //await xmpp.stop();
    }
});

xmpp.on("online", async (address) => {
    // Makes itself available
    console.log("online"+address);
    //await xmpp.send(xml("presence"));

    // Sends a chat message to itself
    const message = xml(
        "message",
        { type: "chat", to: "hyg@jabbim.com" },
        xml("body", {}, "hello world"),
    );
    await xmpp.send(message);
});

xmpp.start().catch(console.error);