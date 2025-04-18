# bun-lib-template-starter - A template for creating a library with bun

## Getting Started

Click the [Use this template](https://github.com/andrei0x309/bun-lib-template-starter/generate) button to create a new repository with the contents starter.

OR

Run `bun create andrei0x309/bun-lib-template-starter  ./my-lib`.

## Usage

Change `lib.config.ts` to your needs.

Run `bun run build` to build the library.

## Features

- [x] Almost no dependencies.
- [x] Generating types with rust.
- [x] Degit command included.
- [x] License generation command included
- [x] Automatic version bump.
- [x] Release command included.
- [x] Automatic tag generation.
- [x] Configurable by `lib.config.ts`
- [x] Cross-OS support.
- [x] Only uses Bun bundler to bundle the library. (note Bun bundler only supports ESM modules)
- [x] Option to omit types declaration generation (default is false)
- [x] Option auto fill exports in package.json (default is true)

## Notes

- Creating type declarations without using typescript at the moment is only possible with `isolatedDeclarations` set to `true` in tsconfig.json,
which means all types must be declared explicitly in your code.

- the folder `lib-tools` will not be included in the library, and is meant as a helper for the library creator.

- ATM This template is pretty basic but works with any OS, uses only bun bundler, and only supports ESM modules, intended for modern JS, I might add more features, if you think it's missing something create an issue

- All config options in `lib.config.ts` are documented in `/lib-tools/types/config-type.ts`

## CHANGELOG

### 2025-03-29
  
- Initial release

## License

MIT
