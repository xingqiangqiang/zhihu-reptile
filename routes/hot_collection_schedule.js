const { getAllHotCollection } = require("../controller/hot-collection.js");
const schedule = require("node-schedule");
const dayjs = require("dayjs");
const { createHotCollectionDBTable } = require("../controller/db.js");

schedule.scheduleJob("0 0 */2 * * *", () => {
    createHotCollectionDBTable(`hot_collection_${dayjs().get('year')}_${dayjs().get("month") + 1}`);
    getAllHotCollection(undefined, dayjs().format('YYYY-MM-DD'));
})