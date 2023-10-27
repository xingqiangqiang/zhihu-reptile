const express = require("express");
const router = express.Router();
const fs = require("fs");
const { reptile } = require("../controller/index.js");
const { hot } = require("../controller/hot.js");
const path = require("path");

router.get("/api/zhihu", async function (req, res, next) {
  const filePath = path.join("/mnt/vepfs/xqq/zhihu-trending-hot-questions", 'raw');

  fs.readdir(filePath, async (err, files) => {
    if (err) throw err;

    for (const file of files) {
      await new Promise((resolve, reject) => {
        fs.readFile(path.join(filePath, file), 'utf8', (err, content) => {
          if (err) throw err;
          hot(undefined, JSON.parse(content)[0], JSON.parse(content), 0)
            .then(() => {
              resolve()
            });
        })
      })
    }
  })
});

module.exports = router;
