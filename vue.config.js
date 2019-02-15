module.exports = {
    devServer: {
        proxy: "http://localhost:3344",
        host: '0.0.0.0',
        disableHostCheck: true
    }
}
