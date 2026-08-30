import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Unit tests only, and deliberately so: these cover the pure layer - the
 * mapping between wire shapes and store shapes, the invite lifetime, profile
 * completeness - which is where a silent wrong answer costs the most and where
 * a device walkthrough is least likely to notice.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@react-native-async-storage/async-storage': path.resolve(
        __dirname,
        'src/test/async-storage-stub.ts',
      ),
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
