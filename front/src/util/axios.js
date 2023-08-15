import axios from "axios";

const CancelToken = axios.CancelToken;
const source = CancelToken.source();

 function axiosRequest({
    url,
    method = "post",
    data,
    headers = {},
    onUploadProgress = (e) => e, // 进度回调
}) {
    return new Promise((resolve, reject) => {
        axios[method](url, data, {
            headers,
            onUploadProgress, // 传入监听进度回调
            cancelToken: source.token
        })
            .then((res) => {
                resolve(res);
            })
            .catch((err) => {
                reject(err);
            });
    });
}

 function pauseUpload() {
    source.cancel("中断上传!");
    source = CancelToken.source(); // 重置source，确保能续传
}
export {
    axiosRequest,
    pauseUpload
}