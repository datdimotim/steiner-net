const graphsLib = svgGraphsLib();

const graph = graphsLib.mkGraph({
    parentElementSelector: '#graph-root',
    onDrag: () => {
        evalAndShowNet();
    }
});

const graphExt = graphsLib.mkGraph({
    parentElementSelector: '#ext-graph-root',
    onDrag: () => {}
});

function evalAndShowNet() {
    const nodes = graph.getNodes().filter(n => !n.isFixed);
    const net = findOptimalSteinerNet(nodes);

    graphExt.drawGraph({
        nodes: [...net.optimalNet.vs.map(n => ({...n, isFixed: true})), ...nodes],
        edges: net.optimalNet.es.map(({from, to}) => ({from: from.id, to: to.id}))
    })

    document.getElementById("weight_label").innerText = `Weight: ${Math.floor(net.weight)}`
}

var vertexCount = 4;

function addVertex() {
    vertexCount++;
    main(vertexCount)
}

function removeVertex() {
    vertexCount--;
    if (vertexCount < 1) {
        vertexCount = 1
    }
    main(vertexCount)
}

main(vertexCount)

function benchmark() {
    const testData = [
        {"id": "A", "pos": {"x": 69.2520325203252, "y": 236.64634146341456}},
        {"id": "B", "pos": {"x": 48.47154471544715, "y": 651.1016260162601}},
        {"id": "C", "pos": {"x": 501.0243902439024, "y": 501.020325203252}},
        {"id": "D", "pos": {"x": 756.1626016260163, "y": 363.6382113821138}},
        {"id": "E", "pos": {"x": 863.5284552845529, "y": 793.1016260162602}},
        {"id": "F", "pos": {"x": 243.5772357723577, "y": 133.89837398373976}},
        //{"id": "G", "pos": {"x": 203.5772357723577, "y": 103.89837398373976}},
    ];

    const st = new Date();
    const net = findOptimalSteinerNet(testData);
    const fn = new Date();
    const time = fn - st;
    alert(`time: ${time}\ncount: ${net.count}\nweight: ${Math.floor(net.weight)}`)
}


function main(count) {
    const initVertexes = []
    for (let i = 0; i < count; i++) {
        initVertexes.push(String.fromCharCode(65 + i))
    }


    const nodes = initVertexes.map(v =>
        ({
            id: `id-${v}`,
            label: v,
            style: 'background: green',
            isFixed: false
        })
    );

    graph.drawGraph({nodes: nodes, edges: []})
    evalAndShowNet();
}




