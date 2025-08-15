// index.js serves as the main entry point. It sets up the global registry and runs tests.

// Initialize the global clause registry
global.globalClauseRegistry = {};

// Run the main test script
require('./generateMainTest');

// Run the four-level nested test script
require('./generateNestedTest');