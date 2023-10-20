const md5 = require("md5");
const { decrypt } = require("./decrypt.js");
const { cookie, d_c0, x_zse_93 } = require("./secret-key.js");
const http = require("./axios.js");
const fs = require("fs");
const path = require("path");

let commentList = [];

const comment = function (q, id, commentUrl, callback) {
  const url =
    commentUrl ??
    `https://www.zhihu.com/api/v4/comment_v5/articles/${id}/root_comment?order_by=score&limit=20&offset=`;
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
          const appendFileDir = path.join(
            __dirname,
            "..",
            `/static/${q}/${id}/origin.txt`
          );
          fs.appendFile(appendFileDir, JSON.stringify(commentList), (err) => {
            if (err) throw err;
            callback && callback();
          });
        } else {
          comment(q, id, res.data.paging.next, callback);
        }
      }
    })
    .catch((err) => {
      console.log("comment.js_63", err);
    });
};

exports.comment = comment;
