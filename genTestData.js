var fs = require('fs');

gen1000();

function getTest() {
    return [
        {"id": "A", "pos": {"x": Math.random() * 1000, "y": Math.random() * 1000}},
        {"id": "B", "pos": {"x": Math.random() * 1000, "y": Math.random() * 1000}},
        {"id": "C", "pos": {"x": Math.random() * 1000, "y": Math.random() * 1000}},
        {"id": "D", "pos": {"x": Math.random() * 1000, "y": Math.random() * 1000}},
        {"id": "E", "pos": {"x": Math.random() * 1000, "y": Math.random() * 1000}},
        {"id": "F", "pos": {"x": Math.random() * 1000, "y": Math.random() * 1000}}
    ]
}

function gen1000() {
    const arr = []
    for (let i = 0; i < 1000; i++) {
        arr.push(getTest())
    }
    fs.writeFile ("testData.json", JSON.stringify(arr), function(err) {
            if (err) throw err;
            console.log('complete');
        }
    );
}