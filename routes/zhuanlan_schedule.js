const { getAllZhuanLan } = require("../controller/zhuanlan.js");
const schedule = require("node-schedule");

schedule.scheduleJob("0 0 */2 * * *", () => {
    getAllZhuanLan();
})