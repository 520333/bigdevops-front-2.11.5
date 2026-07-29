<template>
  <a-modal
    v-model:open="visible"
    :title="`容器文件浏览器 (Kuboard 风格): ${podName}`"
    width="80%"
    :footer="null"
    @cancel="handleClose"
  >
    <div class="py-2">
      <!-- 🚀 顶栏：容器选择与路劲导航 -->
      <div class="flex items-center justify-between mb-4 flex-wrap gap-y-2">
        <div class="flex items-center space-x-3">
          <span class="text-sm font-semibold">目标容器:</span>
          <a-select
            v-model:value="selectedContainer"
            style="width: 200px"
            :options="containerOptions"
            @change="loadFileList(currentPath)"
          />
        </div>

        <div class="flex items-center space-x-2">
          <!-- 上传文件 -->
          <a-upload
            :customRequest="handleUpload"
            :showUploadList="false"
          >
            <a-button type="primary">
              <template #icon><upload-outlined /></template>
              上传文件到当前目录
            </a-button>
          </a-upload>

          <!-- 返回上级目录 -->
          <a-button :disabled="currentPath === '/'" @click="handleGoParent">
            <template #icon><arrow-up-outlined /></template>
            返回上级
          </a-button>

          <!-- 刷新 -->
          <a-button @click="loadFileList(currentPath)">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
        </div>
      </div>

      <!-- 🚀 面包屑地址栏与路径直接输入 -->
      <div class="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2.5 rounded border mb-4 gap-x-2">
        <div class="flex items-center space-x-1 flex-1 min-w-0 path-breadcrumb-container text-sm font-medium">
          <span class="text-gray-400 mr-1 shrink-0">当前路径:</span>
          <a-breadcrumb>
            <a-breadcrumb-item>
              <a class="font-bold text-blue-600 dark:text-blue-400 cursor-pointer" @click="loadFileList('/')">
                🏠
              </a>
            </a-breadcrumb-item>
            <a-breadcrumb-item v-for="(seg, idx) in pathSegments" :key="idx">
              <a
                class="cursor-pointer font-medium hover:text-blue-500"
                @click="loadFileList(seg.fullPath)"
              >
                {{ seg.name }}
              </a>
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>

        <div class="flex items-center space-x-2 shrink-0">
          <a-input
            v-model:value="inputPath"
            placeholder="输入路径按回车直达 (例如 /var/log)"
            size="small"
            style="width: 260px"
            @pressEnter="loadFileList(inputPath)"
          />
          <a-button size="small" type="primary" ghost @click="loadFileList(inputPath)">
            跳转
          </a-button>
        </div>
      </div>

      <!-- 🚀 文件列表表格 -->
      <a-table
        :dataSource="fileList"
        :columns="columns"
        :loading="loading"
        :pagination="false"
        size="small"
        bordered
        :scroll="{ y: 460 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="flex items-center space-x-2 cursor-pointer py-1" @click="handleItemClick(record)">
              <span v-if="record.isDir" class="text-yellow-500 text-base">📁</span>
              <span v-else-if="record.mode && record.mode.startsWith('l')" class="text-purple-500 text-base">🔗</span>
              <span v-else class="text-gray-400 text-base">📄</span>
              <span :class="record.isDir ? 'font-semibold text-blue-600 dark:text-blue-400 hover:underline' : 'text-gray-800 dark:text-gray-200'">
                {{ record.name }}
              </span>
            </div>
          </template>

          <template v-if="column.key === 'mode'">
            <span class="font-mono text-xs text-gray-500">{{ record.mode || '-' }}</span>
          </template>

          <template v-if="column.key === 'action'">
            <div class="flex items-center space-x-3" @click.stop>
              <!-- 文件夹/软链接进入 -->
              <a-button v-if="record.isDir || (record.mode && record.mode.startsWith('l'))" size="small" type="link" @click="loadFileList(record.path)">
                打开
              </a-button>

              <!-- 文件预览/在线编辑 -->
              <a-button v-if="!record.isDir" size="small" type="link" @click="handleEditFile(record)">
                编辑/预览
              </a-button>

              <!-- 文件下载 -->
              <a-button v-if="!record.isDir" size="small" type="link" @click="handleDownloadFile(record)">
                下载
              </a-button>

              <!-- 删除 -->
              <a-popconfirm
                :title="`确认删除 ${record.isDir ? '目录' : '文件'} [${record.name}] 吗？`"
                ok-text="删除"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <a-button size="small" type="link" danger>
                  删除
                </a-button>
              </a-popconfirm>
            </div>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 🚀 在线文本文件编辑弹窗 -->
    <a-modal
      v-model:open="editorVisible"
      :title="`在线编辑容器文件: ${editingFilePath}`"
      width="65%"
      :confirmLoading="editorSaving"
      @ok="handleSaveFileContent"
    >
      <div class="mb-2 text-xs text-gray-500">
        已加载前 500KB 文件文本内容，修改后点击确定将直接保存写入容器文件系统。
      </div>
      <div class="border rounded bg-gray-900 overflow-hidden">
        <Codemirror
          v-model="editingContent"
          :style="{ height: '480px' }"
          :extensions="extensions"
        />
      </div>
    </a-modal>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, watch, computed } from 'vue';
  import {
    Modal as AModal,
    Select as ASelect,
    Input as AInput,
    Button as AButton,
    Breadcrumb as ABreadcrumb,
    BreadcrumbItem as ABreadcrumbItem,
    Table as ATable,
    Upload as AUpload,
    Popconfirm as APopconfirm,
  } from 'ant-design-vue';
  import { UploadOutlined, ArrowUpOutlined, ReloadOutlined } from '@ant-design/icons-vue';
  import {
    getK8sPodFileList,
    deleteK8sPodFile,
    readK8sPodFileContent,
    saveK8sPodFileContent,
  } from '@/api/demo/system';
  import { useMessage } from '@/hooks/web/useMessage';
  import { useGlobSetting } from '@/hooks/setting';
  import { getToken } from '@/utils/auth';
  import { Codemirror } from 'vue-codemirror';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { yaml } from '@codemirror/lang-yaml';
  import axios from 'axios';

  const props = defineProps<{
    open: boolean;
    clusterName: string;
    namespace: string;
    podName: string;
    containers: string[];
  }>();

  const emit = defineEmits(['update:open']);
  const globSetting = useGlobSetting();
  const { createMessage } = useMessage();
  const extensions = [yaml(), oneDark];

  const visible = ref(false);
  const loading = ref(false);
  const selectedContainer = ref('');
  const currentPath = ref('/');
  const inputPath = ref('/');
  const fileList = ref<any[]>([]);

  const editorVisible = ref(false);
  const editorSaving = ref(false);
  const editingFilePath = ref('');
  const editingContent = ref('');

  const containerOptions = computed(() =>
    (props.containers || []).map((c) => ({ label: c, value: c })),
  );

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 280, ellipsis: true },
    { title: '大小', dataIndex: 'sizeStr', width: 110 },
    { title: '权限模式', dataIndex: 'mode', key: 'mode', width: 130 },
    { title: '修改时间', dataIndex: 'modTime', width: 170 },
    { title: '操作', key: 'action', width: 180, fixed: 'right' },
  ];

  const pathSegments = computed(() => {
    const raw = currentPath.value.trim();
    if (!raw || raw === '/') return [];
    const parts = raw.split('/').filter(Boolean);
    let acc = '';
    return parts.map((part) => {
      acc += '/' + part;
      return { name: part, fullPath: acc };
    });
  });

  watch(
    () => props.open,
    (val) => {
      visible.value = val;
      if (val) {
        if (props.containers && props.containers.length > 0) {
          selectedContainer.value = props.containers[0];
        } else {
          selectedContainer.value = '';
        }
        currentPath.value = '/';
        inputPath.value = '/';
        loadFileList('/');
      }
    },
  );

  async function loadFileList(targetPath: string) {
    if (!props.clusterName || !props.namespace || !props.podName) return;
    loading.value = true;
    try {
      let cleanPath = targetPath.trim() || '/';
      if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

      // Ensure directory path ends with '/' so Linux ls dereferences directory symlinks properly
      let reqPath = cleanPath;
      if (reqPath !== '/' && !reqPath.endsWith('/')) {
        reqPath += '/';
      }

      currentPath.value = cleanPath;
      inputPath.value = cleanPath;

      const res = await getK8sPodFileList({
        clusterName: props.clusterName,
        namespace: props.namespace,
        name: props.podName,
        container: selectedContainer.value,
        path: reqPath,
      });

      fileList.value = res?.items || [];
    } catch (e: any) {
      console.error(e);
      createMessage.error(e.message || e);
    } finally {
      loading.value = false;
    }
  }

  function handleItemClick(record: any) {
    if (record.isDir || (record.mode && record.mode.startsWith('l'))) {
      loadFileList(record.path);
    } else {
      handleEditFile(record);
    }
  }

  function handleGoParent() {
    if (currentPath.value === '/') return;
    const parts = currentPath.value.split('/').filter(Boolean);
    parts.pop();
    const parent = '/' + parts.join('/');
    loadFileList(parent);
  }

  function handleDownloadFile(record: any) {
    const apiUrl = globSetting.apiUrl || '';
    const token = getToken() || '';
    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

    const downloadUrl = `${cleanApiUrl}/api/k8s/downloadK8sPodFile?clusterName=${encodeURIComponent(
      props.clusterName,
    )}&namespace=${encodeURIComponent(props.namespace)}&name=${encodeURIComponent(
      props.podName,
    )}&container=${encodeURIComponent(
      selectedContainer.value,
    )}&path=${encodeURIComponent(record.path)}&token=${encodeURIComponent(token)}`;

    createMessage.success(`开始下载文件 [${record.name}]...`);
    window.open(downloadUrl, '_blank');
  }

  async function handleEditFile(record: any) {
    try {
      createMessage.loading({ content: `正在读取 [${record.name}] 内容...`, key: 'read_file' });
      const res = await readK8sPodFileContent({
        clusterName: props.clusterName,
        namespace: props.namespace,
        name: props.podName,
        container: selectedContainer.value,
        path: record.path,
      });
      createMessage.destroy('read_file');
      editingFilePath.value = record.path;
      editingContent.value = res?.content || '';
      editorVisible.value = true;
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '读取文本文件失败: ' + (e.message || e), key: 'read_file' });
    }
  }

  async function handleSaveFileContent() {
    editorSaving.value = true;
    try {
      await saveK8sPodFileContent({
        clusterName: props.clusterName,
        namespace: props.namespace,
        name: props.podName,
        container: selectedContainer.value,
        path: editingFilePath.value,
        content: editingContent.value,
      });
      createMessage.success(`文件 [${editingFilePath.value}] 内容已修改保存`);
      editorVisible.value = false;
      loadFileList(currentPath.value);
    } catch (e: any) {
      console.error(e);
      createMessage.error('保存失败: ' + (e.message || e));
    } finally {
      editorSaving.value = false;
    }
  }

  async function handleUpload(options: any) {
    const { file } = options;
    const formData = new FormData();
    formData.append('clusterName', props.clusterName);
    formData.append('namespace', props.namespace);
    formData.append('name', props.podName);
    formData.append('container', selectedContainer.value);
    formData.append('path', currentPath.value);
    formData.append('file', file);

    const apiUrl = globSetting.apiUrl || '';
    const token = getToken() || '';
    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

    try {
      createMessage.loading({ content: `正在上传文件 [${file.name}] 到容器...`, key: 'upload_file' });
      await axios.post(`${cleanApiUrl}/api/k8s/uploadK8sPodFile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: 'Bearer ' + token,
        },
      });
      createMessage.success({ content: `文件 [${file.name}] 成功上传至 ${currentPath.value}`, key: 'upload_file' });
      loadFileList(currentPath.value);
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '上传失败: ' + (e.message || e), key: 'upload_file' });
    }
  }

  async function handleDelete(record: any) {
    try {
      createMessage.loading({ content: `正在删除 [${record.name}]...`, key: 'del_file' });
      await deleteK8sPodFile({
        clusterName: props.clusterName,
        namespace: props.namespace,
        name: props.podName,
        container: selectedContainer.value,
        path: record.path,
      });
      createMessage.success({ content: `删除成功`, key: 'del_file' });
      loadFileList(currentPath.value);
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '删除失败: ' + (e.message || e), key: 'del_file' });
    }
  }

  function handleClose() {
    visible.value = false;
    emit('update:open', false);
  }
</script>

<style scoped>
  .path-breadcrumb-container {
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
  }
  .path-breadcrumb-container::-webkit-scrollbar {
    height: 3px;
  }
  .path-breadcrumb-container::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.15);
    border-radius: 3px;
  }
  .path-breadcrumb-container::-webkit-scrollbar-track {
    background: transparent;
  }
</style>
