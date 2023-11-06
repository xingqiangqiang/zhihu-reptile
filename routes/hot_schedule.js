const md5 = require("md5");
const { decrypt } = require("../controller/decrypt.js");
const { cookie, d_c0, x_zse_93, x_zst_81 } = require("../controller/secret-key.js");
const { http } = require("../controller/axios.js");
const schedule = require("node-schedule");
const { hot } = require("../controller/hot.js");
const dayjs = require("dayjs");
const { createDBTable } = require('../controller/db.js');

let allHotList = [];

const getAllHot = (nextHotUrl) => {
    console.log(`获取${dayjs().toString()}的所有热榜中...`);
    const hotUrl = nextHotUrl ?? 'https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=100';
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

    http(hotUrl, { headers: headers }).then(res => {
        allHotList = [...allHotList, ...res.data.data.map(item => {
            return {
                title: item.target.title,
                url: `https://www.zhihu.com/question/${item.target.id}`,
            }
        })]
        if (!res.data.paging.is_end) {
            getAllHot(res.data.paging.next);
        } else {
            console.log('获取所有热榜完成，共 ' + allHotList.length);
            createDBTable(`hot_${dayjs().get('year')}_${dayjs().get("month") + 1}`);
            hot(undefined, allHotList[0], allHotList, 0, undefined, undefined, dayjs().format('YYYY-MM-DD'));
        };
    }).catch(res => {
        console.log(res);
    })
}

schedule.scheduleJob("0 0 */4 * * *", () => {
    getAllHot();
})