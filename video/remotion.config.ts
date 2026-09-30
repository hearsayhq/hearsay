import path from 'node:path';
import { Config } from '@remotion/cli/config';

// WebGL and SVG backdrop filters need a GPU-backed renderer in headless Chrome.
Config.setChromiumOpenGlRenderer('angle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
// The console's own components live in ../packages/web; they must use this React, not the root one.
Config.overrideWebpackConfig((config) => ({
  ...config,
  // Real CLI output (src/data/*.txt) is imported as text.
  module: { ...config.module, rules: [...(config.module?.rules ?? []), { test: /\.txt$/, type: 'asset/source' }] },
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve?.alias ?? {}),
      react: path.resolve('node_modules/react'),
      'react-dom': path.resolve('node_modules/react-dom'),
    },
  },
}));
