const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const OUTPUT_PATH = path.resolve(__dirname, 'dist');

module.exports = {
  entry: ['babel-polyfill', './src/main.ts'],
  output: {
    path: OUTPUT_PATH,
    filename: 'bundle.js',
  },
  resolve: {
    /**
     * See https://webpack.js.org/configuration/resolve/#resolve-extensions
     *
     * ".js" included to make some Webpack plugins work.
     */
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: ['stage-3'],
        },
      },
      {
        test: /\.(ts|tsx)$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              silent: true,
            },
          },
        ],
      },
      {
        /**
         * By default, Webpack (rather, style-loader) includes stylesheets
         * into the JS bundle.
         *
         * ExtractTextPlugin emits them into a separate plain file instead.
         */
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            { loader: 'css-loader', options: { importLoaders: 1 } },
            'postcss-loader',
          ],
        }),
      },
    ],
  },
  plugins: [
    /** See https://webpack.js.org/plugins/extract-text-webpack-plugin/ */
    new ExtractTextPlugin('index.css'),
  ],
};
