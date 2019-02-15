module.exports = {
    devServer: {
        proxy: "http://192.168.178.49:3344",
        host: '0.0.0.0',
        disableHostCheck: true
    }
}
