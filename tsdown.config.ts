import { defineConfig } from 'tsdown'

export default defineConfig({
  format: [
    'esm',
  ],
  target: 'node18',
  dts: true,
  clean: true,
  shims: false,
  external: [
    /@slidev/,
    // @vitejs/plugin-react needs its refresh-runtime.js file at runtime
    // which doesn't get copied when bundled, so keep it external
    '@vitejs/plugin-react',
  ],
})
