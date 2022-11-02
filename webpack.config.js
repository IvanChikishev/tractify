const path = require("path");
const { VueLoaderPlugin } = require("vue-loader");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WebpackMessages = require("webpack-messages");

module.exports = {
  entry: path.resolve(__dirname, "vue.config.js"),
  output: {
    path: path.resolve(__dirname, "dist/frontend"),
  },

  mode: "development",
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.js$/,
        loader: "babel-loader",
      },
      {
        test: /\.css$/,
        use: ["vue-style-loader", "css-loader"],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
      },
    ],
  },

  plugins: [
    new WebpackMessages({
      name: "client",
      logger: (str) => console.log(`>> ${str}`),
    }),
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "www/index.html"),
      title: "Tractify LLC",
    }),
  ],

  devServer: {
    host: "127.0.0.1",
    port: 9001,
    historyApiFallback: true,
    hot: true,
  },
};
