const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    background: "./src/background.js",
    "social-content": "./src/social-content.js",
    popup: "./src/popup.js",
    "website-content": "./src/website-content.js",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: "public", to: "." }],
    }),
  ],
  resolve: {
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
    },
  },
};
