// Minimal protobuf wire-format codec: just enough to read the fields we care about
// and re-emit a message with a few fields edited, passing everything else through
// byte-for-byte. No schema, no dependencies - field numbers live in cartographer.js.
//
// Wire types: 0 varint, 1 64-bit (double/fixed64), 2 length-delimited, 5 32-bit (float).
const Proto = (() => {
  function readVarint(u8, p) {
    // -> [value, newPos]; safe for values < 2^53
    let r = 0,
      s = 0,
      b;
    do {
      b = u8[p++];
      r += (b & 0x7f) * 2 ** s;
      s += 7;
    } while (b & 0x80);
    return [r, p];
  }
  function skip(u8, p, wire) {
    if (wire === 0) {
      while (u8[p] & 0x80) p++;
      return p + 1;
    }
    if (wire === 1) return p + 8;
    if (wire === 5) return p + 4;
    if (wire === 2) {
      const [len, q] = readVarint(u8, p);
      return q + len;
    }
    throw new Error(`bad wire type ${wire}`);
  }
  // Iterate fields in u8[start,end). cb(num, wire, valStart, valEnd, fieldStart).
  // For length-delimited fields (wire 2) valStart..valEnd is the CONTENT (after the length
  // prefix); fieldStart..valEnd still covers the whole field (tag + length + content).
  function walk(u8, start, end, cb) {
    let p = start;
    while (p < end) {
      const fs = p;
      let tag;
      [tag, p] = readVarint(u8, p);
      const num = Math.floor(tag / 8),
        wire = tag & 7;
      let vs, ve;
      if (wire === 2) {
        let len;
        [len, p] = readVarint(u8, p);
        vs = p;
        ve = p + len;
        p = ve;
      } else {
        vs = p;
        p = skip(u8, p, wire);
        ve = p;
      }
      cb(num, wire, vs, ve, fs);
    }
  }
  const f64 = (u8, p) => new DataView(u8.buffer, u8.byteOffset + p, 8).getFloat64(0, true);
  const f32 = (u8, p) => new DataView(u8.buffer, u8.byteOffset + p, 4).getFloat32(0, true);

  // Builds a message from chunks (Uint8Arrays appended whole, so verbatim passthrough
  // of big sub-messages stays cheap).
  class Writer {
    constructor() {
      this.chunks = [];
      this.len = 0;
    }
    raw(u8) {
      this.chunks.push(u8);
      this.len += u8.length;
    }
    varint(v) {
      const t = [];
      v = Math.round(v);
      while (v > 127) {
        t.push((v & 0x7f) | 0x80);
        v = Math.floor(v / 128);
      }
      t.push(v);
      this.raw(new Uint8Array(t));
    }
    tag(n, w) {
      this.varint(n * 8 + w);
    }
    f64(x) {
      const u = new Uint8Array(8);
      new DataView(u.buffer).setFloat64(0, x, true);
      this.raw(u);
    }
    dblField(n, x) {
      this.tag(n, 1);
      this.f64(x);
    }
    msgField(n, u8) {
      this.tag(n, 2);
      this.varint(u8.length);
      this.raw(u8);
    }
    out() {
      const o = new Uint8Array(this.len);
      let p = 0;
      for (const c of this.chunks) {
        o.set(c, p);
        p += c.length;
      }
      return o;
    }
  }

  // Rebuild a message, replacing fields named in `editors` and copying the rest verbatim.
  // editors[num] = (writer, u8, valStart, valEnd, wire, fieldStart) => void  (must emit the
  // full replacement field incl. tag, or nothing to drop it). Called once per occurrence of
  // a repeated field, in order, so an editor can keep its own occurrence counter.
  function edit(u8, start, end, editors) {
    const w = new Writer();
    walk(u8, start, end, (num, wire, vs, ve, fs) => {
      if (editors[num]) editors[num](w, u8, vs, ve, wire, fs);
      else w.raw(u8.subarray(fs, ve));
    });
    return w.out();
  }

  return { readVarint, walk, skip, f64, f32, Writer, edit };
})();

if (typeof module !== "undefined" && module.exports) module.exports = Proto;
