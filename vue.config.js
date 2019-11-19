module.exports = {
  devServer: {
    port: 3000,
    headers: {'Access-Control-Allow-Origin': '*'},
    proxy: {
      '^/api': {
        target: 'http://localhost:8000/',
        ws: true,
        changeOrigin: true
      },
    }
  }
}