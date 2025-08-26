// using ES modules
//import { Client } from "@runonflux/nat-upnp";
//const client = new Client();

// using node require
const natUpnp = require("@runonflux/nat-upnp");
const client = new natUpnp.Client();

client
  .createMapping({
    public: 12345,
    private: 54321,
    ttl: 10,
  })
  .then(() => {
    // Will be called once finished
    console.log("finish");
  })
  .catch(() => {
    // Will be called on error
    console.log("error");
  });

/* async () => {
  await client.removeMapping({
    public: 12345,
  });
}; */

console.log(client.getMappings());

/* client.getMappings({
  local: true,
  description: "both of these fields are optional",
});
 */
console.log(client.getPublicIp());