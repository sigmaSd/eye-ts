import { Hello } from "./src/mod.ts";
import type { World } from "./src/mod.ts";

const hello = await Hello.create();
const world: World = { size: 500 };
console.log("[deno] the world size is:", world);
const newWorld = hello.hello(world);
console.log("[deno] the newWorld size is:", newWorld);
