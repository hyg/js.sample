# Nextcloud 笔记同步工具

此工具可自动创建 Markdown 笔记并与 Nextcloud 服务器同步。

## 功能

- 每天创建 4 个按日期命名的笔记文件，命名格式为 `d.YYYYMMDD.XX.md`
- 自动将笔记上传到 Nextcloud 并创建公开只读共享
- 监控本地文件变化并将更新同步到 Nextcloud
- 关闭程序时 (Ctrl+C)：
  - 移除所有共享
  - 将笔记合并为每日摘要文件
  - 将摘要上传到 Nextcloud 并创建公开共享

## 设置

1. 克隆此仓库
2. 运行 `npm install` 安装依赖
3. 创建 `.env` 文件并更新您的 Nextcloud 凭据：
   ```env
   NEXTCLOUD_URL=https://your-nextcloud-instance.com
   NEXTCLOUD_USERNAME=your-username
   NEXTCLOUD_PASSWORD=your-app-password
   LOCAL_NOTE_DIR=./notes
   ```
4. 使用 `node index.js` 运行工具

## 使用方法

启动工具后，将在您指定的本地目录中创建 4 个笔记文件，命名格式如下：
- d.YYYYMMDD.01.md
- d.YYYYMMDD.02.md
- d.YYYYMMDD.03.md
- d.YYYYMMDD.04.md

每个文件的第一行将是公开共享 URL。您可以分享这些 URL 以提供对笔记的只读访问权限。

每天结束时，按 `Ctrl+C` 关闭工具。它将自动：
1. 移除所有单个笔记共享
2. 创建一个合并所有笔记的每日摘要文件
3. 将摘要上传到 Nextcloud
4. 为摘要文件创建公开共享
5. 在控制台显示摘要共享 URL

## 依赖

- [nextcloud-node-client](https://github.com/nextcloud/nextcloud-node-client) - 用于与 Nextcloud 交互
- [chokidar](https://github.com/paulmillr/chokidar) - 用于监控文件变化
- [dotenv](https://github.com/motdotla/dotenv) - 用于加载环境变量

## 许可证

MIT