const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',

  // Các điểm bắt đầu, đã chuyển sang .ts
  entry: {
    background: './src/background.ts',
    popup: './src/popup/popup.ts',
    content: './src/content.ts',
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },

  module: {
    rules: [
      // Rule để xử lý các tệp .ts và .tsx
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // Rule để xử lý CSS và tách ra tệp riêng
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },

  // Giúp Webpack nhận diện các đuôi tệp
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },

  plugins: [
    // Tách CSS ra tệp riêng
    new MiniCssExtractPlugin({
        filename: 'popup/popup.css'
    }),
    
    // Sao chép các tệp tĩnh
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'public', to: '.' },
      ],
    }),

    // Xử lý tệp popup.html
    new HtmlWebpackPlugin({
      template: './src/popup/popup.html',
      filename: 'popup/popup.html',
      chunks: ['popup'],
    }),
  ],
};
