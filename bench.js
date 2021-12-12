const alg0 = require('./alg0')
const alg = require('./alg')
const tests = require('./testData.json')

const testData = [
    {"id": "A", "pos": {"x": 69.2520325203252, "y": 236.64634146341456}},
    {"id": "B", "pos": {"x": 48.47154471544715, "y": 651.1016260162601}},
    {"id": "C", "pos": {"x": 501.0243902439024, "y": 501.020325203252}},
    {"id": "D", "pos": {"x": 756.1626016260163, "y": 363.6382113821138}},
    {"id": "E", "pos": {"x": 863.5284552845529, "y": 793.1016260162602}},
    {"id": "F", "pos": {"x": 243.5772357723577, "y": 133.89837398373976}},
];

for (let i = 0; i < tests.length; i++) {
    if (!compare(tests[i])) {
        console.log(`fail: ${i}`)
        break;
    } else {
        console.log(`success: ${i}`)
    }
}

function compare(testData) {
    const w0 = alg0.findOptimalSteinerNet(testData).w;
    const w = alg.findOptimalSteinerNet(testData).weight;

    return Math.abs(w0 - w) < 0.001
}

function benchmark(testData) {
    const st = new Date();
    const net = alg0.findOptimalSteinerNet(testData);
    const fn = new Date();
    const time = fn - st;
    console.log(`time: ${time}\ncount: ${net.count}\nweight: ${Math.floor(net.weight)}\ndoubles: ${net.doubles}`)
}