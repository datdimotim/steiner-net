function svgGraphsLib (){
    const nodeSizePx = 50;

    mkCssClasses();

    function createUUID() {
        // http://www.ietf.org/rfc/rfc4122.txt
        var s = [];
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = "-";

        var uuid = s.join("");
        return uuid;
    }

    function getRootPaneDimensions(rootPane) {
        return {
            x: rootPane.width() - nodeSizePx,
            y: rootPane.height() - nodeSizePx
        }
    }

    function mkNode(node, bounds) {
        const x = node.pos?.x || Math.random() * bounds.x;
        const y = node.pos?.y || Math.random() * bounds.y;
        const style = node.style || '';
        return `<div id="${node.id}" class="point" style="left: ${x}px; top: ${y}px; ${style}"><div>${node.label || ''}</div></div>`;
    }

    function mkCssClasses() {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
            .rootPane {
              position: relative;
              overflow: hidden;
              height: 100%;
              width: 100%;
            }

            .svg{
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
            }

            .line{
              stroke-width:2px;
              stroke:rgb(0,0,0);
            }

            .point{
              width: ${nodeSizePx}px;
              height: ${nodeSizePx}px;
              border-radius: ${nodeSizePx}px;
              background: red;
              position: absolute;
              text-align: center;
              cursor: default;
              display: flex;
              justify-content: center;
              align-items: center;
             }
          `;
        document.getElementsByTagName('head')[0].appendChild(style);
    }

    function mkEdge({
                        from,
                        to
                    }) {
        return `<line id="${from}${to}" class="line"/>`
    }

    function redraw(edges) {
        edges.forEach(({
                           from,
                           to
                       }) => {
            const aEl = $(`#${from}`)
            const bEl = $(`#${to}`)
            const a = getCenter(aEl);
            const b = getCenter(bEl);
            const line = $(`#${from}${to}`)
            line.attr('x1', a.x).attr('y1', a.y).attr('x2', b.x).attr('y2', b.y);
        });
    }

    function getTop(el) {
        return parseInt(el.css('top'), 10);
    }

    function getLeft(el) {
        return parseInt(el.css('left'), 10);
    }

    function getCenter(el) {
        return {
            x: getLeft(el) + (el.width() / 2),
            y: getTop(el) + (el.height() / 2)
        }
    }

    function mkGraph({parentElementSelector, onDrag}) {
        const parentElement = $(parentElementSelector);

        if (!parentElement) { // TODO: now not working
            throw `parentElement not found by selector: ${parentElementSelector}`;
        }

        let userIdLibIdMap = {}
        let libIdUserIdMap = {}
        let nodes = [];
        let edges = [];

        drawGraph({nodes: nodes, edges: edges})

        function drawGraph(data) {
            userIdLibIdMap = {};
            libIdUserIdMap = {};
            data.nodes.forEach(n => {
                const uuid = createUUID();
                libIdUserIdMap[uuid] = n.id;
                userIdLibIdMap[n.id] = uuid;
            })

            nodes = data.nodes.map(n => ({...n, id: userIdLibIdMap[n.id]}));
            edges = data.edges.map(e => ({from: userIdLibIdMap[e.from], to: userIdLibIdMap[e.to]}))

            parentElement.empty();

            parentElement.append(`<div class="rootPane"></div>`)

            const rootPane = $(`${parentElementSelector} .rootPane`);

            const rootDimensions = getRootPaneDimensions(rootPane);

            rootPane.append(`
                <svg class="svg">
                    ${edges.map(mkEdge).join('')}
                </svg>
                ${nodes.map(n => mkNode(n, rootDimensions)).join('')}
            `)

            nodes.filter(n => !n.isFixed).forEach(setNodeDraggable)
            redraw(edges);

            function setNodeDraggable(node) {
                const el = $(`#${node.id}`)
                el.draggable({
                    drag: dragListener,
                    start: dragListener,
                    stop: dragListener
                });
            }

            function dragListener() {
                redraw(edges);
                onDrag()
            }

        }

        return {
            getNodes: () =>
                nodes.map(n => {
                        const el = $(`#${n.id}`)
                        return {
                            ...n, pos: {
                                x: getLeft(el),
                                y: getTop(el)
                            },
                            id: libIdUserIdMap[n.id]
                        }
                    }
                ),
            drawGraph: drawGraph
        }
    }

    return {
        mkGraph: mkGraph
    }
}