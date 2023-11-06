const fs = require("fs");
const { hot } = require("../controller/hot.js");
const path = require("path");
const dayjs = require('dayjs');
const { createDBTable } = require('../controller/db.js');
const schedule = require("node-schedule");

const filePath = path.join("/mnt/vepfs/xqq/zhihu-trending-hot-questions", 'raw');

const reptile_2023 = () => {
    fs.readdir(filePath, (err, files) => {
        if (err) throw err;
        const data_2023 = files.filter(item => {
            return dayjs(item.replace('.json', '')).isSame('2023', "year")
        })

        loopContent(data_2023[0], data_2023, 0);
    })
}

const loopContent = (file, files, index) => {
    createDBTable(`hot_2023_${dayjs(file.replace('.json', '')).get("month") + 1}`);
    fs.readFile(path.join(filePath, file), 'utf8', (err, content) => {
        if (err) throw err;
        hot(undefined, JSON.parse(content)[0], JSON.parse(content), 0, path.join(filePath, file), () => {
            if (index < files.length - 1) {
                loopContent(files[index + 1], files, index + 1);
            } else {
                console.log(`===================== 2023年热门话题全部完成 =====================`);
            }
        }, file)
    })
}

reptile_2023();