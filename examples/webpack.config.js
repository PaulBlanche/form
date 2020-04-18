const path = require('path');

module.exports = {
  mode: 'development',
  entry: './main.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    contentBase: path.join(__dirname),
    compress: true,
    port: 9000
  },
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM'
  }
};