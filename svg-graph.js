function svgGraphsLib() {
    const nodeSizePx = 50;

    const css = mkCssClasses();

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
            x: rootPane.clientWidth - nodeSizePx,
            y: rootPane.clientHeight - nodeSizePx
        }
    }

    function mkNode(node, bounds) {
        const x = isNaN(node.pos?.x) ? Math.random() * bounds.x : node.pos?.x
        const y = isNaN(node.pos?.y) ? Math.random() * bounds.y : node.pos?.y
        const style = node.style || '';
        return `<div id="${node.id}" class="${css.point}" style="left: ${x}px; top: ${y}px; ${style}"><div>${node.label || ''}</div></div>`;
    }

    function mkCssClasses() {
        const styleSuff = createUUID();
        const classes = {
            rootPane: `rootPane-${styleSuff}`,
            svg: `svg-${styleSuff}`,
            line: `line-${styleSuff}`,
            point: `point-${styleSuff}`
        }
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
            .${classes.rootPane} {
              position: relative;
              overflow: hidden;
              height: 100%;
              width: 100%;
            }

            .${classes.svg} {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
            }

            .${classes.line} {
              stroke-width:2px;
              stroke:rgb(0,0,0);
            }

            .${classes.point} {
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
        return classes;
    }

    function mkEdge({
                        from,
                        to
                    }) {
        return `<line id="${from}${to}" class="${css.line}"/>`
    }

    function redraw(edges) {
        edges.forEach(({
                           from,
                           to
                       }) => {
            const aEl = document.getElementById(from)
            const bEl = document.getElementById(to)
            const a = getCenter(aEl);
            const b = getCenter(bEl);
            const line = document.getElementById(`${from}${to}`)
            line.setAttribute("x1", a.x)
            line.setAttribute("y1", a.y)
            line.setAttribute("x2", b.x)
            line.setAttribute("y2", b.y)
        });
    }

    function getTop(el) {
        return parseInt(el.style.top, 10);
    }

    function getLeft(el) {
        return parseInt(el.style.left, 10);
    }

    function getCenter(el) {
        return {
            x: getLeft(el) + (parseFloat(window.getComputedStyle(el).width) / 2),
            y: getTop(el) + (parseFloat(window.getComputedStyle(el).height) / 2)
        }
    }

    function mkGraph({parentElementSelector, onDrag}) {
        const parentElement = document.querySelector(parentElementSelector);

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

            parentElement.innerHTML = `<div class="${css.rootPane}"></div>`

            const rootPane = document.querySelector(`${parentElementSelector} .${css.rootPane}`);

            const rootDimensions = getRootPaneDimensions(rootPane);

            rootPane.innerHTML = `
                <svg class="${css.svg}">
                    ${edges.map(mkEdge).join('')}
                </svg>
                ${nodes.map(n => mkNode(n, rootDimensions)).join('')}
            `

            nodes.filter(n => !n.isFixed).forEach(setNodeDraggable)
            redraw(edges);

            function setNodeDraggable(node) {
                const el = document.getElementById(node.id)
                dragElement(el, rootPane, dragListener)
            }

            function dragListener() {
                redraw(edges);
                onDrag()
            }

        }

        return {
            getNodes: () =>
                nodes.map(n => {
                        const el = document.getElementById(n.id)
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

    function dragElement(elmnt, root, listener) {
        let deffered = null;
        elmnt.onmousedown = dragMouseDown;
        elmnt.ontouchstart = dragMouseDown;
        let dx = 0
        let dy = 0

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();

            let ex;
            let ey;
            if (e.type === "touchstart") {
                ex = e.touches[0].clientX
                ey = e.touches[0].clientY
            } else {
                ex = e.clientX
                ey = e.clientY
            }

            dx = ex - parseFloat(elmnt.style.left);
            dy = ey - parseFloat(elmnt.style.top);

            root.onmouseup = closeDragElement;
            root.ontouchend = closeDragElement;
            root.onmousemove = elementDrag;
            root.ontouchmove = elementDrag;

        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();

            let ex;
            let ey;

            if (e.type === "touchmove") {
                ex = e.touches[0].clientX;
                ey = e.touches[0].clientY;
            } else {
                ex = e.clientX;
                ey = e.clientY;
            }

            const x = ex - dx;
            const y = ey - dy;

            clearTimeout(deffered)
            deffered = setTimeout(() => {
                elmnt.style.top = y + "px";
                elmnt.style.left = x + "px";
                listener();
            }, 0)
        }

        function closeDragElement() {
            root.onmouseup = null;
            root.ontouchend = null;
            root.onmousemove = null;
            root.ontouchmove = null;
        }
    }
}
