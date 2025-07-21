// webpack.config.js
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // Chế độ: 'development' để dễ debug, 'production' để build cuối cùng
  mode: 'development',
  // Giúp debug dễ dàng hơn
  devtool: 'cheap-module-source-map',

  // Các điểm bắt đầu của ứng dụng
  entry: {
    background: './src/background.js',
    popup: './src/popup/popup.js',
  },

  // Nơi chứa các tệp đầu ra đã được build
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js', // Sẽ tạo ra background.js và popup.js
    clean: true, // Tự động dọn dẹp thư mục dist mỗi lần build
  },

  // Các quy tắc xử lý file
  module: {
    rules: [
      {
        test: /\.css$/, // Xử lý tất cả các file .css
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  // Các plugin hỗ trợ
  plugins: [
    // Sao chép các tệp tĩnh
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'public', to: '.' }, // Chép toàn bộ thư mục public (chứa icons)
      ],
    }),

    // Xử lý tệp popup.html
    new HtmlWebpackPlugin({
      template: './src/popup/popup.html', // File mẫu
      filename: 'popup/popup.html',    // File đầu ra
      chunks: ['popup'], // Chỉ nhúng script 'popup.js' vào file html này
    }),
  ],
};
