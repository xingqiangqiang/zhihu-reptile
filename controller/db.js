const mysql = require("mysql");

const connection = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'admin',
    password: 'admin',
    database: 'spider_zhihu',
})

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database.');
});

const createDBTable = (tableName) => {
    const createSQL = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id bigint(100) NOT NULL COMMENT '回答ID',
            q_id int(255) NOT NULL COMMENT '热门话题ID',
            content text COMMENT '回答文章内容',
            q_time date NOT NULL COMMENT '热门话题时间',
            create_time datetime NOT NULL COMMENT '记录创建时间',
            interface_data text COMMENT '接口数据',
            path varchar(255) NOT NULL COMMENT '服务器路径',
            PRIMARY KEY (id)
        )
    `;

    connection.query(createSQL, (err) => {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log(`--------------------------创建数据库表${tableName}成功----------------------------`);
        }
    })
}

const createHotCollectionDBTable = (tableName) => {
    const createSQL = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id bigint(100) NOT NULL COMMENT '回答ID',
            c_id int(255) NOT NULL COMMENT '收藏ID',
            content text COMMENT '回答文章内容',
            c_time date NOT NULL COMMENT '热门收藏时间',
            create_time datetime NOT NULL COMMENT '记录创建时间',
            interface_data text COMMENT '接口数据',
            path varchar(255) NOT NULL COMMENT '服务器路径',
            PRIMARY KEY (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    connection.query(createSQL, (err) => {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log(`--------------------------创建数据库表${tableName}成功----------------------------`);
        }
    })
}

const insertIntoDB = (insertSQL, dataArr) => {
    connection.query(insertSQL, dataArr, (err, result) => {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log('--------------------------写入数据库成功----------------------------');
        }
    })
}

exports.createDBTable = createDBTable;
exports.createHotCollectionDBTable = createHotCollectionDBTable;
exports.insertIntoDB = insertIntoDB;
exports.connection = connection;