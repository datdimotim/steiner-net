const alg0 = require('./alg0')
const alg = require('./alg')
const tests = require('./testData.json')



for (let i = 0; i < tests.length; i++) {
    if (!compare(tests[i])) {
        console.log(`fail: ${i}`)
        break;
    } else {
        console.log(`success: ${i}`)
    }
}

function compare(testData) {
    const w0 = alg0.findOptimalSteinerNet(testData).weight;
    const w = alg.findOptimalSteinerNet(testData).weight;

    return Math.abs(w0 - w) < 0.001
}