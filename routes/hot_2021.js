const fs = require("fs");
const { hot } = require("../controller/hot.js");
const path = require("path");
const dayjs = require('dayjs');

const filePath = path.join("/mnt/vepfs/xqq/zhihu-trending-hot-questions", 'raw');

fs.readdir(filePath, (err, files) => {
    if (err) throw err;
    const data_2021 = files.filter(item => {
        return dayjs(item.replace('.json', '')).isSame('2021', "year")
    })

    loopContent(data_2021[0], data_2021, 0);
})

const loopContent = (file, files, index) => {
    fs.readFile(path.join(filePath, file), 'utf8', (err, content) => {
        if (err) throw err;
        hot(undefined, JSON.parse(content)[0], JSON.parse(content), 0, path.join(filePath, file), () => {
            if (index < files.length - 1) {
                loopContent(files[index + 1], files, index + 1);
            } else {
                console.log(`===================== 2021年热门话题全部完成 =====================`);
            }
        })
    })
}

