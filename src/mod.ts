import { LIBRARY } from "./ffi.ts";
import {
  createPtrFromBuffer,
  decodeCstring,
  decodeJsonCstring,
} from "./utils.ts";
import type { Descriptor } from "./ffi.ts";

export class Camera {
  #ptr: Deno.PointerObject<unknown>;
  constructor() {
    const ptrBuffer = new Uint8Array(8);
    const result = LIBRARY.symbols.create(ptrBuffer);

    const ptr = createPtrFromBuffer(ptrBuffer);
    if (result !== 0) throw new Error(decodeCstring(ptr));
    this.#ptr = ptr;
  }

  *next() {
    while (true) {
      const ptrBuffer = new Uint8Array(8);
      const lenBuffer = new Uint8Array(8);
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

  descriptor() {
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
