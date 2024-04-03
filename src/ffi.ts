import * as plug from "@denosaurs/plug";

/**
 * Represents the descriptor of a camera stream.
 */
export interface Descriptor {
  /**
   * The width of the camera stream.
   */
  width: number;

  /**
   * The height of the camera stream.
   */
  height: number;

  /**
   * The pixel format of the camera stream.
   */
  pixfmt: PixelFormat;
}

/**
 * Represents the pixel format of a camera stream.
 */
export type PixelFormat = {
  /**
   * Custom pixel format.
   */
  Custom?: string;

  /**
   * Depth pixel format.
   */
  Depth?: number;

  /**
   * Gray pixel format.
   */
  Gray?: number;

  /**
   * BGR pixel format.
   */
  Bgr?: number;

  /**
   * RGB pixel format.
   */
  Rgb?: number;

  /**
   * JPEG pixel format.
   */
  Jpeg?: number;
};

const SYMBOLS = {
  create: {
    parameters: ["buffer"],
    result: "i8",
  },
  next_frame: {
    parameters: ["pointer", "buffer", "buffer"],
    result: "i8",
  },
  stream_descriptor: {
    parameters: ["pointer", "buffer"],
    result: "i8",
  },
} satisfies Deno.ForeignLibraryInterface;

export const LIBRARY = await instantiate();
async function instantiate() {
  const name = "eye";
  const version = "0.2.0";
  // NOTE: replace this url with the correct repo url
  const url = `https://github.com/sigmaSd/eye-ts/releases/download/${version}`;

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
