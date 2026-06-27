// Inject a pHYs chunk into a PNG so it declares a physical resolution (DPI).
// Print software then opens it at the correct physical size (pixels / dpi).

let CRC_TABLE: number[] | null = null;
function crcTable(): number[] {
  if (CRC_TABLE) return CRC_TABLE;
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  CRC_TABLE = t;
  return t;
}

function crc32(bytes: Uint8Array): number {
  const t = crcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = t[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Returns a new PNG byte array tagged with the given DPI (default 300). */
export function withDpi(buffer: ArrayBuffer, dpi = 300): Uint8Array {
  const src = new Uint8Array(buffer);
  // IHDR is the first chunk: 8-byte signature + (4 len + 4 type + 13 data + 4 crc) = 33
  const insertAt = 33;
  const ppu = Math.round(dpi / 0.0254); // pixels per metre

  const chunk = new Uint8Array(21); // 4 len + 4 type + 9 data + 4 crc
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, 9); // data length
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // "pHYs"
  dv.setUint32(8, ppu); // x
  dv.setUint32(12, ppu); // y
  chunk[16] = 1; // unit = metre
  dv.setUint32(17, crc32(chunk.subarray(4, 17))); // crc over type+data

  const out = new Uint8Array(src.length + chunk.length);
  out.set(src.subarray(0, insertAt), 0);
  out.set(chunk, insertAt);
  out.set(src.subarray(insertAt), insertAt + chunk.length);
  return out;
}
