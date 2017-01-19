
import nodeExternals from 'webpack-node-externals'

export default {
  context: __dirname,
  entry: './src',
  output: {
    path: './lib',
    filename: 'index.js'
  },
  target: 'node',
  resolve: {
    extensions: ['', '.js', '.json']
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel'
      }
    ]
  },
  externals: [nodeExternals()]
}