const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  target: 'node',
  entry: [path.join(__dirname, '..', 'lib', 'lambda', 'vanity-number-handler.js')],
  output: {
    path: path.resolve(__dirname, '..', 'build', 'lambda'),
    filename: 'vanity-number-handler.js',
    libraryTarget: 'commonjs',
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          ecma: undefined,
          warnings: false,
          parse: {},
          compress: {},
          mangle: true, // Note `mangle.properties` is `false` by default.
          module: false,
          output: null,
          toplevel: false,
          nameCache: null,
          ie8: false,
          keep_classnames: true,
          keep_fnames: true,
          safari10: false,
        },
      }),
    ],
  },
};
