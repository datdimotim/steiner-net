
function reduceOptNet(nets) {
  return nets.reduce((acc, s) => {
    const w = evalWeigth(s);

    if (!acc || acc.weight > w) {
      return {
        optimalNet: s,
        weight: w,
      }
    } else {
      return acc
    }
  }, null)
}

function findOptimalSteinerNet(positions) {
  const slns = steiner(positions);
  if (slns.length === 0) return null;
  const res = reduceOptNet(slns)
  res.count = slns.length;
  //res.doubles = slns.filter(s => Math.floor(evalWeigth(s)) === Math.floor(res.weight)).length
  return res;
}

function select1(ls) {
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

function select2(ls) {
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

function getVertEdges(v, net) {
  return net.es.filter(e => e.from.id === v.id || e.to.id === v.id)
}

function cosEdgesAngle(a, b) {
  const ax = a.to.pos.x - a.from.pos.x;
  const ay = a.to.pos.y - a.from.pos.y;

  const bx = b.to.pos.x - b.from.pos.x;
  const by = b.to.pos.y - b.from.pos.y;

  return (ax * bx + ay * by) / Math.sqrt((ax * ax + ay * ay) * (bx * bx + by * by))
}

function normEdgeDir(e, vFrom) {
  if (e.from.id === vFrom.id) {
    return e;
  } else {
    return {from: e.to, to: e.from}
  }
}

function isAddable(cur, v, net) {
  if (v.isFictive) return false;
  const es = getVertEdges(v, net)
  if (es.length > 2) return false;

  const curEdge = {from: v, to: cur}

  return !es.some(e => cosEdgesAngle(curEdge, normEdgeDir(e, v)) > -1 / 2 + 0.001)
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
    },
    isFictive: true
  },
    {
      id: a.id + "-" + b.id + "-2",
      pos: {
        x: a.pos.x + Math.cos(-Math.PI / 3) * x - Math.sin(-Math.PI / 3) * y,
        y: a.pos.y + Math.sin(-Math.PI / 3) * x + Math.cos(-Math.PI / 3) * y
      },
      isFictive: true
    }
  ]
}

function genExtVertex(s1, s2, m, k) {

  const sx = (s1.pos.x + s2.pos.x + m.pos.x) / 3
  const sy = (s1.pos.y + s2.pos.y + m.pos.y) / 3

  const mcx = m.pos.x - sx
  const mcy = m.pos.y - sy

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
    pos: {x: ex, y: ey},
    isFictive: true
  }]

}

function distSquare(a, b) {
  const dx = b.pos.x - a.pos.x;
  const dy = b.pos.y - a.pos.y;
  return dx * dx + dy * dy;
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

      const closest = vs.reduce((acc, i) => {
        if (!acc) {
          return i;
        }
        const distOld = distSquare(acc, cur);
        const distCur = distSquare(i, cur)
        return distCur < distOld ? i : acc
      }, null)

      const optNet = findOptimalSteinerNet(vs)?.optimalNet;
      if (!optNet) return []

      if (!isAddable(cur, closest, optNet)) return []

      return [{
        vs: optNet.vs,
        es: [...optNet.es, {from: cur, to: closest}]
      }]
    });


  const sndVars = select2(positions)
    .flatMap(s => {
      const s1 = s.s1;
      const s2 = s.s2;
      const vs = s.other

      return genTriangles(s1, s2).flatMap(m => {
        const subNet = findOptimalSteinerNet([...vs, m])?.optimalNet;
        if (!subNet) return []
        return getBackVertexPair(subNet, m, s1, s2)
      })
    })

  return [...fstVars, ...sndVars];
}

function getBackVertexPair(solution, m, s1, s2) {
    const es = getVertEdges(m, solution)

    if (es.length !== 1) {
      return []
    }

    const k = es[0].from.id !== m.id ? es[0].from : es[0].to

    return genExtVertex(s1, s2, m, k)
        .filter(ext => {
          const a1 = {from: ext, to: s1}
          const a2 = {from: ext, to: s2}
          const c = {from: ext, to: k}
          return cosEdgesAngle(a1, a2) < 0 && cosEdgesAngle(a1, c) < 0
        })
        .map(ext => {
          return {
            vs: [ext, ...solution.vs],
            es: [
              {from: s1, to: ext},
              {from: s2, to: ext},
              ...solution.es.map(e => {
                if (e.from.id === m.id) {
                  return {from: ext, to: e.to}
                }
                if (e.to.id === m.id) {
                  return {from: e.from, to: ext}
                }
                return e
              })
            ]
          }
        })
}

module.exports = {findOptimalSteinerNet}