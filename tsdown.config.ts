import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/icons/index.ts',
    'src/utils.ts',
    'src/test-support/selectors.ts',
  ],
  format: 'esm',
  // Unbundled, so a consumer's bundler tree-shakes per module rather than
  // through one file.
  unbundle: true,
  dts: true,
  tsconfig: './tsconfig.build.json',
  clean: true,
  // Shipped beside the modules, where its `@source "./"` points Tailwind at
  // the class names they carry.
  copy: ['src/styles.css'],
})
