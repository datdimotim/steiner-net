function findOptimalSteinerNet(positions) {
    const slns = steiner(positions);
    return slns.reduce((acc, s) => {
        const w = evalWeigth(s);

        if (!acc || acc.w > w) {
            return {
                s: s,
                w: w
            }
        } else {
            return acc
        }
    }, null)
}

const select1 = ls => {
    const res = []
    for (let i = 0; i < ls.length; i++) {
        const cp = [...ls];
        cp.splice(i, 1)
        res.push({
            selected: ls[i],
            other: cp
        })
    }
    return res;
}

const select2 = ls => {
    const res = []
    for (let i = 0; i < ls.length; i++) {
        for (let j = i; j < ls.length - 1; j++) {
            const cp = [...ls];
            cp.splice(i, 1)
            cp.splice(j, 1)
            res.push({
                s1: ls[i],
                s2: ls[j + 1],
                other: cp
            })
        }
    }
    return res;
}

const getVertEdges = (v, net) => {
    return net.es.filter(e => e.from.id === v.id || e.to.id === v.id)
}

const isAddable = (cur, v, net) => {
    const es = getVertEdges(v, net)
    if (es.length > 2) return false;

    return true;
}

function evalWeigth(net) {
    return net.es.map(e => {
        const dx = e.from.pos.x - e.to.pos.x
        const dy = e.from.pos.y - e.to.pos.y
        return Math.sqrt(dx * dx + dy * dy)
    })
        .reduce((a, i) => a + i, 0)
}

function genTriangles(a, b) {
    const x = b.pos.x - a.pos.x
    const y = b.pos.y - a.pos.y

    return [{
        id: a.id + "-" + b.id + "-1",
        pos: {
            x: a.pos.x + Math.cos(Math.PI / 3) * x - Math.sin(Math.PI / 3) * y,
            y: a.pos.y + Math.sin(Math.PI / 3) * x + Math.cos(Math.PI / 3) * y
        }
    },
        {
            id: a.id + "-" + b.id + "-2",
            pos: {
                x: a.pos.x + Math.cos(-Math.PI / 3) * x - Math.sin(-Math.PI / 3) * y,
                y: a.pos.y + Math.sin(-Math.PI / 3) * x + Math.cos(-Math.PI / 3) * y
            }
        }
    ]
}

const genExtVertex = (s1, s2, m, k) => {

    const sx = (s1.pos.x + s2.pos.x + m.pos.x) / 3
    const sy = (s1.pos.y + s2.pos.y + m.pos.y) / 3

    const mcx = m.pos.x - sx
    const mcy = m.pos.y - sy

    const rsq = mcx * mcx + mcy * mcy


    const kcx = k.pos.x - sx
    const kcy = k.pos.y - sy

    const dx = kcx - mcx;
    const dy = kcy - mcy

    const t = -2 * (dx * mcx + dy * mcy) / (dx * dx + dy * dy)

    if (t > 1 || t < 0) return []

    const ecx = dx * t + mcx
    const ecy = dy * t + mcy

    const ex = ecx + sx
    const ey = ecy + sy

    return [{
        id: "(" + s1.id + ") - (" + s2.id + ") -> (" + k.id + ")",
        pos: {
            x: ex,
            y: ey
        }
    }]

}

function steiner(positions) {
    if (positions.length <= 1) {
        return [{
            vs: [],
            es: []
        }]
    }
    if (positions.length === 2) {
        return [{
            vs: [],
            es: [{
                from: positions[0],
                to: positions[1]
            }]
        }]
    }

    const fstVars = select1(positions)
        .flatMap(s => {
            const cur = s.selected;
            const vs = s.other;

            return steiner(vs).flatMap(solution => {
                return vs.filter(v => isAddable(cur, v, solution))
                    .map(v => ({
                        vs: solution.vs,
                        es: [...solution.es, {
                            from: cur,
                            to: v
                        }]
                    }));
            })
        });


    const sndVars = select2(positions)
        .flatMap(s => {
            const s1 = s.s1;
            const s2 = s.s2;
            const vs = s.other


            return genTriangles(s1, s2).flatMap(m => {
                return steiner([...vs, m]).flatMap(solution => {
                    return [...vs, ...solution.vs].flatMap(k => {
                        return genExtVertex(s1, s2, m, k).map(ext => {

                            return {
                                vs: [
                                    ext,
                                    ...solution.vs
                                ],
                                es: [{
                                    from: s1,
                                    to: ext
                                },
                                    {
                                        from: s2,
                                        to: ext
                                    },
                                    ...solution.es.map(e => {
                                        if (e.from.id === m.id) {
                                            return {
                                                from: ext,
                                                to: e.to
                                            }
                                        }
                                        if (e.to.id === m.id) {
                                            return {
                                                from: e.from,
                                                to: ext
                                            }
                                        }
                                        return e
                                    })
                                ]
                            }
                        })
                    })
                })
            })

        })

    return [...fstVars, ...sndVars];
}

module.exports = {findOptimalSteinerNet}