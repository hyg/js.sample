const natUpnp = require("@runonflux/nat-upnp");

async function testUpnp() {
  console.log("Starting UPnP test...\n");

  try {
    // Create a new UPnP client
    const client = new natUpnp.Client();
    console.log("✓ UPnP client created successfully\n");

    // Get public IP address
    console.log("Getting public IP address...");
    const publicIp = await client.getPublicIp();
    console.log(`✓ Public IP: ${publicIp}\n`);

    // Get existing mappings
    console.log("Getting existing port mappings...");
    const mappings = await client.getMappings();
    console.log(`✓ Found ${mappings.length} existing mappings`);
    if (mappings.length > 0) {
      console.log("Existing mappings:");
      mappings.forEach((mapping, index) => {
        console.log(`  ${index + 1}. ${mapping.description || 'No description'} - Public: ${mapping.public.port} -> Private: ${mapping.private.port} (${mapping.protocol})`);
      });
    }
    console.log();

    // Create a new port mapping
    console.log("Creating a test port mapping...");
    const testPort = 12345;
    await client.createMapping({
      public: testPort,
      private: testPort,
      ttl: 3600, // 1 hour
      description: "UPnP Test Mapping",
      protocol: "TCP"
    });
    console.log(`✓ Successfully created mapping: Public ${testPort} -> Private ${testPort} (TCP)\n`);

    // Verify the mapping was created
    console.log("Verifying the new mapping...");
    const updatedMappings = await client.getMappings();
    const newMapping = updatedMappings.find(
      mapping => mapping.public.port === testPort
    );
    if (newMapping) {
      console.log("✓ Mapping verified successfully\n");
    } else {
      console.log("✗ Could not verify the new mapping\n");
    }

    // Remove the test mapping
    console.log("Removing the test mapping...");
    await client.removeMapping({
      public: testPort,
      protocol: "TCP"
    });
    console.log("✓ Test mapping removed successfully\n");

    // Close the client
    client.close();
    console.log("✓ UPnP client closed");

  } catch (error) {
    console.error("✗ UPnP test failed:", error.message);
    
    // Try to provide more specific error information
    if (error.message.includes("EHOSTUNREACH")) {
      console.error("  Router may not be reachable or UPnP is not enabled");
    } else if (error.message.includes("ECONNREFUSED")) {
      console.error("  UPnP service may not be running on the router");
    } else if (error.message.includes("timeout")) {
      console.error("  UPnP request timed out - router may not support UPnP");
    }
  }

  console.log("\nUPnP test completed.");
}

// Run the test
testUpnp();