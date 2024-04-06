# NEWS: Deprecated in favor of https://jsr.io/@sigma/camera

# Eye Ts

Cross platform camera access for Deno. Wrapper over
https://github.com/raymanfx/eye-rs

## Current status

- Tested on linux
- Might work on macos
- Still figuring out how to publish compiled rust lib for windows on github
  action.

## Examples

**Example 1**

```ts
import sharp from "npm:sharp@0.33.3";
import { Camera } from "@sigmasd/eye-ts";

if (import.meta.main) {
  const camera = new Camera();
  const descriptor = camera.descriptor();
  console.log(descriptor);

  let i = 0;
  for (const frame of camera.next()) {
    if (descriptor.pixfmt.Custom === "YUYV") {
      await sharp(yuyvToRgb(frame, descriptor.width, descriptor.height), {
        raw: {
          width: descriptor.width,
          height: descriptor.height,
          channels: 3,
        },
      }).toFile(`out${i++}.png`);
      console.log(`Image saved to out${i}.png`);
    }
    if (i === 5) break;
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
```
