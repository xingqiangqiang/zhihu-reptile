const axios = require("axios").default;

const http = axios.create({
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 获取代理服务器
async function getProxyIp() {
  const data = await http.get("https://dongtaiip.com");
  return data.proxy;
}

http.interceptors.request.use(async (config) => {
  // config.httpsAgent = await new require("https-proxy-agent")(
  //   `http://${await getProxyIp()}`
  // );
  config.headers[`user-agent`] = new (require("user-agents"))().data.userAgent;
  return config;
});

http.interceptors.response.use(
  (response) => {
    return Promise.resolve(response);
  },
  (err) => {
    return Promise.reject(err);
  }
);
module.exports = http;
