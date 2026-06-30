// Cartographer pbstream schema knowledge, in terms of field numbers (from the .proto
// definitions). Reads submap occupancy grids + global poses for rendering, and rewrites
// the pose graph's submap/node poses for export. Depends on proto.js.
//
// Field numbers used (message: field=number):
//   SerializedData:  pose_graph=1, submap=3, node=4
//   PoseGraph:       constraint=2, trajectory=4
//   PoseGraph.Constraint: submap_id=1, node_id=2, relative_pose=3, tag=5, translation_weight=6
//   SubmapId/NodeId: submap_index=2 / node_index=2
//   Trajectory:      node=1, submap=2
//   Trajectory.Node:    timestamp=1, pose=5, node_index=7
//   Trajectory.Submap:  pose=1, submap_index=2
//   Rigid3d:  translation=1, rotation=2 ; Vector3d/Quaterniond components are doubles
//   Submap:   submap_id=1, submap_2d=2
//   Submap2D: local_pose=1, grid=4
//   Grid2D:   limits=1, cells=2 (packed int32), min/max_correspondence_cost=6/7 (float)
//   MapLimits: resolution=1, max=2 (Vector2d x=1,y=2), cell_limits=3 (num_x_cells=1, num_y_cells=2)
const Carto = (() => {
  const P = typeof Proto !== "undefined" ? Proto : require("./proto.js");

  const yawOf = (qx, qy, qz, qw) =>
    Math.atan2(2 * (qw * qz + qx * qy), 1 - 2 * (qy * qy + qz * qz));

  function readRigid3d(u8, vs, ve) {
    let tx = 0,
      ty = 0,
      tz = 0,
      qx = 0,
      qy = 0,
      qz = 0,
      qw = 0;
    P.walk(u8, vs, ve, (num, _wire, a, b) => {
      if (num === 1)
        P.walk(u8, a, b, (n, _w, c) => {
          const v = P.f64(u8, c);
          if (n === 1) tx = v;
          else if (n === 2) ty = v;
          else if (n === 3) tz = v;
        });
      else if (num === 2)
        P.walk(u8, a, b, (n, _w, c) => {
          const v = P.f64(u8, c);
          if (n === 1) qx = v;
          else if (n === 2) qy = v;
          else if (n === 3) qz = v;
          else if (n === 4) qw = v;
        });
    });
    return { x: tx, y: ty, z: tz, yaw: yawOf(qx, qy, qz, qw) };
  }

  function encodeRigid3d(x, y, z, yaw) {
    const t = new P.Writer();
    t.dblField(1, x);
    t.dblField(2, y);
    t.dblField(3, z);
    const r = new P.Writer();
    r.dblField(1, 0);
    r.dblField(2, 0);
    r.dblField(3, Math.sin(yaw / 2));
    r.dblField(4, Math.cos(yaw / 2));
    const o = new P.Writer();
    o.msgField(1, t.out());
    o.msgField(2, r.out());
    return o.out();
  }

  const firstFieldNum = (u8) => {
    const [tag] = P.readVarint(u8, 0);
    return Math.floor(tag / 8);
  };

  // --- pose graph parse (poses + constraints) ---
  function parseConstraint(u8, vs, ve) {
    let si = 0,
      ni = 0,
      rel = null,
      tw = 0,
      tag = 0; // proto3 omits zero indices
    P.walk(u8, vs, ve, (num, _wire, a, b) => {
      if (num === 1)
        P.walk(u8, a, b, (n, _w, c) => {
          if (n === 2) [si] = P.readVarint(u8, c);
        });
      else if (num === 2)
        P.walk(u8, a, b, (n, _w, c) => {
          if (n === 2) [ni] = P.readVarint(u8, c);
        });
      else if (num === 3) rel = readRigid3d(u8, a, b);
      else if (num === 5) [tag] = P.readVarint(u8, a);
      else if (num === 6) tw = P.f64(u8, a);
    });
    return { si, ni, rel, tw, tag };
  }
  function parseTrajectory(u8, vs, ve, submaps, nodes) {
    P.walk(u8, vs, ve, (num, _wire, a, b) => {
      if (num === 1) {
        // Node
        let ni = 0,
          pose = null;
        P.walk(u8, a, b, (n, _w, c, d) => {
          if (n === 7) [ni] = P.readVarint(u8, c);
          else if (n === 5) pose = readRigid3d(u8, c, d);
        });
        if (pose) nodes.push({ index: ni, ...pose });
      } else if (num === 2) {
        // Submap
        let si = 0,
          pose = null;
        P.walk(u8, a, b, (n, _w, c, d) => {
          if (n === 2) [si] = P.readVarint(u8, c);
          else if (n === 1) pose = readRigid3d(u8, c, d);
        });
        if (pose) submaps.push({ index: si, ...pose });
      }
    });
  }
  // Input is a SerializedData message; the PoseGraph is nested in field 1.
  function parsePoseGraph(serialized) {
    const submaps = [],
      nodes = [],
      constraints = [];
    P.walk(serialized, 0, serialized.length, (num, _wire, vs, ve) => {
      if (num !== 1) return; // SerializedData.pose_graph
      let gotTraj = false;
      P.walk(serialized, vs, ve, (n, _w, a, b) => {
        if (n === 2) constraints.push(parseConstraint(serialized, a, b));
        else if (n === 4 && !gotTraj) {
          gotTraj = true;
          parseTrajectory(serialized, a, b, submaps, nodes);
        }
      });
    });
    return { submaps, nodes, constraints };
  }

  // --- submap grid parse + occupancy decode (mirrors extract.py) ---
  function decodeGrid(u8, vs, ve) {
    let res = 0,
      maxX = 0,
      maxY = 0,
      nx = 0,
      ny = 0,
      lo = 0.1,
      hi = 0.9,
      cells = null;
    P.walk(u8, vs, ve, (num, wire, a, b) => {
      if (num === 1) {
        // MapLimits
        P.walk(u8, a, b, (n, _w, c, d) => {
          if (n === 1) res = P.f64(u8, c);
          else if (n === 2)
            P.walk(u8, c, d, (m, _w2, e) => {
              if (m === 1) maxX = P.f64(u8, e);
              else if (m === 2) maxY = P.f64(u8, e);
            });
          else if (n === 3)
            P.walk(u8, c, d, (m, _w2, e) => {
              if (m === 1) [nx] = P.readVarint(u8, e);
              else if (m === 2) [ny] = P.readVarint(u8, e);
            });
        });
      } else if (num === 2) {
        // cells (packed int32 varints, or single)
        cells = [];
        if (wire === 2) {
          let p = a;
          while (p < b) {
            let v;
            [v, p] = P.readVarint(u8, p);
            cells.push(v);
          }
        } else {
          cells.push(P.readVarint(u8, a)[0]);
        }
      } else if (num === 6) lo = P.f32(u8, a);
      else if (num === 7) hi = P.f32(u8, a);
    });
    return { res, maxX, maxY, nx, ny, lo, hi, cells };
  }
  // occupied cells in the local SLAM frame -> flat [x0,y0,x1,y1,...]
  function occupiedCellsLocal(g, occ = 0.55) {
    const { res, maxX, maxY, nx, ny, lo, hi, cells } = g,
      pts = [];
    for (let xt = 0; xt < ny; xt++) {
      // slow axis (num_y_cells) -> X
      const base = xt * nx,
        wx = maxX - (xt + 0.5) * res;
      for (let yt = 0; yt < nx; yt++) {
        // fast axis (num_x_cells) -> Y
        const v = cells[base + yt];
        if (!v) continue;
        const cost = lo + ((v - 1) * (hi - lo)) / 32766.0;
        if (1 - cost > occ) {
          pts.push(wx, maxY - (yt + 0.5) * res);
        }
      }
    }
    return pts;
  }
  // parse a SerializedData submap record -> {index, local_pose, cellsLocalFrame[]}
  function parseSubmapRecord(u8) {
    let out = null;
    P.walk(u8, 0, u8.length, (num, _wire, vs, ve) => {
      if (num !== 3) return; // SerializedData.submap
      let index = 0,
        local = null,
        gridDec = null; // submap_index 0 is omitted by proto3
      P.walk(u8, vs, ve, (n, _w, a, b) => {
        if (n === 1)
          P.walk(u8, a, b, (m, _w2, c) => {
            if (m === 2) [index] = P.readVarint(u8, c);
          }); // submap_id
        else if (n === 2) {
          // submap_2d
          P.walk(u8, a, b, (m, _w2, c, d) => {
            if (m === 1) local = readRigid3d(u8, c, d);
            else if (m === 4) gridDec = decodeGrid(u8, c, d);
          });
        }
      });
      if (local && gridDec?.cells) out = { index, local, cells: occupiedCellsLocal(gridDec) };
    });
    return out;
  }

  // Build the renderable submap list: occupied cells re-expressed in each submap's frame
  // (via inv(local_pose)) so world = global_pose . cell. Matches extract.py load().
  function buildSubmaps(poseGraph, submapRecords) {
    const gpose = {};
    for (const s of poseGraph.submaps) gpose[s.index] = s;
    const out = [];
    for (const rec of submapRecords) {
      const gp = gpose[rec.index];
      if (!gp) continue;
      const { x: lx, y: ly, yaw: lyaw } = rec.local,
        c = Math.cos(lyaw),
        sn = Math.sin(lyaw);
      const src = rec.cells,
        local = new Float32Array(src.length);
      for (let i = 0; i < src.length; i += 2) {
        const dx = src[i] - lx,
          dy = src[i + 1] - ly;
        local[i] = c * dx + sn * dy;
        local[i + 1] = -sn * dx + c * dy; // R(-lyaw).(P - lt)
      }
      out.push({ index: rec.index, x: gp.x, y: gp.y, yaw: gp.yaw, local });
    }
    out.sort((a, b) => a.index - b.index);
    return out;
  }

  // --- SE2 helpers for the export node-delta ---
  const wrap = (a) => ((((a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
  function inv(p) {
    const c = Math.cos(p[2]),
      s = Math.sin(p[2]);
    return [-(c * p[0] + s * p[1]), s * p[0] - c * p[1], -p[2]];
  }
  function compose(a, b) {
    const c = Math.cos(a[2]),
      s = Math.sin(a[2]);
    return [a[0] + c * b[0] - s * b[1], a[1] + s * b[0] + c * b[1], wrap(a[2] + b[2])];
  }

  // Rewrite trajectory[0]'s submap + node poses in a pose_graph message. submapPoses:
  // {index -> [x,y,yaw]}. Nodes follow their submap(s) by rigid delta (blended), so unedited
  // submaps leave their nodes byte-identical. Everything else is copied verbatim.
  function editPoseGraph(pgBytes, submapPoses) {
    const pg = parsePoseGraph(pgBytes);
    const oldZsub = {},
      delta = {};
    for (const s of pg.submaps) {
      const np = submapPoses[s.index] || [s.x, s.y, s.yaw];
      oldZsub[s.index] = s.z;
      delta[s.index] = compose([np[0], np[1], np[2]], inv([s.x, s.y, s.yaw]));
    }
    const byNode = {};
    for (const c of pg.constraints) {
      if (c.tag !== 0) continue;
      if (!byNode[c.ni]) byNode[c.ni] = [];
      byNode[c.ni].push([c.si, Math.max(c.tw, 1e-6)]);
    }
    const newNode = {};
    for (const nd of pg.nodes) {
      const items = byNode[nd.index];
      if (!items) {
        newNode[nd.index] = [nd.x, nd.y, nd.z, nd.yaw];
        continue;
      }
      let sx = 0,
        sy = 0,
        ss = 0,
        sc = 0,
        sw = 0;
      for (const [si, w] of items) {
        const d = delta[si];
        if (!d) continue;
        const g = compose(d, [nd.x, nd.y, nd.yaw]);
        sx += g[0] * w;
        sy += g[1] * w;
        ss += Math.sin(g[2]) * w;
        sc += Math.cos(g[2]) * w;
        sw += w;
      }
      newNode[nd.index] =
        sw > 0 ? [sx / sw, sy / sw, nd.z, Math.atan2(ss, sc)] : [nd.x, nd.y, nd.z, nd.yaw];
    }

    const editTrajectory = (t8, tvs, tve) =>
      P.edit(t8, tvs, tve, {
        1: (tw_, n8, nvs, nve, _nwire, nfs) => {
          // Trajectory.Node
          let ni = 0;
          P.walk(n8, nvs, nve, (n, _ww, c) => {
            if (n === 7) [ni] = P.readVarint(n8, c);
          });
          const np = newNode[ni];
          if (!np) {
            tw_.raw(n8.subarray(nfs, nve));
            return;
          }
          tw_.msgField(
            1,
            P.edit(n8, nvs, nve, {
              5: (pw) => pw.msgField(5, encodeRigid3d(np[0], np[1], np[2], np[3])),
            }),
          );
        },
        2: (tw_, s8, svs, sve, _swire, sfs) => {
          // Trajectory.Submap
          let si = 0;
          P.walk(s8, svs, sve, (n, _ww, c) => {
            if (n === 2) [si] = P.readVarint(s8, c);
          });
          const sp = submapPoses[si];
          if (!sp) {
            tw_.raw(s8.subarray(sfs, sve));
            return;
          }
          tw_.msgField(
            2,
            P.edit(s8, svs, sve, {
              1: (pw) => pw.msgField(1, encodeRigid3d(sp[0], sp[1], oldZsub[si] || 0, sp[2])),
            }),
          );
        },
      });
    return P.edit(pgBytes, 0, pgBytes.length, {
      1: (w, u8, vs, ve) => {
        // SerializedData.pose_graph
        let trajSeen = false;
        const newPG = P.edit(u8, vs, ve, {
          4: (w2, p8, tvs, tve, _wire, tfs) => {
            // PoseGraph.trajectory
            if (trajSeen) {
              w2.raw(p8.subarray(tfs, tve));
              return;
            }
            trajSeen = true;
            w2.msgField(4, editTrajectory(p8, tvs, tve));
          },
        });
        w.msgField(1, newPG);
      },
    });
  }

  return {
    yawOf,
    readRigid3d,
    encodeRigid3d,
    firstFieldNum,
    parsePoseGraph,
    parseSubmapRecord,
    buildSubmaps,
    editPoseGraph,
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = Carto;
