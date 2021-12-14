var vertexCount = 4;

function addVertex() {
    clearAll();
    vertexCount++;
    main(vertexCount)
}

function removeVertex() {
    clearAll();
    vertexCount--;
    if (vertexCount < 1) {
        vertexCount = 1
    }
    main(vertexCount)
}

const cy = cytoscape({
    container: document.getElementById('cy'),

    layout: {
        name: 'random',
        padding: 10
    },

    style: cytoscape.stylesheet()
        .selector('node')
        .css({
            //'shape': 'data(faveShape)',
            //'width': 'mapData(40, 40, 80, 20, 60)',
            'content': 'data(name)',
            'text-valign': 'center',
            'text-outline-width': 2,
            'text-outline-color': 'data(faveColor)',
            'background-color': 'data(faveColor)',
            'color': '#fff'
        })

        .selector(':selected')
        .css({
            'border-width': 3,
            'border-color': '#333'
        })

        .selector('edge')
        .css({
            // 'curve-style': 'bezier',
            'opacity': 0.666,
            'width': 'mapData(strength, 70, 100, 2, 6)',
            'target-arrow-shape': 'triangle',
            'source-arrow-shape': 'circle',
            'line-color': 'data(faveColor)',
            'source-arrow-color': 'data(faveColor)',
            'target-arrow-color': 'data(faveColor)',
            'content': 'data(label)'
        })
        .selector('edge.questionable')
        .css({
            'line-style': 'dotted',
            'target-arrow-shape': 'diamond'
        })
        .selector('.faded')
        .css({
            'opacity': 0.25,
            'text-opacity': 0
        }),

    elements: {
        nodes: [],
        edges: []
    },

    ready: function () {
        window.cy = this;
    }
});


const mkVert = i => ({
    data: {
        id: i,
        name: i,
        faveColor: '#00FF00',
        isMain: true
    }
})

const mkVertExt = i => ({
    data: {
        id: i.id,
        name: '', //i.id,
        faveColor: '#444444',
        isMain: false
    },
    renderedPosition: {
        x: i.pos.x,
        y: i.pos.y
    }
})

const mkEdge = (a, b, label) => ({
    data: {
        source: a,
        target: b,
        faveColor: '#6FB1FC',
        strength: 90,
        label: label
    }
})


const drawGraph = (vs) => {
    vs.forEach(v => {
        cy.add(mkVert(v))
    })

    const layout = cy.layout({
        name: 'random'
    });

    layout.run();
}

const drawExt = (vs, es) => {
    vs.forEach(v => {
        cy.add(mkVertExt(v))
    })
    es.forEach(e => {
        const dx = e.from.pos.x - e.to.pos.x;
        const dy = e.from.pos.y - e.to.pos.y;
        const w = Math.sqrt(dx*dx+dy*dy)
        cy.add(mkEdge(e.from.id, e.to.id, Math.floor(w)))
    })
    cy.elements('node[!isMain]').lock()
}


const clearComputedElements = () => {
    cy.remove(cy.elements('node[!isMain]'));
    cy.remove(cy.elements('edge'));
}

function clearAll() {
    cy.remove(cy.elements('node'));
    cy.remove(cy.elements('edge'));
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

    drawGraph(initVertexes)

    cy.nodes().on('drag', () => drawSteinerNet());
    drawSteinerNet();
}

function drawSteinerNet() {
    clearComputedElements();
    const positions = cy.elements('node[isMain]').map(v => ({
        id: v.id(),
        pos: v.renderedPosition()
    }))

    const opt = findOptimalSteinerNet(positions);

    drawExt(opt.optimalNet.vs, opt.optimalNet.es);

    document.getElementById("weight_label").innerText = `Weight: ${Math.floor(opt.weight)}`
}