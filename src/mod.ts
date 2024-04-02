import sharp from "npm:sharp";
import { LIBRARY } from "./ffi.ts";
import {
  createPtrFromBuffer,
  decodeCstring,
  decodeJsonCstring,
} from "./utils.ts";
import type { Descriptor } from "./ffi.ts";

export async function frame() {
  const ptrBuffer = new Uint8Array(8);
  const lenBuffer = new Uint8Array(8);
  const descriptorBuffer = new Uint8Array(8);
  const result = LIBRARY.symbols.frame(ptrBuffer, lenBuffer, descriptorBuffer);

  const ptr = createPtrFromBuffer(ptrBuffer);
  if (result !== 0) throw new Error(decodeCstring(ptr));

  const frameData = new Uint8Array(
    Deno.UnsafePointerView.getArrayBuffer(
      ptr,
      Number(new BigUint64Array(lenBuffer.buffer)[0]),
    ),
  );
  const descriptor = decodeJsonCstring(
    createPtrFromBuffer(descriptorBuffer),
  ) as Descriptor;
  console.log("Stream Descriptor:", descriptor);

  if (descriptor.pixfmt.Custom === "YUYV") {
    await sharp(yuyvToRgb(frameData, descriptor.width, descriptor.height), {
      raw: {
        width: descriptor.width,
        height: descriptor.height,
        channels: 3,
      },
    }).toFile("out.png");
    console.log("Image saved to out.png");
  }
}

function yuyvToRgb(yuyvBuffer: Uint8Array, width: number, height: number) {
  const rgbBuffer = new Uint8Array(width * height * 3);

  for (let i = 0, j = 0; i < yuyvBuffer.length; i += 4) {
    const y0 = yuyvBuffer[i];
    const u = yuyvBuffer[i + 1] - 128;
    const y1 = yuyvBuffer[i + 2];
    const v = yuyvBuffer[i + 3] - 128;

    const c = y0 - 16;
    const d = u;
    const e = y1 - 16;
    const f = v;

    let r = (298 * c + 409 * f + 128) >> 8;
    let g = (298 * c - 100 * d - 208 * f + 128) >> 8;
    let b = (298 * c + 516 * d + 128) >> 8;

    rgbBuffer[j++] = Math.max(0, Math.min(255, r));
    rgbBuffer[j++] = Math.max(0, Math.min(255, g));
    rgbBuffer[j++] = Math.max(0, Math.min(255, b));

    r = (298 * e + 409 * f + 128) >> 8;
    g = (298 * e - 100 * d - 208 * f + 128) >> 8;
    b = (298 * e + 516 * d + 128) >> 8;

    rgbBuffer[j++] = Math.max(0, Math.min(255, r));
    rgbBuffer[j++] = Math.max(0, Math.min(255, g));
    rgbBuffer[j++] = Math.max(0, Math.min(255, b));
  }

  return rgbBuffer;
}
