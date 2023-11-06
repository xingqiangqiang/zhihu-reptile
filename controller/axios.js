const axios = require("axios").default;
const UserAgent = require("user-agents");
const { HttpsProxyAgent } = require("https-proxy-agent");
const dayjs = require("dayjs");

const instance = axios.create();

let expireTime = dayjs();
let ip = undefined;

// 获取代理服务器
async function getProxyIp() {
  const res = await axios.get(
    "https://demo.com"
  );
  expireTime = res.data.data[0].expire_time
  ip = `http://${res.data.data[0].ip}:${res.data.data[0].port}`
  return ip;
}

instance.interceptors.request.use(async (config) => {
  const httpsAgent = dayjs(expireTime).diff(dayjs(), 'minute') < 5 ? await getProxyIp() : ip;
  console.log('使用的代理地址为：', httpsAgent);
  config.httpsAgent = new HttpsProxyAgent(httpsAgent);
  config.headers[`user-agent`] = (new UserAgent()).toString();
  return config;
});

instance.interceptors.response.use(
  (response) => {
    return Promise.resolve(response);
  },
  (err) => {
    return Promise.reject(err);
  }
);

exports.http = instance
