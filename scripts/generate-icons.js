const fs = require('fs');
const zlib = require('zlib');

function createPng(width, height, r, g, b, a = 255) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, 'ascii');
    const body = Buffer.concat([t, data]);
    const crc = zlib.crc32(body);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([len, body, c]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = chunk('IHDR', ihdr);

  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 4;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
      raw[px + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(raw);
  const idatChunk = chunk('IDAT', idatData);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Creates standard 32-bit DIB (Device Independent Bitmap) ICO file.
 * 100% compatible with Chrome, Edge, Safari, Firefox, and Windows Explorer.
 */
function createDibIco(width, height, r, g, b, a = 255) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(1, 4); // 1 image

  const dibHeaderSize = 40;
  const xorSize = width * height * 4; // 32 bpp BGRA
  const andRowSize = Math.ceil(width / 32) * 4; // row size padded to 4-byte boundary
  const andSize = andRowSize * height;
  const imageSize = dibHeaderSize + xorSize + andSize;

  const entry = Buffer.alloc(16);
  entry.writeUInt8(width === 256 ? 0 : width, 0);
  entry.writeUInt8(height === 256 ? 0 : height, 1);
  entry.writeUInt8(0, 2); // color count
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(imageSize, 8); // image size
  entry.writeUInt32LE(22, 12); // offset (6 + 16 = 22)

  const bih = Buffer.alloc(40);
  bih.writeUInt32LE(40, 0); // biSize
  bih.writeInt32LE(width, 4); // biWidth
  bih.writeInt32LE(height * 2, 8); // biHeight (must be 2 * height for ICO)
  bih.writeUInt16LE(1, 12); // biPlanes
  bih.writeUInt16LE(32, 14); // biBitCount
  bih.writeUInt32LE(0, 16); // biCompression = BI_RGB
  bih.writeUInt32LE(xorSize + andSize, 20); // biSizeImage

  const xorMap = Buffer.alloc(xorSize);
  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;
    xorMap[offset] = b;     // Blue
    xorMap[offset + 1] = g; // Green
    xorMap[offset + 2] = r; // Red
    xorMap[offset + 3] = a; // Alpha
  }

  const andMask = Buffer.alloc(andSize, 0);

  return Buffer.concat([header, entry, bih, xorMap, andMask]);
}

// Color: Cobalt blue #2449d8 -> r: 36, g: 73, b: 216
const png = createPng(32, 32, 0x24, 0x49, 0xd8);
const ico = createDibIco(32, 32, 0x24, 0x49, 0xd8);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" rx="4" fill="#2449d8"/>
</svg>
`;

if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

fs.writeFileSync('app/favicon.ico', ico);
fs.writeFileSync('public/favicon.ico', ico);
fs.writeFileSync('app/icon.png', png);
fs.writeFileSync('public/icon.png', png);
fs.writeFileSync('app/icon.svg', svg);
fs.writeFileSync('public/icon.svg', svg);

console.log('Blue square icon files written to app/ and public/ successfully.');
