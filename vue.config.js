module.exports = {
    devServer: {
        proxy: "http://chris.de.oracle.com:3344",
        host: '0.0.0.0',
        disableHostCheck: true
    }
}
