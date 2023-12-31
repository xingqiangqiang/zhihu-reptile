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
const { insertIntoDB, connection, createHotCollectionDBTable } = require("./db.js");

let allHotCollectionList = [];

// time 为了保证写入是当前的数据表
const getAllHotCollection = (nextHotCollectionUrl, time) => {
    console.log('获取所有热门收藏夹中...');
    const hotCollectionUrl = nextHotCollectionUrl ?? 'https://www.zhihu.com/api/v4/favlists/discover?limit=100&offset=0';
    const url_suffix = hotCollectionUrl.replace("https://www.zhihu.com", "");
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

    http(hotCollectionUrl, { headers: headers }).then(res => {
        allHotCollectionList = [...allHotCollectionList, ...res.data.data]
        if (!res.data.paging.is_end) {
            getAllHotCollection(res.data.paging.next, time);
        } else {
            console.log('获取所有热门收藏夹完成，共 ' + allHotCollectionList.length);
            dealHotCollectionItems(undefined, allHotCollectionList[0], allHotCollectionList, 0, time)
        };
    }).catch(res => {
        console.log(res);
    })
}

const dealHotCollectionItems = (nextHotCollectionItemsUrl, hotCollectionItem, allHotCollectionList, index, time) => {
    console.log(`===================== 当前爬取热门收藏夹：${hotCollectionItem.title} id: ${hotCollectionItem.id} 中... =====================`);

    const hotCollectionItemsUrl = nextHotCollectionItemsUrl ?? `https://www.zhihu.com/api/v4/collections/${hotCollectionItem.id}/items?offset=0&limit=20`;

    const url_suffix = hotCollectionItemsUrl.replace("https://www.zhihu.com", "");
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

    http(hotCollectionItemsUrl, { headers: headers }).then((res) => {
        if (!res.data.paging.is_end) {
            dealHotCollectionItem(res.data.data[0], res.data.data, 0, hotCollectionItem, index, res.data.paging.next, allHotCollectionList, time);
        } else {
            console.log(`===================== 热门收藏夹：${hotCollectionItem.title} id: ${hotCollectionItem.id} 处理完成... =====================`);
            if (index < allHotCollectionList.length - 1) {
                dealHotCollectionItems(undefined, allHotCollectionList[index + 1], allHotCollectionList, index + 1, time);
            } else {
                console.log(`===================== 所有收藏夹都爬完了 =====================`);
            }
        }
    }).catch((err) => {
        console.log(`===================== 当前爬取热门收藏夹：${hotCollectionItem.title} id: ${hotCollectionItem.id} 出错 =====================`);
        console.log("hot-collection.js", err);

        if (index < allHotCollectionList.length - 1) {
            dealHotCollectionItems(undefined, allHotCollectionList[index + 1], allHotCollectionList, index + 1, time);
        } else {
            console.log(`===================== 所有收藏夹都爬完了 =====================`);
        }
    })
};

const dealHotCollectionItem = (item, resArr, index, hotCollectionItem, pIndex, nextHotCollectionItemsUrl, allHotCollectionList, time) => {
    const fileDir = path.join('/fedataset/zhihu', 'hot-collection', dayjs().format('YYYY-MM-DD'), `collection_${hotCollectionItem.id}`, String(item.content.id));
    fs.mkdir(fileDir, { recursive: true }, (err) => {
        if (err) throw err;
        // 源数据
        const originFilePath = path.join(fileDir, "origin.txt");
        fs.writeFile(
            originFilePath,
            item.content.content ?? "",
            (err) => {
                if (err) throw err;
                // 文件追加评论
                // await comment(originFilePath, item.content.id, 'answers', undefined,  () => {
                // });
                const $ = cheerio.load(item.content.content ?? "");
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
                        console.log('热门收藏：' + item.content.id + '图片、源文件、处理文件写入完成,开始写入数据库...');

                        // 写入数据库
                        const insertSQL = `insert into hot_collection_${dayjs(time).get('year')}_${dayjs(time).get("month") + 1}(id,c_id,content,c_time,create_time,interface_data,path) values (?,?,?,?,?,?,?)`;
                        const dataArr = [item.content.id, hotCollectionItem.id, item.content.content ?? '', time, dayjs().format('YYYY-MM-DD HH:mm:ss'), JSON.stringify(item), fileDir];

                        insertIntoDB(insertSQL, dataArr);

                        if (index < resArr.length - 1) {
                            dealHotCollectionItem(resArr[index + 1], resArr, index + 1, hotCollectionItem, pIndex, nextHotCollectionItemsUrl, allHotCollectionList, time);
                        } else {
                            console.log('当前20条热门收藏处理完成，约2s后开始获取下20条收藏数据!');
                            setTimeout(() => {
                                dealHotCollectionItems(nextHotCollectionItemsUrl, hotCollectionItem, allHotCollectionList, pIndex, time);
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

getAllHotCollection(undefined, dayjs().format('YYYY-MM-DD'));

exports.getAllHotCollection = getAllHotCollection;
