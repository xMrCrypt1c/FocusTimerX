import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal PNG generator for solid-color/bordered icons with crisp shapes
function createPngBuffer(width, height, drawFn) {
  // RGBA buffer
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rgba[idx] = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = a;
    }
  }

  // PNG filter scanlines (filter type 0: None)
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    scanlines[y * (1 + width * 4)] = 0; // Filter 0
    rgba.copy(scanlines, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idatData = zlib.deflateSync(scanlines);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    // CRC
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeInt32BE(crc, 8 + len);
    return buf;
  }

  // Table-based CRC32
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
      }
    }
    return (c ^ 0xffffffff) | 0;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function drawFocusIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background: Charcoal (#09090b)
  let bgR = 9, bgG = 9, bgB = 11;
  if (!isMaskable) {
    // Rounded corner border radius
    const cornerR = w * 0.22;
    const qx = Math.abs(x - cx) - (cx - cornerR);
    const qy = Math.abs(y - cy) - (cy - cornerR);
    if (qx > 0 && qy > 0) {
      const cDist = Math.sqrt(qx * qx + qy * qy);
      if (cDist > cornerR) return [0, 0, 0, 0]; // Transparent outside squircle
    }
  }

  // Safe radius for elements
  const ringR = w * (isMaskable ? 0.30 : 0.36);
  const ringThick = w * 0.035;

  // Thin ring
  if (Math.abs(dist - ringR) < ringThick) {
    // Accent arc on top/right, neutral on rest
    const angle = Math.atan2(dy, dx); // -pi to pi
    if (angle > -Math.PI * 0.8 && angle < Math.PI * 0.3) {
      return [244, 63, 94, 255]; // Rose accent #f43f5e
    }
    return [55, 65, 81, 255]; // Muted ring
  }

  // Center Hourglass / X geometry
  const innerScale = w * (isMaskable ? 0.16 : 0.20);
  const nx = Math.abs(dx) / innerScale;
  const ny = Math.abs(dy) / innerScale;

  // Center dot
  if (dist < w * 0.025) {
    return [244, 63, 94, 255]; // Accent dot
  }

  // Top and bottom bars
  if (ny > 0.85 && ny < 1.05 && nx < 1.0) {
    return [250, 250, 250, 255];
  }

  // Diagonal hour glass waist lines
  const lineDist = Math.abs(ny - (1 - nx * 0.8));
  if (lineDist < 0.22 && nx < 0.9 && ny < 0.9) {
    return [244, 244, 245, 255];
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPngBuffer(192, 192, (x, y, w, h) => drawFocusIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPngBuffer(512, 512, (x, y, w, h) => drawFocusIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPngBuffer(512, 512, (x, y, w, h) => drawFocusIcon(x, y, w, h, true)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPngBuffer(180, 180, (x, y, w, h) => drawFocusIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPngBuffer(64, 64, (x, y, w, h) => drawFocusIcon(x, y, w, h, false)));

console.log('PWA PNG Icons successfully generated!');
