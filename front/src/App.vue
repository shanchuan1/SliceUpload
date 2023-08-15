<template>
  <div>
       <input type="file" @change="handleFileChange" />
       <el-button @click="handleUpload">upload</el-button>
     </div>
</template>
 ​
<script>
import axiosRequest from './util/axios'

export default {
  data: () => ({
    fileObj: {
      file: null
    }
  }),
  methods: {
    handleFileChange(e) {
      const [file] = e.target.files
      if (!file) return
      this.fileObj.file = file
    },
    handleUpload() {
      const fileObj = this.fileObj
      if (!fileObj.file) return
      const chunkList = this.createChunk(fileObj.file)
      console.log(chunkList) // 看看chunkList长什么样子
      this.fileObj.chunkList = chunkList.map(({ file }, index) => ({
        file,
        size: file.size,
        chunkName: `${fileObj.file.name}-${index}`,
        fileName: fileObj.file.name,
        index,
      }));
      this.uploadChunks(); // 执行上传切片的操作
    },
    createChunk(file, size = 5 * 1024 * 1024) {
      const chunkList = []
      let cur = 0
      while (cur < file.size) {
        // 使用slice方法切片
        chunkList.push({ file: file.slice(cur, cur + size) })
        cur += size
      }
      return chunkList
    },

    // 上传所有切片
     async uploadChunks() {
      const requestList = this.fileObj.chunkList
        .map(({ file, fileName, index, chunkName }) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("fileName", fileName);
          formData.append("chunkName", chunkName);
          return { formData, index };
        })
        .map(({ formData, index }) =>
          this.axiosRequest({
            url: "http://localhost:3000/upload",
            data: formData,
            onUploadProgress: this.createProgressHandler(
              this.fileObj.chunkList[index]
            ), // 传入监听上传进度回调
          })
        );
      await Promise.all(requestList); // 使用Promise.all进行请求
    },
    createProgressHandler(item) {
      return (e) => {
        // 设置每一个切片的进度百分比
        item.percent = parseInt(String((e.loaded / e.total) * 100));
      };
    },

  }
};
</script>
 