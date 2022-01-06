const alg = require('./alg')
const tests = require('./testData.json')

for (let i = 0; i < tests.length; i++) {
    if (!check(tests[i])) {
        console.log(`fail: ${i}`)
        break;
    } else {
        console.log(`success: ${i}`)
    }
}

function check(testData) {
    const w = alg.findOptimalSteinerNet(testData.vertexes).weight;
    return Math.abs(testData.weight - w) < 0.001
}