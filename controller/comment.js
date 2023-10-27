const md5 = require("md5");
const { decrypt } = require("./decrypt.js");
const { cookie, d_c0, x_zse_93 } = require("./secret-key.js");
const { http } = require("./axios.js");
const fs = require("fs");

let commentList = [];

const comment = async function (appendFileDir, id, type, commentUrl, callback) {
  console.log('获取评论中...');
  const url =
    commentUrl ??
    `https://www.zhihu.com/api/v4/comment_v5/${type}/${id}/root_comment?order_by=score&limit=20&offset=`;
  const url_suffix = url.replace("https://www.zhihu.com", "");
  const secretKeys = [x_zse_93, url_suffix, d_c0].join("+");
  const md5_s = md5(secretKeys);
  const b_s = decrypt(md5_s);
  const x_zse_96 = "2.0_" + b_s;

  const headers = {
    "x-zse-93": x_zse_93,
    "x-zse-96": x_zse_96,
    cookie: cookie,
  };

  http(url, { headers: headers })
    .then((res) => {
      if (res.status === 200) {
        commentList = [...commentList, ...res.data.data];
        if (res.data.paging.is_end) {
          fs.appendFile(appendFileDir, JSON.stringify(commentList), (err) => {
            if (err) throw err;
            console.log(id + '_' + '评论写入结束!');
            callback && callback();
          });
        } else {
          setTimeout(async () => {
            await comment(appendFileDir, id, type, res.data.paging.next, callback);
          }, Math.random() * 8000)
        }
      }
    })
    .catch((err) => {
      console.log(id + '_' + '获取评论出错跳出!!!');
      callback && callback();
      console.log("comment.js", err);
    });
};

exports.comment = comment;
