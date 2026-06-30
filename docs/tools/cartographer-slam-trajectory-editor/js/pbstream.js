// Cartographer .pbstream container: 8-byte magic, gzipped SerializationHeader, then
// length-prefixed gzipped SerializedData records. Reading only decompresses the records
// up to and including the submaps (pose_graph + submaps come first); writing copies every
// other record's compressed bytes through verbatim and only rewrites the pose_graph record.
// Depends on proto.js and cartographer.js. gzip via the browser/Node streams API.
const Pbstream = (() => {
  const NODE = typeof module !== "undefined" && module.exports;
  const P = NODE ? require("./proto.js") : Proto;
  const CG = NODE ? require("./cartographer.js") : Carto;
  const MAGIC = 0x7b1d1f7b5bf501dbn;

  async function gunzip(u8) {
    const s = new Response(new Blob([u8])).body.pipeThrough(new DecompressionStream("gzip"));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  async function gzip(u8) {
    const s = new Response(new Blob([u8])).body.pipeThrough(new CompressionStream("gzip"));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }

  // Returns [ {start, len} ] compressed-record spans plus the header span, by walking the
  // length framing only (no decompression).
  function frame(arrayBuffer) {
    const dv = new DataView(arrayBuffer),
      u8 = new Uint8Array(arrayBuffer);
    if (dv.getBigUint64(0, true) !== MAGIC) throw new Error("not a pbstream (bad magic)");
    const hlen = Number(dv.getBigUint64(8, true));
    let p = 16 + hlen; // skip magic(8) + headerLen(8) + header
    const recs = [];
    while (p < u8.length) {
      const len = Number(dv.getBigUint64(p, true));
      recs.push({ start: p + 8, len });
      p += 8 + len;
    }
    return { headerEnd: 16 + hlen, recs };
  }

  // Decompress pose_graph + submap records (everything before the first node record),
  // returning the parsed renderable model + what export() needs.
  async function load(arrayBuffer, onProgress) {
    const cart = CG,
      { recs } = frame(arrayBuffer),
      u8 = new Uint8Array(arrayBuffer);
    let pgBytes = null,
      pgIndex = -1;
    const submapRecs = [];
    for (let i = 0; i < recs.length; i++) {
      const dec = await gunzip(u8.subarray(recs[i].start, recs[i].start + recs[i].len));
      const f = cart.firstFieldNum(dec);
      if (f === 1) {
        pgBytes = dec;
        pgIndex = i;
        if (onProgress) onProgress("reading pose graph…");
      } else if (f === 3) {
        submapRecs.push(cart.parseSubmapRecord(dec));
        if (onProgress) onProgress(`decoding submaps… (${submapRecs.length})`);
      } else if (f === 4) break; // reached node records; the rest are passthrough
    }
    if (!pgBytes) throw new Error("no pose_graph record found");
    if (onProgress) onProgress("building map…");
    const pg = cart.parsePoseGraph(pgBytes);
    const submaps = cart.buildSubmaps(pg, submapRecs.filter(Boolean));
    return { submaps, poseGraph: pg, pgIndex, arrayBuffer };
  }

  // Write a new pbstream: header + all records verbatim, except the pose_graph record which
  // is decompressed, edited (submapPoses: {index->[x,y,yaw]}), and recompressed.
  async function write(arrayBuffer, pgIndex, submapPoses) {
    const cart = CG,
      { headerEnd, recs } = frame(arrayBuffer),
      u8 = new Uint8Array(arrayBuffer);
    const out = new P.Writer();
    out.raw(u8.subarray(0, headerEnd)); // magic + header verbatim
    for (let i = 0; i < recs.length; i++) {
      const r = recs[i];
      let comp = u8.subarray(r.start, r.start + r.len);
      if (i === pgIndex) {
        const edited = cart.editPoseGraph(await gunzip(comp), submapPoses);
        comp = await gzip(edited);
      }
      writeU64(out, comp.length);
      out.raw(comp);
    }
    return out.out();
  }
  function writeU64(w, n) {
    const u = new Uint8Array(8);
    new DataView(u.buffer).setBigUint64(0, BigInt(n), true);
    w.raw(u);
  }

  return { gunzip, gzip, load, write };
})();

if (typeof module !== "undefined" && module.exports) module.exports = Pbstream;
