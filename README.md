# Deno FFI Template

The repo is a template for deno ffi (using plug), to make it easy to wrap rust
native libraries.

The source code is annoated with comments for the relevent parts.

## Usage

```sh
deno task test
```

Run `deno task` to see the many more available commands.

## Notes

- If you have created a new repo, the repo url inside `src/mod.ts` needs to
  change to match the repo you're using
- When you change the rust library name, remember to also change the name in the
  github workflow (just grep for hello)

## Publishing a rust library with github action

The repo comes with a workflow that builds the rust library for
linux,windows,macos(x86+arm)

To use it go to `Actions`, then click `Releas libs` (on the left), then click
`Run workflow`. Set the tag name, the tag should match what you're using inside
`src/mod.ts` so it can be picked up by the module.

## Technical Details

- The ffi between rust and deno is using json values encoded as Cstrings
