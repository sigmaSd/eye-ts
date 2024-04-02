import * as plug from "@denosaurs/plug";

export interface World {
  size: number;
}

const SYMBOLS = {
  create: { parameters: [], result: "pointer" },
  hello: {
    parameters: ["pointer", "buffer", "buffer"],
    result: "i8",
    nonblocking: false,
  },
} as const;

export const LIBRARY = await instantiate();
async function instantiate() {
  const name = "hello";
  // Tag version with the prebuilt lib
  // It doesn't have to be the same as the library version
  // Only update it when the rust library gets updated
  const version = "0.1.0";
  // NOTE: replace this url with the correct repo url
  const url =
    `https://github.com/sigmaSd/scaffold-plug/releases/download/${version}`;

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
