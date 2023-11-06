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
const schedule = require("node-schedule");
const dayjs = require("dayjs");
const { insertIntoDB, connection } = require("./db.js");

let allZhuanLanList = [];

const getAllZhuanLan = (nextZhuanLanUrl) => {
    console.log('获取所有专栏中...');
    const zhuanLanUrl = nextZhuanLanUrl ?? 'https://zhuanlan.zhihu.com/api/recommendations/columns?limit=1000&offset=0&seed=7';
    const url_suffix = zhuanLanUrl.replace("https://zhuanlan.zhihu.com", "");
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

    http(zhuanLanUrl, { headers: headers }).then(res => {
        allZhuanLanList = [...allZhuanLanList, ...res.data.data.filter(item => {
            return item !== null
        })]
        if (!res.data.paging.is_end && allZhuanLanList.length < 500) {
            getAllZhuanLan(res.data.paging.next);
        } else {
            console.log('获取所有专栏完成，共 ' + allZhuanLanList.length);
            dealZhuanLanItems(undefined, allZhuanLanList[0], allZhuanLanList, 0)
        };
    }).catch(res => {
        console.log(res);
    })
}

const dealZhuanLanItems = (nextZhuanLanItemsUrl, zhuanLanItem, allZhuanLanList, index) => {
    console.log(`===================== 当前爬取专栏：${zhuanLanItem.title} id: ${zhuanLanItem.id} 中... =====================`);

    const zhuanLanItemsUrl = nextZhuanLanItemsUrl ?? `https://www.zhihu.com/api/v4/columns/${zhuanLanItem.id}/items?limit=50&offset=0`;

    const url_suffix = zhuanLanItemsUrl.replace("https://www.zhihu.com", "");
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

    http(zhuanLanItemsUrl, { headers: headers }).then((res) => {
        if (!res.data.paging.is_end) {
            dealZhuanLanItem(res.data.data[0], res.data.data, 0, zhuanLanItem, index, res.data.paging.next, allZhuanLanList);
        } else {
            console.log(`===================== 专栏：${zhuanLanItem.title} id: ${zhuanLanItem.id} 处理完成... =====================`);
            if (index < allZhuanLanList.length - 1) {
                dealZhuanLanItems(undefined, allZhuanLanList[index + 1], allZhuanLanList, index + 1);
            } else {
                console.log(`===================== 所有专栏都爬完了 =====================`);
            }
        }
    }).catch((err) => {
        console.log(`===================== 当前爬取专栏：${zhuanLanItem.title} id: ${zhuanLanItem.id} 出错 =====================`);
        console.log("hot-collection.js", err);

        if (index < allZhuanLanList.length - 1) {
            dealZhuanLanItems(undefined, allZhuanLanList[index + 1], allZhuanLanList, index + 1,);
        } else {
            console.log(`===================== 所有专栏都爬完了 =====================`);
        }
    })
};

const dealZhuanLanItem = (item, resArr, index, zhuanLanItem, pIndex, nextZhuanLanItemsUrl, allZhuanLanList) => {
    const fileDir = path.join('/fedataset/zhihu', 'zhuanlan', md5(zhuanLanItem.id).slice(-4), `zhuanlan_${zhuanLanItem.id}`, String(item.id));
    fs.mkdir(fileDir, { recursive: true }, (err) => {
        if (err) throw err;
        // 源数据
        const originFilePath = path.join(fileDir, "origin.txt");
        fs.writeFile(
            originFilePath,
            item.content ?? "",
            (err) => {
                if (err) throw err;
                // 文件追加评论
                // await comment(originFilePath, item.id, 'articles', undefined,  () => {

                // });
                const $ = cheerio.load(item.content ?? "");
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
                        console.log('专栏：' + item.id + ' 图片、源文件、处理文件写入完成,开始写入数据库...');

                        // 写入数据库
                        const insertSQL = "insert into zhuanlan(id,z_id,content,md5_end4,create_time,interface_data,path) values (?,?,?,?,?,?,?)";
                        const dataArr = [item.id, zhuanLanItem.id, item.content ?? '', md5(zhuanLanItem.id).slice(-4), dayjs().format('YYYY-MM-DD HH:mm:ss'), JSON.stringify(item), fileDir];

                        insertIntoDB(insertSQL, dataArr);

                        if (index < resArr.length - 1) {
                            dealZhuanLanItem(resArr[index + 1], resArr, index + 1, zhuanLanItem, pIndex, nextZhuanLanItemsUrl, allZhuanLanList);
                        } else {
                            console.log('当前50条收藏处理完成，约2s后开始获取下50条专栏数据!');
                            setTimeout(() => {
                                dealZhuanLanItems(nextZhuanLanItemsUrl, zhuanLanItem, allZhuanLanList, pIndex);
                            }, Math.random() * 2000)
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
}

getAllZhuanLan();

exports.getAllZhuanLan = getAllZhuanLan;
