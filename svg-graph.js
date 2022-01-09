const nodeSizePx = 50;

mkCssClasses();

function mkGraph({
                     parentElementSelector,
                     nodes,
                     edges,
                 }) {
    const parentElement = $(parentElementSelector);
    if (!parentElement) {
        throw `parentElement not found by selector: ${parentElementSelector}`;
    }

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

    //////// END ////////////

    function setNodeDraggable(node) {
        const el = $(`#${node.id}`)
        el.draggable({
            drag: dragListener
        });
    }

    function dragListener() {
        redraw(edges);
    }

    return {
        clear: () => {
            parentElement.empty();
        },
        getNodes: () =>
            nodes.map(n => {
                    const el = $(`#${n.id}`)
                    return {
                        ...n, pos: {
                            x: el.css('left'),
                            y: el.css('top')
                        }
                    }
                }
            )

    }
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
    return `<div id="${node.id}" class="point" style="left: ${x}px; top: ${y}px; ${style}"><div>${node.label}</div></div>`;
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