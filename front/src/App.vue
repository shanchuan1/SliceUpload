<template>
  <div>
       <input type="file" @change="handleFileChange" />
       <el-button @click="handleUpload">upload</el-button>
      <el-button @click="pauseUpload"> 暂停 </el-button>
      <el-button @click="keepUpload"> 续传 </el-button>
  </div>
  <div style="width: 300px">
    总进度：
    <el-progress :percentage="totalPercent"></el-progress>
    切片进度：
    <div v-for="item in fileObj?.chunkList" :key="item">
      <span>{{ item.chunkName }}：</span>
      <el-progress :percentage="item.percent"></el-progress>
    </div>
    <!-- 总进度：
    <el-progress :percentage="tempPercent"></el-progress> -->
  </div>
</template>
 ​
<script>
import { reactive, computed, watch  } from 'vue';
import { axiosRequest, pauseUpload } from './util/axios'
export default {
  setup() {
    const fileObj = reactive({
      file: null,
      chunkList: []
    })

    // 选择文件
    const handleFileChange = (e) => {
      const [file] = e.target.files
      if (!file) return
      console.log(fileObj.file)
      fileObj.file = file
      console.log(fileObj.file)
    }
    // 提交上传
    const handleUpload = async () => {
      if (!fileObj.file) return

      // 先发请求判断后端有没这个文件
      const { shouldUpload } = await verifyUpload(
        fileObj.file.name,
      );
      if (!shouldUpload) {
        alert("秒传：上传成功");
        return;
      }

      const chunkList = createChunk(fileObj.file)
      console.log(chunkList) // 看看chunkList长什么样子
      fileObj.chunkList = chunkList.map(({ file }, index) => ({
        file,
        size: file.size,
        percent: 0,
        chunkName: `${fileObj.file.name}-${index}`,
        fileName: fileObj.file.name,
        index,
      }));
      console.log(fileObj)
      console.log(fileObj.chunkList)
      uploadChunks(); // 执行上传切片的操作
    }
    // 判断是否秒传
    const verifyUpload = async (fileName) => {
      const { data } = await axiosRequest({
        url: "http://localhost:3000/verify",
        headers: {
          "content-type": "application/json",
        },
        data: JSON.stringify({
          fileName,
        }),
      });
      return data
    }

    // 文件进行切片
    const createChunk = (file, size = 5 * 1024 * 1024) => {
      const chunkList = []
      let cur = 0
      while (cur < file.size) {
        // 使用slice方法切片
        chunkList.push({ file: file.slice(cur, cur + size) })
        cur += size
      }
      return chunkList
    }

    // 上传所有切片
    const uploadChunks = async () => {
      const requestList = fileObj.chunkList
        .map(({ file, fileName, index, chunkName }) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("fileName", fileName);
          formData.append("chunkName", chunkName);
          console.log('formData', formData)
          return { formData, index };
        })
        .map(({ formData, index }) => axiosRequest({
          url: "http://localhost:3000/upload",
          data: formData,
          onUploadProgress: createProgressHandler(
            fileObj.chunkList[index]
          ), // 传入监听上传进度回调
        })

        );
      await Promise.all(requestList); // 使用Promise.all进行请求

      mergeChunks()
    }
    const createProgressHandler = (item) => {
      return (e) => {
        // 设置每一个切片的进度百分比
        item.percent = parseInt(String((e.loaded / e.total) * 100));
      };
    }

    // 计算切片进度
    const totalPercent = computed(() => {
      // const fileObj = this.fileObj;
      if (fileObj.chunkList?.length === 0) return 0;
      const loaded = fileObj.chunkList
        ?.map(({ size, percent }) => size * percent)
        ?.reduce((pre, next) => pre + next);
      return parseInt((loaded / fileObj.file?.size).toFixed(2));
    })

    // 向后端发送合并切片的请求
    const mergeChunks = (size = 5 * 1024 * 1024) => {
      axiosRequest({
        url: "http://localhost:3000/merge",
        headers: {
          "content-type": "application/json",
        },
        data: JSON.stringify({
          size,
          fileName: fileObj.file.name
        }),
      });
    }

    // 续传
    const keepUpload = async () => {
      const { uploadedList } = await verifyUpload(
        fileObj.file.name
      );
      uploadChunks(uploadedList);
    }

    // watch(totalPercent, (newValue, oldValue) => {
    //   if (newValue > oldValue) totalPercent = newValue
    // })

    return {
      handleFileChange,
      handleUpload,
      totalPercent,
      keepUpload,
      fileObj
    };
  },
};
</script>
 