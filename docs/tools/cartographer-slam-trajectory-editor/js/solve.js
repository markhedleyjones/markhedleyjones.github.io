// Submap pose-graph optimiser, ported from optimise.py. Builds submap<->submap relative
// edges from the pbstream constraints (stiffness = shared-node count, an elastic model),
// then a Levenberg-Marquardt least-squares solve with the pinned submaps hard-fixed and a
// weak anchor to the current poses. No scipy: a small dense LM with a finite-difference
// Jacobian and Gaussian-elimination normal-equation solve (problem is ~3xN small).
const Solve = (() => {
  const wrap = (a) => {
    a = (a + Math.PI) % (2 * Math.PI);
    if (a < 0) a += 2 * Math.PI;
    return a - Math.PI;
  };
  const inv = (p) => {
    const c = Math.cos(p[2]),
      s = Math.sin(p[2]);
    return [-(c * p[0] + s * p[1]), s * p[0] - c * p[1], -p[2]];
  };
  const compose = (a, b) => {
    const c = Math.cos(a[2]),
      s = Math.sin(a[2]);
    return [a[0] + c * b[0] - s * b[1], a[1] + s * b[0] + c * b[1], wrap(a[2] + b[2])];
  };

  // constraints: [{si, ni, rel:{x,y,yaw}, tw, tag}]. Returns [{s1,s2,dx,dy,dth,w}] (w = count).
  function buildEdges(constraints) {
    const byNode = {};
    for (const c of constraints) {
      if (!c.rel) continue;
      if (!byNode[c.ni]) byNode[c.ni] = [];
      byNode[c.ni].push([c.si, [c.rel.x, c.rel.y, c.rel.yaw], Math.max(c.tw, 1e-6)]);
    }
    const agg = {}; // "a,b" -> [sdx, sdy, ssin, scos, sw, count]
    for (const k in byNode) {
      const items = byNode[k];
      for (let i = 0; i < items.length; i++)
        for (let j = i + 1; j < items.length; j++) {
          const [sa, Ta, wa] = items[i],
            [sb, Tb, wb] = items[j];
          if (sa === sb) continue;
          const a = Math.min(sa, sb),
            b = Math.max(sa, sb);
          const Trel = sa < sb ? compose(Ta, inv(Tb)) : compose(Tb, inv(Ta));
          const w = Math.min(wa, wb),
            key = `${a},${b}`;
          if (!agg[key]) agg[key] = [0, 0, 0, 0, 0, 0];
          const e = agg[key];
          e[0] += Trel[0] * w;
          e[1] += Trel[1] * w;
          e[2] += Math.sin(Trel[2]) * w;
          e[3] += Math.cos(Trel[2]) * w;
          e[4] += w;
          e[5] += 1;
        }
    }
    const edges = [];
    for (const key in agg) {
      const [sdx, sdy, ssin, scos, sw, count] = agg[key],
        [a, b] = key.split(",").map(Number);
      edges.push({
        s1: a,
        s2: b,
        dx: sdx / sw,
        dy: sdy / sw,
        dth: Math.atan2(ssin, scos),
        w: count,
      });
    }
    return edges;
  }

  // poses: [[x,y,yaw],...] by index (current on-screen). pinned: Set of fixed indices.
  // Returns {poses, rmsBefore, rmsAfter}. Pinned poses are held exactly.
  function solve(poses, edges, pinned, opts = {}) {
    const edgeW = opts.edgeW ?? 1,
      anchorW = opts.anchorW ?? 1e-3,
      maxIter = opts.maxIter ?? 60;
    const N = poses.length,
      init = poses.map((p) => p.slice());
    const free = [];
    for (let i = 0; i < N; i++) if (!pinned.has(i)) free.push(i);
    const slot = {};
    free.forEach((idx, k) => {
      slot[idx] = k;
    });
    const nv = free.length * 3;
    const esw = edges.map((e) => Math.sqrt(e.w * edgeW)),
      asw = Math.sqrt(anchorW);

    const x = new Float64Array(nv);
    free.forEach((idx, k) => {
      x[3 * k] = init[idx][0];
      x[3 * k + 1] = init[idx][1];
      x[3 * k + 2] = init[idx][2];
    });

    const pose = (i, X) =>
      pinned.has(i) ? init[i] : [X[3 * slot[i]], X[3 * slot[i] + 1], X[3 * slot[i] + 2]];
    function residual(X) {
      const r = new Float64Array(edges.length * 3 + free.length * 3);
      let m = 0;
      for (let e = 0; e < edges.length; e++) {
        const ed = edges[e],
          a = pose(ed.s1, X),
          b = pose(ed.s2, X);
        const ca = Math.cos(a[2]),
          sa = Math.sin(a[2]),
          wdx = b[0] - a[0],
          wdy = b[1] - a[1];
        r[m++] = (ca * wdx + sa * wdy - ed.dx) * esw[e];
        r[m++] = (-sa * wdx + ca * wdy - ed.dy) * esw[e];
        r[m++] = wrap(wrap(b[2] - a[2]) - ed.dth) * esw[e];
      }
      for (let k = 0; k < free.length; k++) {
        const i = free[k];
        r[m++] = (X[3 * k] - init[i][0]) * asw;
        r[m++] = (X[3 * k + 1] - init[i][1]) * asw;
        r[m++] = wrap(X[3 * k + 2] - init[i][2]) * asw;
      }
      return r;
    }
    const rms = (r) => {
      let s = 0;
      for (let i = 0; i < r.length; i++) s += r[i] * r[i];
      return Math.sqrt(s / r.length);
    };
    const r0 = rms(residual(x));

    if (nv > 0) {
      let lambda = 1e-3;
      let r = residual(x),
        cost = dot(r, r);
      for (let it = 0; it < maxIter; it++) {
        // finite-difference Jacobian (columns = variables)
        const nr = r.length,
          J = [];
        for (let c = 0; c < nv; c++) {
          const h = 1e-6,
            save = x[c];
          x[c] = save + h;
          const rp = residual(x);
          x[c] = save;
          const col = new Float64Array(nr);
          for (let i = 0; i < nr; i++) col[i] = (rp[i] - r[i]) / h;
          J.push(col);
        }
        // normal equations A = JtJ (+ lambda diag), g = Jt r
        const A = [],
          g = new Float64Array(nv);
        for (let i = 0; i < nv; i++) {
          A.push(new Float64Array(nv));
        }
        for (let i = 0; i < nv; i++) {
          let gi = 0;
          const Ji = J[i];
          for (let k = 0; k < nr; k++) gi += Ji[k] * r[k];
          g[i] = gi;
          for (let j = i; j < nv; j++) {
            let s = 0;
            const Jj = J[j];
            for (let k = 0; k < nr; k++) s += Ji[k] * Jj[k];
            A[i][j] = s;
            A[j][i] = s;
          }
        }
        let improved = false;
        for (let tries = 0; tries < 6; tries++) {
          const M = A.map((row, i) => {
            const r2 = row.slice();
            r2[i] += lambda * (A[i][i] + 1e-12);
            return r2;
          });
          const dx = solveLinear(M, g);
          if (!dx) {
            lambda *= 10;
            continue;
          }
          const xn = x.slice();
          for (let i = 0; i < nv; i++) xn[i] -= dx[i];
          const rn = residual(xn),
            cn = dot(rn, rn);
          if (cn < cost) {
            for (let i = 0; i < nv; i++) x[i] = xn[i];
            r = rn;
            cost = cn;
            lambda = Math.max(lambda * 0.5, 1e-9);
            improved = true;
            break;
          }
          lambda *= 10;
        }
        if (!improved) break;
      }
    }
    const out = init.map((p) => p.slice());
    free.forEach((idx, k) => {
      out[idx] = [x[3 * k], x[3 * k + 1], x[3 * k + 2]];
    });
    return { poses: out, rmsBefore: r0, rmsAfter: rms(residual(x)) };
  }

  const dot = (a, b) => {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
  };
  // Solve A x = b for symmetric A via Gaussian elimination with partial pivoting.
  function solveLinear(A, b) {
    const n = b.length,
      M = A.map((r) => Float64Array.from(r)),
      y = Float64Array.from(b);
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      if (Math.abs(M[piv][c]) < 1e-14) return null;
      if (piv !== c) {
        [M[piv], M[c]] = [M[c], M[piv]];
        [y[piv], y[c]] = [y[c], y[piv]];
      }
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = M[r][c] / M[c][c];
        if (!f) continue;
        for (let k = c; k < n; k++) M[r][k] -= f * M[c][k];
        y[r] -= f * y[c];
      }
    }
    const x = new Float64Array(n);
    for (let i = 0; i < n; i++) x[i] = y[i] / M[i][i];
    return x;
  }

  return { buildEdges, solve, wrap, inv, compose };
})();

if (typeof module !== "undefined" && module.exports) module.exports = Solve;
