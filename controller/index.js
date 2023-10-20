const md5 = require("md5");
const { decrypt } = require("./decrypt.js");
const { cookie, d_c0, x_zse_93, x_zst_81 } = require("./secret-key.js");
const http = require("./axios.js");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const qs = require("qs");
const { comment } = require("./comment.js");
const { downloadImg, checkUrl } = require("./utils.js");
const isUrl = require("is-url");
const { fileDisplay } = require("./utils.js");
const FormData = require("form-data");

const reptile = function (q, apiUrl, response) {
  const params = apiUrl
    ? qs.parse(
        apiUrl?.replace("https://api.zhihu.com/search_v3?advert_count=0&", "")
      )
    : {
        correction: 1,
        filter_fields: "",
        gk_version: "gz-gaokao",
        lc_idx: 0,
        limit: 20,
        offset: 0,
        q: q,
        search_hash_id: "",
        search_source: "Normal",
        show_all_topics: 0,
        t: "general",
        vertical_info: "",
      };
  const url = `https://www.zhihu.com/api/v4/search_v3?${qs.stringify(params)}`;
  const url_suffix = url.replace("https://www.zhihu.com", "");
  const secretKeys = [x_zse_93, url_suffix, d_c0, x_zst_81].join("+");
  const md5_s = md5(secretKeys);
  const b_s = decrypt(md5_s);
  const x_zse_96 = "2.0_" + b_s;

  const headers = {
    cookie: cookie,
    "x-zse-93": x_zse_93,
    "x-zse-96": x_zse_96,
    "x-zst-81": x_zst_81,
  };

  http(url, { headers: headers })
    .then((res) => {
      if (res.status === 200) {
        if (!res.data.paging.is_end) {
          const outputFile = res.data.data.map((item) => {
            return new Promise((resolve, reject) => {
              if (item.type === "search_result") {
                const fileDir = path.join(
                  __dirname,
                  "..",
                  "static",
                  q,
                  item.object.id
                );
                fs.mkdir(fileDir, { recursive: true }, (err) => {
                  if (err) throw err;
                  // 源数据
                  const originFilePath = path.join(fileDir, "origin.txt");
                  fs.writeFile(
                    originFilePath,
                    item.object.content ?? "",
                    (err) => {
                      if (err) throw err;
                      // 文件追加评论
                      comment(q, item.object.id, undefined, () => {
                        const $ = cheerio.load(item.object.content ?? "");
                        let imgList = $("img").filter((index, item) => {
                          return isUrl($(item).attr("src"));
                        });
                        let srcArr = [];
                        for (let i = 0; i < imgList.length; i++) {
                          if (isUrl(imgList[i + ""].attribs["src"])) {
                            srcArr.push(imgList[i + ""].attribs["src"]);
                          }
                          // srcArr.push(
                          //   isUrl(imgList[i].attribs["src"])
                          //     ? imgList[i].attribs["src"]
                          //     : isUrl(imgList[i].attribs["data-original"])
                          //     ? imgList[i].attribs["data-original"]
                          //     : isUrl(imgList[i].attribs["data-actualsrc"])
                          //     ? imgList[i].attribs["data-actualsrc"]
                          //     : imgList[i].attribs["data-default-watermark-src"]
                          // );
                        }
                        // 输出处理过的文件
                        const outputDealFile = () => {
                          let str = "";
                          $("body")
                            .children()
                            .each((i, el) => {
                              str +=
                                ($(el).is("figure")
                                  ? $(el).html()
                                  : $(el)
                                      .text()
                                      .replace(/\s+|&nbsp;/g, "")) + "</br>";
                            });
                          const dealFilePath = path.join(fileDir, "deal.txt");
                          fs.writeFile(dealFilePath, str ?? "", (err) => {
                            if (err) throw err;
                            resolve();
                            // fileDisplay(fileDir, async (arr) => {
                            //   const reqList = [];
                            //   arr.forEach((path, index) => {
                            //     const formData = new FormData();
                            //     formData.append("file", fs.createReadStream(path));
                            //     formData.append("folder", "zhihu");
                            //     formData.append("folder", q);
                            //     formData.append("folder", item.object.id);
                            //     formData.append("bucket", "fedataset");
                            //     const req = http.post(
                            //       "https://upload_address",
                            //       formData
                            //     );
                            //     reqList.push(req);
                            //   });
                            //   Promise.all(reqList)
                            //     .then(() => {
                            //       console.log(`${q}_${item.object.id}文件夹上传完成`);
                            //     })
                            //     .catch((err) => {
                            //       console.log(`${q}_${item.object.id}文件夹上传失败！`);
                            //     });
                            // });
                          });
                        };
                        if (srcArr.length !== 0) {
                          // 下载图片
                          imgList.each((i, el) => {
                            $(el).attr(
                              "src",
                              `./${i}${path.extname(srcArr[i])}`
                            );
                          });
                          downloadImg(srcArr, fileDir, 0, () => {
                            outputDealFile();
                          });
                        } else {
                          outputDealFile();
                        }
                      });
                    }
                  );
                });
              } else {
                resolve();
              }
            });
          });
          Promise.all(outputFile)
            .then(() => {
              reptile(q, res.data.paging.next, response);
            })
            .catch((err) => {
              console.log("index.js_189", err);
            });
        } else {
          response.json({ code: 200, message: `${q}完成` });
          console.log("=====================结束=====================");
        }
      }
    })
    .catch((err) => {
      console.log("index.js_198", err);
    });
};

module.exports = {
  reptile,
};
