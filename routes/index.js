const express = require("express");
const router = express.Router();
const { reptile } = require("../controller/index.js");

router.get("/api/zhihu", function (req, res, next) {
  reptile(req.query.q, undefined, res);
});

module.exports = router;
