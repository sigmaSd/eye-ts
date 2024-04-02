import * as plug from "@denosaurs/plug";

export interface Descriptor {
  width: number;
  height: number;
  pixfmt: PixelFormat;
}

export type PixelFormat = {
  Custom?: string;
  Depth?: number;
  Gray?: number;
  Bgr?: number;
  Rgb?: number;
  Jpeg?: number;
};

const SYMBOLS = {
  frame: {
    parameters: ["buffer", "buffer", "buffer"],
    result: "i8",
  },
} as const;

export const LIBRARY = await instantiate();
async function instantiate() {
  const name = "eye";
  // Tag version with the prebuilt lib
  // It doesn't have to be the same as the library version
  // Only update it when the rust library gets updated
  const version = "0.1.0";
  // NOTE: replace this url with the correct repo url
  const url = `https://github.com/sigmaSd/${name}/releases/download/${version}`;

  return await plug.dlopen(
    {
      name,
      url: Deno.env.get("RUST_LIB_PATH") || url,
      // reload cache if developping locally
      cache: Deno.env.get("RUST_LIB_PATH") ? "reloadAll" : "use",
      suffixes: {
        darwin: {
          aarch64: "_aarch64",
          x86_64: "_x86_64",
        },
      },
    },
    SYMBOLS,
  );
}
