const http = require("http");
const path = require("path");
const fse = require("fs-extra");
const multiparty = require("multiparty");

const server = http.createServer();
const UPLOAD_DIR = path.resolve(__dirname, ".", `qiepian`); // 切片存储目录

server.on("request", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS") {
        res.status = 200;
        res.end();
        return;
    }
    console.log(req.url)

    if (req.url === '/upload') {
        const multipart = new multiparty.Form();

        multipart.parse(req, async (err, fields, files) => {
            if (err) {
                console.log('errrrr', err)
                return;
            }
            const [file] = files.file;
            const [fileName] = fields.fileName;
            const [chunkName] = fields.chunkName;
            // 保存切片的文件夹的路径，比如  张远-嘉宾.flac-chunks
            const chunkDir = path.resolve(UPLOAD_DIR, `${fileName}-chunks`);
            // // 切片目录不存在，创建切片目录
            if (!fse.existsSync(chunkDir)) {
                await fse.mkdirs(chunkDir);
            }
            // 把切片移动到切片文件夹
            await fse.move(file.path, `${chunkDir}/${chunkName}`);
            res.end(
                JSON.stringify({
                    code: 0,
                    message: "切片上传成功"
                }));
        });
    }
})

server.listen(3000, () => console.log("正在监听 3000 端口"));
