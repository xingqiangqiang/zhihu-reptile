# 知乎爬虫

需要个入参 q，相当于在输入框随便输入，根据接口返回循环获取搜索词的所有文章内容，并且根据 id 获取对应的文章所有评论，使用 cheerio 解析文本，获取 img 下载到本地，并且替换输出的文件内的 src 为本地文件路径,文件会输出到 static/关键词/id 下，deal.txt - 处理 content 只保留文本内容+替换 img 的 src origin.txt - 保留源文件 content+所有的评论数据 {index}.jpg 等，添加了爬取完上传服务器的操作，根据需要修改

爬取难点在于 x_zse_96 解密，每个接口请求都会动态生成 x_zse_96

封装的 axios 主要目的是为了请求时候每个接口调用动态 ip 接口（网上有卖的服务商），防止自己的唯一 ip 被封禁，请求头添加了 user-agent，也是为了防止被封禁

```bash
npm i
npm start
```

爬取数据
http://localhost:3000/api/zhihu?q=想要搜索的词

⚠️ 注：
本地运行环境需要 canvas，如果安装不上参考
https://www.jianshu.com/p/c6a2c2ed10f8

服务器上装不上 canvas 的话参考
https://codeleading.com/article/81245562517/

大部分坑已踩，有任何问题可以留言讨论！

# 2023.10.27 更新

新增爬取热榜（热榜数据来源参照（https://github.com/justjavac/zhihu-trending-hot-questions） 将项目 clone 到本地或者服务器上，有能力的可以调用 github 接口获取 raw 文件夹下所有文件等，本项目为了快速采集，分成了 4 年的）

新增爬取热门收藏夹

新增爬取专栏

暂时取消评论爬取（太慢了，容易被检测到人机验证）

# 2023.11.06 更新

新增定时爬取任务（自动任务，爬取漏掉的数据），每天定时爬取当日热榜，数据入 mysql 库，自动创建入库表结构，按照日期月方式分表创建，防止大数据量爆库
