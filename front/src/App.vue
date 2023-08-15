<template>
  <div>
       <input type="file" @change="handleFileChange" />
       <el-button @click="handleUpload">upload</el-button>
     </div>
</template>
 ​
<script>
export default {
  data: () => ({
    container: {
      file: null
    }
  }),
  methods: {
    handleFileChange(e) {
      const [file] = e.target.files;
      if (!file) return;
      Object.assign(this.$data, this.$options.data());
      this.container.file = file;
    },
    handleUpload() {
      const fileObj = this.fileObj
      if (!fileObj.file) return
      const chunkList = this.createChunk(fileObj.file)
      console.log(chunkList) // 看看chunkList长什么样子
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
    }
  }
};
</script>
 