const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: {
    background: './src/background.ts',
    popup: './src/popup/popup.ts',
    content: './src/content.ts',
    options: './src/options/options.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  resolve: { extensions: ['.tsx', '.ts', '.js'] },
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
      { test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: (chunkData) => chunkData.chunk.name === 'popup' ? 'popup/popup.css' : 'options.css',
    }),
    new CopyPlugin({ patterns: [{ from: 'src/manifest.json', to: 'manifest.json' }, { from: 'public', to: '.' }] }),
    new HtmlWebpackPlugin({ template: './src/popup/popup.html', filename: 'popup/popup.html', chunks: ['popup'] }),
    new HtmlWebpackPlugin({ template: './src/options/options.html', filename: 'options.html', chunks: ['options'] }),
    new BundleAnalyzerPlugin({ analyzerMode: 'static', reportFilename: 'bundle_report.html', openAnalyzer: false }),
  ],
};
