const { client, xml } = require("@xmpp/client");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const xmpp = client({
    service: "chat.jabb.im",
    domain: "jabbim.com",
    username: "learn",
    password: "123456",
});

xmpp.on("status", (status) => {
    console.debug(status);
});

xmpp.on("error", (err) => {
    console.error(err);
});

xmpp.on("offline", () => {
    console.log("offline");
});

xmpp.on("stanza", async (stanza) => {
    console.log(stanza.toString());
    if (stanza.is("message")) {
        //console.log(stanza);
        console.log("stanza.body: "+stanza.children["body"]);
        console.log("stanza.attrs.from: "+stanza.attrs.from);
        const { to, from } = stanza.attrs;
        xmpp.send(xml("message", { to: "hyg@jabbim.com", type: "chat" }, xml("body", null, "yes, i see.")));
        /* 
                const message = xml(
                    "message",
                    { type: "chat", to: "hyg@jabbim.com" },
                    xml("body", {}, "你好。"),
                );
                await xmpp.send(message); */
        //await xmpp.stop();
    }
});

xmpp.on("online", async (address) => {
    // Makes itself available
    console.log("online: " + address.toString());
    //await xmpp.send(xml("presence"));

    // Sends a chat message to itself
    /* const message = xml(
        "message",
        { type: "chat", to: "hyg@jabbim.com" },
        xml("body", {}, "hello world"),
    );
    await xmpp.send(message); */
    const presence = xml('presence', {},
        xml('show', {}, 'chat'),
        xml('status', {}, 'presence!'),
    )
    xmpp.send(presence)
});

xmpp.start().catch(console.error);