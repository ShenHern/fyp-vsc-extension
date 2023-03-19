/* eslint-disable no-undef */
//@ts-check
"use strict";
const path = require("path");
const webpack = require("webpack");
//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/
/** @type WebpackConfig */
const extensionConfig = {
  target: "webworker",
  mode: "none",

  entry: "./ext-src/extension.ts",
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
  },
  externals: {
    vscode: "commonjs vscode",
  },
  resolve: {
    extensions: [".ts", ".js"],
    mainFields: ['browser', 'module', 'main'],
    modules:  ['node_modules'],
    fallback: {
      fs: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify'),
      'object-hash': require.resolve('object-hash')
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
  devtool: "nosources-source-map",
  infrastructureLogging: {
    level: "log",
  },
  stats: {
    errorDetails: true
  }
};

module.exports = extensionConfig;
