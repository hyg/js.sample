const brain = require("./brain.js");

exsample1();
exsample2();
exsample3();
exsample4();

function exsample1() {
    // provide optional config object (or undefined). Defaults shown.
    const config = {
        binaryThresh: 0.5,
        hiddenLayers: [3], // array of ints for the sizes of the hidden layers in the network
        activation: 'sigmoid', // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
        leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
    };

    // create a simple feed-forward neural network with backpropagation
    const net = new brain.NeuralNetwork(config);

    net.train([
        { input: [0, 0], output: [0] },
        { input: [0, 1], output: [1] },
        { input: [1, 0], output: [1] },
        { input: [1, 1], output: [0] },
    ]);

    const output = net.run([1, 0]); // [0.987]
    console.log("net.run([1, 0]):", output);
}

function exsample2() {
    // provide optional config object, defaults shown.
    const config = {
        inputSize: 20,
        inputRange: 20,
        hiddenLayers: [20, 20],
        outputSize: 20,
        learningRate: 0.01,
        decayRate: 0.999,
    };

    // create a simple recurrent neural network
    const net = new brain.recurrent.RNN(config);

    net.train([
        { input: [0, 0], output: [0] },
        { input: [0, 1], output: [1] },
        { input: [1, 0], output: [1] },
        { input: [1, 1], output: [0] },
    ]);

    let output = net.run([0, 0]); // [0]
    output = net.run([0, 1]); // [1]
    console.log("net.run([0, 1]):", output);
    output = net.run([1, 0]); // [1]
    console.log("net.run([1, 0]):", output);
    output = net.run([1, 1]); // [0]
    console.log("net.run([1, 1]):", output);
}

function exsample3() {
    const net = new brain.NeuralNetwork();

    net.train([
        { input: { r: 0.03, g: 0.7, b: 0.5 }, output: { black: 1 } },
        { input: { r: 0.16, g: 0.09, b: 0.2 }, output: { white: 1 } },
        { input: { r: 0.5, g: 0.5, b: 1.0 }, output: { white: 1 } },
    ]);

    const output = net.run({ r: 1, g: 0.4, b: 0 }); // { white: 0.99, black: 0.002 }
    console.log("net.run({ r: 1, g: 0.4, b: 0 }):", output);
}

function exsample4() {
    const net = new brain.NeuralNetwork();
    net.train([
        { input: { r: 0.03, g: 0.7 }, output: { black: 1 } },
        { input: { r: 0.16, b: 0.2 }, output: { white: 1 } },
        { input: { r: 0.5, g: 0.5, b: 1.0 }, output: { white: 1 } },
    ]);

    const output = net.run({ r: 1, g: 0.4, b: 0 }); // { white: 0.81, black: 0.18 }
    console.log("net.run({ r: 1, g: 0.4, b: 0 }):", output);
}