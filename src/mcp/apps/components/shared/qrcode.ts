/**
 * Minimal QR Code encoder — byte mode, versions 1–6, ECC level M.
 *
 * Plan 10 F5: powers the publish card's share-link QR entirely in-widget
 * (~4 KB, no external image service, CSP-friendly).
 *
 * Implements ISO/IEC 18004: mode header (byte), Reed–Solomon ECC over
 * GF(256), function patterns, zigzag placement, format info (two copies),
 * and all 8 masks with penalty-based selection. Versions 1–6 cover share
 * URLs up to 106 bytes; longer inputs throw `RangeError` (callers degrade
 * to a plain link).
 */

export const QR_MAX_BYTES = 106;

interface EccTableEntry {
  version: number;
  /** Data codewords total (interleaved payload before ECC). */
  dataCodewords: number;
  /** ECC codewords per block. */
  eccPerBlock: number;
  /** Number of RS blocks. */
  numBlocks: number;
}

const ECC_LEVEL_M_FORMAT_BITS = 0;

const TABLE_M: EccTableEntry[] = [
  { version: 1, dataCodewords: 16, eccPerBlock: 10, numBlocks: 1 },
  { version: 2, dataCodewords: 28, eccPerBlock: 16, numBlocks: 1 },
  { version: 3, dataCodewords: 44, eccPerBlock: 26, numBlocks: 1 },
  { version: 4, dataCodewords: 64, eccPerBlock: 18, numBlocks: 2 },
  { version: 5, dataCodewords: 86, eccPerBlock: 24, numBlocks: 2 },
  { version: 6, dataCodewords: 108, eccPerBlock: 16, numBlocks: 4 },
];

/** Encodes UTF-8 text into an n×n module matrix (true = dark). */
export function encodeQr(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);

  if (bytes.length > QR_MAX_BYTES) {
    throw new RangeError(`QR input exceeds ${QR_MAX_BYTES} bytes (${bytes.length}).`);
  }

  const table = TABLE_M.find((entry) => entry.dataCodewords - 2 >= bytes.length)!;
  const codewords = buildCodewords(bytes, table.dataCodewords, table);
  const size = 17 + 4 * table.version;

  const grid = new QrMatrix(size, table.version);
  grid.drawFunctionPatterns();

  grid.drawCodewords(codewords);

  let bestMask = 0;
  let bestPenalty = Infinity;

  for (let mask = 0; mask < 8; mask++) {
    grid.applyMask(mask);
    grid.drawFormatBits(mask);
    const penalty = grid.penaltyScore();

    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMask = mask;
    }

    grid.applyMask(mask);
  }

  grid.applyMask(bestMask);
  grid.drawFormatBits(bestMask);

  return grid.modules;
}

class QrMatrix {
  readonly modules: boolean[][];
  readonly isFunction: boolean[][];

  constructor(
    readonly size: number,
    private readonly version: number
  ) {
    this.modules = makeGrid(size);
    this.isFunction = makeGrid(size);
  }

  setFunction(x: number, y: number, dark: boolean): void {
    this.modules[y][x] = dark;
    this.isFunction[y][x] = true;
  }

  drawFunctionPatterns(): void {
    for (let i = 0; i < this.size; i++) {
      this.setFunction(6, i, i % 2 === 0);
      this.setFunction(i, 6, i % 2 === 0);
    }

    this.drawFinder(3, 3);
    this.drawFinder(this.size - 4, 3);
    this.drawFinder(3, this.size - 4);

    const centers = alignmentCenters(this.version);

    for (const centerY of centers) {
      for (const centerX of centers) {
        const overlapsFinder =
          (centerY === centers[0] && centerX === centers[0])
          || (centerY === centers[0] && centerX === centers[centers.length - 1])
          || (centerY === centers[centers.length - 1] && centerX === centers[0]);

        if (!overlapsFinder) {
          this.drawAlignment(centerX, centerY);
        }
      }
    }

    this.drawFormatBits(0);
    this.setFunction(this.size - 8, 8, true);
  }

  private drawFinder(cx: number, cy: number): void {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;

        if (x < 0 || x >= this.size || y < 0 || y >= this.size) continue;

        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        this.setFunction(x, y, dist !== 2 && dist !== 4);
      }
    }
  }

  private drawAlignment(cx: number, cy: number): void {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.setFunction(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  drawFormatBits(mask: number): void {
    const data = (ECC_LEVEL_M_FORMAT_BITS << 3) | mask;
    let rem = data;

    for (let i = 0; i < 10; i++) {
      rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    }

    const bits = ((data << 10) | rem) ^ 0x5412;
    const bitAt = (i: number) => ((bits >>> i) & 1) !== 0;

    for (let i = 0; i <= 5; i++) this.setFunction(8, i, bitAt(i));

    this.setFunction(8, 7, bitAt(6));
    this.setFunction(8, 8, bitAt(7));
    this.setFunction(7, 8, bitAt(8));

    for (let i = 9; i < 15; i++) this.setFunction(14 - i, 8, bitAt(i));

    for (let i = 0; i < 8; i++) this.setFunction(this.size - 1 - i, 8, bitAt(i));

    for (let i = 8; i < 15; i++) this.setFunction(8, this.size - 15 + i, bitAt(i));

    this.setFunction(this.size - 8, 8, true);
  }

  drawCodewords(data: number[]): void {
    let bitIndex = 0;
    const totalBits = data.length * 8;

    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;

      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? this.size - 1 - vert : vert;

          if (!this.isFunction[y][x] && bitIndex < totalBits) {
            this.modules[y][x] = ((data[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1) !== 0;
            bitIndex += 1;
          }
        }
      }
    }
  }

  applyMask(mask: number): void {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        let invert: boolean;

        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
        }

        if (!this.isFunction[y][x] && invert) {
          this.modules[y][x] = !this.modules[y][x];
        }
      }
    }
  }

  /**
   * Mask quality score (lower is better). Rules 1/2/4 per spec; rule 3
   * approximated by scanning for finder-like runs, which only affects mask
   * selection — every masked variant remains fully decodable.
   */
  penaltyScore(): number {
    const n = this.size;
    let penalty = 0;

    for (let y = 0; y < n; y++) {
      let runColor = this.modules[y][0];
      let runLen = 1;

      for (let x = 1; x < n; x++) {
        if (this.modules[y][x] === runColor) {
          runLen += 1;
        } else {
          if (runLen >= 5) penalty += 3 + (runLen - 5);
          runColor = this.modules[y][x];
          runLen = 1;
        }
      }
      if (runLen >= 5) penalty += 3 + (runLen - 5);
    }

    for (let x = 0; x < n; x++) {
      let runColor = this.modules[0][x];
      let runLen = 1;

      for (let y = 1; y < n; y++) {
        if (this.modules[y][x] === runColor) {
          runLen += 1;
        } else {
          if (runLen >= 5) penalty += 3 + (runLen - 5);
          runColor = this.modules[y][x];
          runLen = 1;
        }
      }
      if (runLen >= 5) penalty += 3 + (runLen - 5);
    }

    for (let y = 0; y < n - 1; y++) {
      for (let x = 0; x < n - 1; x++) {
        const color = this.modules[y][x];

        if (
          this.modules[y][x + 1] === color
          && this.modules[y + 1][x] === color
          && this.modules[y + 1][x + 1] === color
        ) {
          penalty += 3;
        }
      }
    }

    for (let y = 0; y < n; y++) {
      const line = this.modules[y].map((dark) => (dark ? '1' : '0')).join('');
      penalty += countFinderLike(line) * 40;
    }

    for (let x = 0; x < n; x++) {
      let line = '';

      for (let y = 0; y < n; y++) line += this.modules[y][x] ? '1' : '0';
      penalty += countFinderLike(line) * 40;
    }

    let darkCount = 0;

    for (const row of this.modules) {
      for (const dark of row) if (dark) darkCount += 1;
    }

    const total = n * n;
    const deviation = Math.abs((darkCount * 20) - total);
    penalty += Math.ceil(deviation / total) * 10;

    return penalty;
  }
}

function countFinderLike(line: string): number {
  let count = 0;

  for (const pattern of ['00001011101', '10111010000']) {
    let from = 0;
    let idx: number;

    while ((idx = line.indexOf(pattern, from)) !== -1) {
      count += 1;
      from = idx + 1;
    }
  }

  return count;
}

function alignmentCenters(version: number): number[] {
  if (version === 1) return [];
  return [6, 4 * version + 10];
}

function buildCodewords(
  payload: Uint8Array,
  dataCapacity: number,
  table: EccTableEntry
): number[] {
  const bits: number[] = [0b0100];

  pushBits(bits, payload.length, 8);
  for (const byte of payload) pushBits(bits, byte, 8);

  const capacityBits = dataCapacity * 8;
  bits.push(...new Array(Math.min(4, capacityBits - bits.length)).fill(0));

  while (bits.length % 8 !== 0) bits.push(0);

  const data: number[] = [];

  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;

    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    data.push(byte);
  }

  for (let pad = 0xEC; data.length < dataCapacity; pad ^= 0xEC ^ 0x11) {
    data.push(pad);
  }

  const { numBlocks, eccPerBlock } = table;
  const shortBlockLen = Math.floor(data.length / numBlocks);
  const numShortBlocks = numBlocks - (data.length % numBlocks);

  const divisor = rsDivisor(eccPerBlock);
  const blocks: Array<{ data: number[]; ecc: number[] }> = [];
  let offset = 0;

  for (let block = 0; block < numBlocks; block++) {
    const dataLen = shortBlockLen - (block < numShortBlocks ? 0 : 1);
    const slice = data.slice(offset, offset + dataLen);

    offset += dataLen;
    blocks.push({ data: slice, ecc: rsRemainder(slice, divisor) });
  }

  const interleaved: number[] = [];

  const maxDataLen = Math.max(...blocks.map((entry) => entry.data.length));

  for (let i = 0; i < maxDataLen; i++) {
    for (const entry of blocks) {
      if (i < entry.data.length) interleaved.push(entry.data[i]);
    }
  }

  for (let i = 0; i < eccPerBlock; i++) {
    for (const entry of blocks) interleaved.push(entry.ecc[i]);
  }

  return interleaved;
}

function pushBits(target: number[], value: number, count: number): void {
  for (let i = count - 1; i >= 0; i--) target.push((value >>> i) & 1);
}

function gfMultiply(x: number, y: number): number {
  let z = 0;

  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11D);
    z ^= ((y >>> i) & 1) * x;
  }

  return z;
}

function rsDivisor(degree: number): number[] {
  const coefficients: number[] = new Array(degree).fill(0);

  coefficients[degree - 1] = 1;

  let root = 1;

  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      coefficients[j] = gfMultiply(coefficients[j], root);

      if (j + 1 < degree) coefficients[j] ^= coefficients[j + 1];
    }

    root = gfMultiply(root, 0x02);
  }

  return coefficients;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = new Array(divisor.length).fill(0);

  for (const byte of data) {
    const factor = byte ^ (result.shift() as number);

    result.push(0);
    divisor.forEach((coefficient, i) => {
      result[i] ^= gfMultiply(coefficient, factor);
    });
  }

  return result;
}

function makeGrid(size: number): boolean[][] {
  return Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
}

/** Renders a QR onto a canvas with a light quiet zone. Returns module count. */
export function drawQrToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  options: { margin?: number } = {}
): { size: number } {
  const modules = encodeQr(text);
  const n = modules.length;
  const margin = options.margin ?? 2;
  const total = n + margin * 2;
  const cell = Math.max(1, Math.floor(canvas.width / total));
  const offset = Math.floor((canvas.width - cell * n) / 2);

  canvas.width = canvas.width || cell * total;
  canvas.height = canvas.height || cell * total;

  const context = canvas.getContext('2d');

  if (!context) throw new Error('QR canvas context unavailable');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#111111';

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (modules[y][x]) {
        context.fillRect(offset + x * cell, offset + y * cell, cell, cell);
      }
    }
  }

  return { size: n };
}
