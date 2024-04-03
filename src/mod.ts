/**
 * # Eye Ts
 *
 * Cross platform camera access for Deno. Wrapper over
 * https://github.com/raymanfx/eye-rs
 *
 * ## Current status
 *
 * - Tested on linux
 * - Might work on macos
 * - Still figuring out how to publish compiled rust lib for windows on github action.
 *
 * @example
 *
 * ```ts
 * import sharp from "npm:sharp@0.33.3";
 * import { Camera } from "@sigmasd/eye-ts";
 *
 * if (import.meta.main) {
 *   const camera = new Camera();
 *   const descriptor = camera.descriptor();
 *   console.log(descriptor);
 *
 *   let i = 0;
 *   for (const frame of camera.next()) {
 *     if (descriptor.pixfmt.Custom === "YUYV") {
 *       await sharp(yuyvToRgb(frame, descriptor.width, descriptor.height), {
 *         raw: {
 *           width: descriptor.width,
 *           height: descriptor.height,
 *           channels: 3,
 *         },
 *       }).toFile(`out${i++}.png`);
 *       console.log(`Image saved to out${i}.png`);
 *     }
 *     if (i === 5) break;
 *   }
 * }
 *
 * function yuyvToRgb(yuyvBuffer: Uint8Array, width: number, height: number) {
 *   const rgbBuffer = new Uint8Array(width * height * 3);
 *
 *   for (let i = 0, j = 0; i < yuyvBuffer.length; i += 4) {
 *     const y0 = yuyvBuffer[i];
 *     const u = yuyvBuffer[i + 1] - 128;
 *     const y1 = yuyvBuffer[i + 2];
 *     const v = yuyvBuffer[i + 3] - 128;
 *
 *     const c = y0 - 16;
 *     const d = u;
 *     const e = y1 - 16;
 *     const f = v;
 *
 *     let r = (298 * c + 409 * f + 128) >> 8;
 *     let g = (298 * c - 100 * d - 208 * f + 128) >> 8;
 *     let b = (298 * c + 516 * d + 128) >> 8;
 *
 *     rgbBuffer[j++] = Math.max(0, Math.min(255, r));
 *     rgbBuffer[j++] = Math.max(0, Math.min(255, g));
 *     rgbBuffer[j++] = Math.max(0, Math.min(255, b));
 *
 *     r = (298 * e + 409 * f + 128) >> 8;
 *     g = (298 * e - 100 * d - 208 * f + 128) >> 8;
 *     b = (298 * e + 516 * d + 128) >> 8;
 *
 *     rgbBuffer[j++] = Math.max(0, Math.min(255, r));
 *     rgbBuffer[j++] = Math.max(0, Math.min(255, g));
 *     rgbBuffer[j++] = Math.max(0, Math.min(255, b));
 *   }
 *
 *   return rgbBuffer;
 * }
 * ```
 *
 * @module
 */

import { LIBRARY } from "./ffi.ts";
import {
  createPtrFromBuffer,
  decodeCstring,
  decodeJsonCstring,
} from "./utils.ts";
import type { Descriptor } from "./ffi.ts";

/**
 * Class representing a camera.
 */
export class Camera {
  #ptr: Deno.PointerObject<unknown>;
  constructor() {
    const ptrBuffer = new Uint8Array(8);
    const result = LIBRARY.symbols.create(ptrBuffer);

    const ptr = createPtrFromBuffer(ptrBuffer);
    if (result !== 0) throw new Error(decodeCstring(ptr));
    this.#ptr = ptr;
  }

  /**
   * Generator function yielding Uint8Array frames from the camera.
   * @yields {Uint8Array} The next frame from the camera.
   */
  *next(): Generator<Uint8Array, void, unknown> {
    const ptrBuffer = new Uint8Array(8);
    const lenBuffer = new Uint8Array(8);

    while (true) {
      const result = LIBRARY.symbols.next_frame(
        this.#ptr,
        ptrBuffer,
        lenBuffer,
      );

      const ptr = createPtrFromBuffer(ptrBuffer);
      if (result !== 0) throw new Error(decodeCstring(ptr));

      const frameData = new Uint8Array(
        Deno.UnsafePointerView.getArrayBuffer(
          ptr,
          Number(new BigUint64Array(lenBuffer.buffer)[0]),
        ),
      );

      yield frameData;
    }
  }

  /**
   * Retrieves the descriptor of the camera stream.
   * @returns {Descriptor} The descriptor of the camera stream.
   */
  descriptor(): Descriptor {
    const descriptorBuffer = new Uint8Array(8);
    const result = LIBRARY.symbols.stream_descriptor(
      this.#ptr,
      descriptorBuffer,
    );
    const ptr = createPtrFromBuffer(descriptorBuffer);
    if (result !== 0) throw new Error(decodeCstring(ptr));

    const descriptor = decodeJsonCstring(
      createPtrFromBuffer(descriptorBuffer),
    ) as Descriptor;
    return descriptor;
  }
}

export type { Descriptor, PixelFormat } from "./ffi.ts";
