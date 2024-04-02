import { plug } from "./deps.ts";
import { decode, encode } from "./utils.ts";

export interface World {
  size: number;
}

interface HelloApi extends Deno.ForeignLibraryInterface {
  create: { parameters: never[]; result: "pointer" };
  hello: {
    parameters: ["pointer", "buffer"];
    result: "pointer";
    /** If the function called is blocking, consider enabling this
    it will make it called in another thread, and from the point of view
    of js it will be an async function
    */
    nonblocking: boolean;
  };
}

export class Hello {
  #lib;
  #this;

  /** We want an async constructor so we can't use this default one*/
  constructor(
    { lib, hello }: {
      lib: Deno.DynamicLibrary<HelloApi>;
      hello: Deno.PointerValue;
    },
  ) {
    this.#lib = lib;
    this.#this = hello;
  }

  /** Async constructor
  Async needed because plug.dlopen is async
  */
  static async create() {
    const name = "hello";
    // Tag version with the prebuilt lib
    // It doesn't have to be the same as the library version
    // Only update it when the rust library gets updated
    const version = "0.1.0";
    // NOTE: replace this url with the correct repo url
    const url =
      `https://github.com/sigmaSd/scaffold-plug/releases/download/${version}`;

    const lib = await plug.dlopen(
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
      {
        create: { parameters: [], result: "pointer" },
        hello: {
          parameters: ["pointer", "buffer"],
          result: "pointer",
          nonblocking: false,
        },
      } satisfies HelloApi,
    );

    const hello = lib.symbols.create();
    return new Hello({ lib, hello });
  }

  hello(world: World): World {
    const newWorld = this.#lib.symbols.hello(
      this.#this,
      encode(world),
    ) as Deno.PointerValue; /* non blocking is set to false */
    if (!newWorld) throw new Error("hello failed");
    return decode(newWorld);
  }
}
