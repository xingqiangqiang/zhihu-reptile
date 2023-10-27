const md5 = require("md5");
const { decrypt } = require("./decrypt.js");
const { cookie, d_c0, x_zse_93, x_zst_81 } = require("./secret-key.js");
const { http } = require("./axios.js");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const { comment } = require("./comment.js");
const { downloadImg } = require("./utils.js");
const isUrl = require("is-url");

const hot = (apiUrl, dataItem, urlList, index, fileName, callback) => {
    const id = dataItem.url.replace('https://www.zhihu.com/question/', '');
    console.log(`===================== 当前爬取热门话题：${dataItem.title} id: ${id} 中... =====================`);
    const hotUrl = apiUrl ?? `https://www.zhihu.com/api/v4/questions/${id}/feeds?include=data%5B%2A%5D.is_normal%2Cadmin_closed_comment%2Creward_info%2Cis_collapsed%2Cannotation_action%2Cannotation_detail%2Ccollapse_reason%2Cis_sticky%2Ccollapsed_by%2Csuggest_edit%2Ccomment_count%2Ccan_comment%2Ccontent%2Ceditable_content%2Cattachment%2Cvoteup_count%2Creshipment_settings%2Ccomment_permission%2Ccreated_time%2Cupdated_time%2Creview_info%2Crelevant_info%2Cquestion%2Cexcerpt%2Cis_labeled%2Cpaid_info%2Cpaid_info_content%2Creaction_instruction%2Crelationship.is_authorized%2Cis_author%2Cvoting%2Cis_thanked%2Cis_nothelp%3Bdata%5B%2A%5D.mark_infos%5B%2A%5D.url%3Bdata%5B%2A%5D.author.follower_count%2Cvip_info%2Cbadge%5B%2A%5D.topics%3Bdata%5B%2A%5D.settings.table_of_content.enabled&limit=5&offset=0&order=default&platform=desktop`;

    const url_suffix = hotUrl.replace("https://www.zhihu.com", "");
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

    http(hotUrl, { headers: headers }).then((res) => {
        if (!res.data.paging.is_end) {
            dealHotItem(res.data.data[0], res.data.data, 0, dataItem, index, res.data.paging.next, urlList, fileName, callback);
        } else {
            console.log(`===================== 热门话题：${dataItem.title} id: ${id} 处理完成... =====================`);
            const remainArr = urlList.slice(index + 1)
            fs.writeFile(fileName, JSON.stringify(remainArr), 'utf8', (err) => {
                if (err) throw err;
                console.log('删除源文件中的热门话题：' + dataItem.title);
            })
            if (index < urlList.length - 1) {
                hot(undefined, urlList[index + 1], urlList, index + 1, fileName, callback);
            } else {
                console.log(`===================== ${fileName} 所有热门话题都爬完了 =====================`);
                // 正常爬完删除源文件
                fs.unlink(fileName, (err) => {
                    if (err) throw err;
                    callback();
                })
            }
        }
    }).catch((err) => {
        console.log(`===================== 当前爬取热门话题：${dataItem.title} id: ${id} 出错 =====================`);
        console.log("hot.js", err);

        if (index < urlList.length - 1) {
            hot(undefined, urlList[index + 1], urlList, index + 1, fileName, callback);
        } else {
            console.log(`===================== ${fileName} 所有热门话题都爬完了 =====================`);
            callback();
        }
    })
};

const dealHotItem = (item, resArr, index, dataItem, pIndex, apiUrl, urlList, fileName, callback) => {
    const id = dataItem.url.replace('https://www.zhihu.com/question/', '');
    const fileDir = path.join('/fedataset/zhihu', 'hot', `question_${id}`, String(item.target.id));
    // fs.access(fileDir, fs.constants.R_OK, (err) => {
    // if (err) {
    // 文件夹不存在
    fs.mkdir(fileDir, { recursive: true }, (err) => {
        if (err) throw err;
        // 源数据
        const originFilePath = path.join(fileDir, "origin.txt");
        fs.writeFile(
            originFilePath,
            item.target.content ?? "",
            (err) => {
                if (err) throw err;
                // 文件追加评论
                // await comment(originFilePath, item.target.id, 'answers', undefined,  () => {

                // });
                const $ = cheerio.load(item.target.content ?? "");
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
                        console.log(item.target.id + '图片、源文件、处理文件写入完成');

                        if (index < resArr.length - 1) {
                            dealHotItem(resArr[index + 1], resArr, index + 1, dataItem, pIndex, apiUrl, urlList, fileName, callback);
                        } else {
                            console.log('当前5条热门话题处理完成，约2s后开始获取下5条热门话题!');
                            setTimeout(() => {
                                hot(apiUrl, dataItem, urlList, pIndex, fileName, callback);
                            }, Math.random() * 2000);
                        }
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
            }
        );
    });
    // } else {
    // resolve();
    // }
    // });
}

module.exports = {
    hot,
};
