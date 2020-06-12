const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const {
  CleanWebpackPlugin
} = require("clean-webpack-plugin");

module.exports = {
  mode: "production",
  devtool: "cheap-module-eval-source-map",
  entry: "./index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist")
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: "babel-loader"
    }]
  },
  plugins: [new HtmlWebpackPlugin({
    template: "./index.html"
  }), new CleanWebpackPlugin()],
  devServer: {
    port: 8080,
    contentBase: "./dist",
    open: true
  }
};