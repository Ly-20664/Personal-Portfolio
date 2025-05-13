const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './App.jsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  mode: 'production',
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    modules: [__dirname, 'node_modules'],
    alias: {
      components: path.resolve(__dirname, 'components'),
      frontend: path.resolve(__dirname, 'frontend'),
      backend: path.resolve(__dirname, 'backend'),
      images: path.resolve(__dirname, 'images')
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset/resource'
      }
    ]
  },  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html'
    }),    new CopyPlugin({
      patterns: [
        { from: "styles.css", to: "" },
        { from: "script.js", to: "" },
        { from: "data_analysis.js", to: "" },
        { from: "raw.png", to: "" },
        { from: "raw2.png", to: "" }
      ]
    })
  ]
};