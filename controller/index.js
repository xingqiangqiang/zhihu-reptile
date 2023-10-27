const md5 = require("md5");
const { decrypt } = require("./decrypt.js");
const { cookie, d_c0, x_zse_93, x_zst_81 } = require("./secret-key.js");
const { http } = require("./axios.js");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const qs = require("qs");
const { comment } = require("./comment.js");
const { downloadImg } = require("./utils.js");
const isUrl = require("is-url");

const reptile = (q, apiUrl, keyWordArr, index) => {
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
      if (!res.data.paging.is_end) {
        const outputFile = res.data.data.map((item) => {
          return new Promise((resolve, reject) => {
            if (item.type === "search_result") {
              const fileDir = path.join('/fedataset/zhihu/', q, item.object.id);
              fs.mkdir(fileDir, { recursive: true }, (err) => {
                if (err) throw err;
                // 源数据
                const originFilePath = path.join(fileDir, "origin.txt");
                fs.writeFile(
                  originFilePath,
                  item.object.content ?? "",
                  async (err) => {
                    if (err) throw err;
                    // 文件追加评论
                    await comment(q, item.object.id, 'articles', undefined, async () => {
                      const $ = cheerio.load(item.object.content ?? "");
                      let imgList = $("img").filter((index, item) => {
                        return isUrl($(item).attr("src"));
                      });
                      let srcArr = [];
                      for (let i = 0; i < imgList.length; i++) {
                        if (isUrl(imgList[i + ""].attribs["src"])) {
                          srcArr.push(imgList[i + ""].attribs["src"]);
                        }
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
                          console.log(item.object.id + '图片、源文件、处理文件写入完成');
                          resolve();
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
                        await downloadImg(srcArr, fileDir, 0, () => {
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
          .then(async () => {
            console.log('当前20条处理完成，开始获取下20条数据');
            reptile(q, res.data.paging.next, keyWordArr, index);
          });
      } else {
        console.log(`=====================${q}数据处理完成=====================`);
        if (index < keyWordArr.length) {
          reptile(keyWordArr[index + 1], undefined, keyWordArr, index + 1);
        }
      }
    })
    .catch((err) => {
      console.log(q + "请求分页出错跳出");
      console.log("index.js", err);
      if (index < keyWordArr.length) {
        reptile(keyWordArr[index + 1], undefined, keyWordArr, index + 1);
      }
    })
};