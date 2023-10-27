const { http } = require("./axios.js");
const fs = require("fs");
const path = require("path");

// 批量下载
function downloadImg(srcArr, dir, index, callback) {
  let url = srcArr[index];
  let type = path.extname(url);

  http(url, { responseType: "arraybuffer" })
    .then((res) => {
      if (res.status === 200 && !!res.data) {
        fs.writeFile(`${dir}/${index}${type}`, res.data, "binary", (err) => {
          if (err) throw err;
          console.log(`图片${url}下载成功!!!`);
        });
      }
    })
    .catch((err) => {
      console.log(`图片${url}下载失败!!!`);
    })
    .finally(() => {
      if (index < srcArr.length - 1) {
        setTimeout(() => {
          console.log('下载图片中...');
          downloadImg(srcArr, dir, index + 1, callback);
        }, Math.random() * 1000)
      } else {
        callback && callback();
      }
    });
}

// 收集所有的文件路径
const arr = [];
let timer = null;
/**
 * fileDisplay(url, callback)
 * @param url: 你即将读取的文件夹路径
 * @param callback: 回调函数
 */
const fileDisplay = (url, cb) => {
  const filePath = path.resolve(url);
  fs.readdir(filePath, (err, files) => {
    if (err) return console.error("Error:(spec)", err);
    files.forEach((filename) => {
      const fileDir = path.join(filePath, filename);
      fs.stat(fileDir, (err, stats) => {
        if (err) return console.error("Error:(spec)", err);
        const isFile = stats.isFile();
        const isDir = stats.isDirectory();
        if (isFile) {
          arr.push(fileDir.replace(__dirname, "").replace(/\\/gim, "/"));
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => cb && cb(arr), 200);
        }
        if (isDir) fileDisplay(fileDir, cb);
      });
    });
  });
};

exports.fileDisplay = fileDisplay;
exports.downloadImg = downloadImg;
