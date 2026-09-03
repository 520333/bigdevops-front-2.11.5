<template>
  <PageWrapper title="制品与配置文件管理" content="在线管理项目下的 k8s yaml、Dockerfile、compose.yml、nginx.conf、sh 脚本及编译产物 jar 包">
    <div class="bg-white p-4 rounded-md shadow-sm mb-4">
      <Space wrap>
        <span class="font-bold">选择项目 / 仓库:</span>
        <Select v-model:value="selectedProject" style="width: 280px" :options="repoOptions" :loading="loadingRepos"
          @change="fetchTree" placeholder="请选择项目仓库" />
        <Button type="primary" preIcon="ant-design:reload-outlined" @click="fetchTree" :loading="loadingTree">
          刷新
        </Button>
        <Button type="primary" preIcon="ant-design:upload-outlined" @click="handleOpenUpload"
          v-auth="'POST:/api/artifactory/upload'">
          上传文件/构件
        </Button>
      </Space>
    </div>

    <div class="flex gap-4 min-h-600px">
      <!-- 左侧：目录与文件树 -->
      <Card title="文件与构件树" class="w-1/3 min-w-300px">
        <Spin :spinning="loadingTree">
          <div v-if="treeData.length === 0" class="text-center py-10 text-gray-400">
            暂无文件或未查找到对应构件
          </div>
          <Tree v-else :tree-data="treeData" :field-names="{ title: 'title', key: 'path', children: 'children' }"
            :show-icon="false" :default-expand-all="true" @select="handleSelectNode" class="artifactory-tree">
            <template #title="{ title, isFolder, extension }">
              <span class="inline-flex items-center gap-2 py-1 select-none">
                <FolderOutlined v-if="isFolder" class="text-amber-500 text-base" />
                <CodeOutlined v-else-if="['yaml', 'yml'].includes(extension)" class="text-blue-500 text-base" />
                <ContainerOutlined v-else-if="extension === 'dockerfile'" class="text-cyan-500 text-base" />
                <CodeOutlined v-else-if="extension === 'sh'" class="text-emerald-500 text-base" />
                <CodeOutlined v-else-if="['py', 'pyw'].includes(extension)" class="text-sky-500 text-base" />
                <FileZipOutlined v-else-if="['jar', 'war', 'zip', 'tar', 'gz'].includes(extension)"
                  class="text-purple-500 text-base" />
                <FileTextOutlined v-else class="text-gray-400 text-base" />
                <span class="text-sm font-medium">{{ title }}</span>
              </span>
            </template>
          </Tree>
        </Spin>
      </Card>

      <!-- 右侧：编辑/展示面板 -->
      <Card title="配置编辑 / 构件详情" class="flex-1 flex flex-col">
        <div v-if="!activeFile" class="text-center py-20 text-gray-400">
          请从左侧选择需要查看或编辑的配置文件或 .jar 包
        </div>

        <!-- 文本文件在线编辑器 -->
        <div v-else-if="!isBinary" class="flex flex-col h-full">
          <div class="flex justify-between items-center pb-3 border-b mb-3">
            <span class="font-bold text-base flex items-center gap-2">
              <CodeOutlined /> {{ activeFile.path }}
            </span>
            <Space>
              <Button type="primary" preIcon="ant-design:save-outlined" @click="handleSaveFile" :loading="savingFile"
                v-auth="'POST:/api/artifactory/save'">
                保存修改
              </Button>
              <Button preIcon="ant-design:download-outlined" @click="handleDownloadActiveFile"
                v-auth="'GET:/api/artifactory/download'">
                下载文件
              </Button>
              <Button danger preIcon="ant-design:delete-outlined" @click="handleOpenDeleteModal"
                v-auth="'POST:/api/artifactory/delete'">
                删除
              </Button>
            </Space>
          </div>

          <Spin :spinning="loadingContent" class="flex-1">
            <div class="border rounded overflow-hidden">
              <Codemirror v-model="fileContent" placeholder="请在此编辑配置文件..." :style="{ height: '560px' }"
                :extensions="editorExtensions" />
            </div>
          </Spin>
        </div>

        <!-- 二进制 Jar 包卡片面板 -->
        <div v-else class="py-4 overflow-y-auto max-h-680px">
          <Descriptions title="构件通用信息 (General Info)" bordered :column="2" size="small">
            <DescriptionsItem label="仓库项目 (Repo)">{{ selectedProject }}</DescriptionsItem>
            <DescriptionsItem label="构件名称 (Name)">{{ activeFile.title }}</DescriptionsItem>
            <DescriptionsItem label="Repository Path" :span="2">
              <span class="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{{ activeFileDetail?.repoPath ||
                `${selectedProject}/${activeFile.path}` }}</span>
            </DescriptionsItem>
            <DescriptionsItem label="Deployed By">{{ activeFileDetail?.createdBy || 'admin' }}</DescriptionsItem>
            <DescriptionsItem label="文件大小 (Size)">{{ activeFileDetail?.sizeFormatted || formatSize(activeFile.size) }}
            </DescriptionsItem>
            <DescriptionsItem label="Created (创建时间)">{{ activeFileDetail?.created || '未知' }}</DescriptionsItem>
            <DescriptionsItem label="Last Modified (最后修改)">{{ activeFileDetail?.lastModified || '未知' }}
            </DescriptionsItem>
            <DescriptionsItem label="Downloads (下载次数)">
              <Tag color="blue">{{ activeFileDetail?.downloads ?? 0 }} 次</Tag>
            </DescriptionsItem>
            <DescriptionsItem label="Last Downloaded By">{{ activeFileDetail?.lastDownloadedBy || '无记录' }}
            </DescriptionsItem>
            <DescriptionsItem label="Last Downloaded" :span="2">{{ activeFileDetail?.lastDownloaded || '无记录' }}
            </DescriptionsItem>
            <DescriptionsItem label="URL to file" :span="2">
              <a :href="activeFileDetail?.downloadUri" target="_blank" class="text-blue-500 break-all hover:underline">
                {{ activeFileDetail?.downloadUri }}
              </a>
            </DescriptionsItem>
          </Descriptions>

          <!-- Checksums 校验码 -->
          <Descriptions title="哈希校验码 (Checksums)" bordered :column="1" size="small" class="mt-4">
            <DescriptionsItem label="SHA-1">
              <code class="text-xs bg-gray-100 p-1 rounded font-mono select-all text-gray-800">{{
                activeFileDetail?.checksums?.sha1 || 'N/A' }}</code>
            </DescriptionsItem>
            <DescriptionsItem label="SHA-256">
              <code class="text-xs bg-gray-100 p-1 rounded font-mono select-all text-gray-800">{{
                activeFileDetail?.checksums?.sha256 || 'N/A' }}</code>
            </DescriptionsItem>
            <DescriptionsItem label="MD5">
              <code class="text-xs bg-gray-100 p-1 rounded font-mono select-all text-gray-800">{{
                activeFileDetail?.checksums?.md5 || 'N/A' }}</code>
            </DescriptionsItem>
          </Descriptions>

          <div class="mt-6 flex gap-4">
            <Button type="primary" preIcon="ant-design:download-outlined" @click="handleDownloadActiveFile"
              v-auth="'GET:/api/artifactory/download'">
              下载制品
            </Button>
            <Button preIcon="ant-design:upload-outlined" @click="handleOpenUpload"
              v-auth="'POST:/api/artifactory/upload'">
              上传新版本替代
            </Button>
            <Button danger preIcon="ant-design:delete-outlined" @click="handleOpenDeleteModal"
              v-auth="'POST:/api/artifactory/delete'">
              删除制品
            </Button>
          </div>
        </div>
      </Card>
    </div>

    <!-- 上传 Modal -->
    <UploadModal @register="registerUploadModal" @success="fetchTree" />
    <!-- Diff 修改对比确认 Modal -->
    <DiffModal @register="registerDiffModal" @confirm="executeSaveFile" />
    <!-- 高危删除二次输入文件名强校验 Modal -->
    <DeleteConfirmModal @register="registerDeleteModal" @confirm="executeDeleteFile" />
  </PageWrapper>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import {
  Card,
  Space,
  Select,
  Button,
  Popconfirm,
  Spin,
  Tree,
  Tag,
  Descriptions,
  DescriptionsItem,
} from 'ant-design-vue';
import {
  FolderOutlined,
  ContainerOutlined,
  CodeOutlined,
  FileZipOutlined,
  FileTextOutlined,
} from '@ant-design/icons-vue';
import { PageWrapper } from '@/components/Page';
import { Codemirror } from 'vue-codemirror';
import { StreamLanguage, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { yaml } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { nginx } from '@codemirror/legacy-modes/mode/nginx';
import { python } from '@codemirror/legacy-modes/mode/python';
import { useModal } from '@/components/Modal';
import UploadModal from './UploadModal.vue';
import DiffModal from './DiffModal.vue';
import DeleteConfirmModal from './DeleteConfirmModal.vue';
import {
  getArtifactoryReposApi,
  getArtifactoryFileInfoApi,
  getArtifactoryTreeApi,
  getArtifactoryContentApi,
  saveArtifactoryContentApi,
  deleteArtifactoryFileApi,
  downloadArtifactoryFileApi,
  ArtifactoryItem,
  ArtifactoryFileDetail,
} from '@/api/artifactory/artifactory';
import { useMessage } from '@/hooks/web/useMessage';

export default defineComponent({
  name: 'ArtifactoryManageIndex',
  components: {
    PageWrapper,
    Card,
    Space,
    Select,
    Button,
    Popconfirm,
    Spin,
    Tree,
    Tag,
    Descriptions,
    DescriptionsItem,
    FolderOutlined,
    ContainerOutlined,
    CodeOutlined,
    FileZipOutlined,
    FileTextOutlined,
    Codemirror,
    UploadModal,
    DiffModal,
    DeleteConfirmModal,
  },
  setup() {
    const { createMessage } = useMessage();
    const selectedProject = ref<string>('');
    const repoOptions = ref<{ label: string; value: string }[]>([]);
    const loadingRepos = ref(false);
    const treeData = ref<any[]>([]);
    const loadingTree = ref(false);

    const activeFile = ref<any>(null);
    const activeFileDetail = ref<ArtifactoryFileDetail | null>(null);
    const isBinary = ref(false);
    const fileContent = ref<string>('');
    const originalContent = ref<string>('');
    const loadingContent = ref(false);
    const savingFile = ref(false);

    const [registerUploadModal, { openModal: openUploadModal }] = useModal();
    const [registerDiffModal, { openModal: openDiffModal }] = useModal();
    const [registerDeleteModal, { openModal: openDeleteModal }] = useModal();

    // 根据当前文件匹配多语言语法高亮扩展 (Dockerfile, Shell, Nginx, YAML)
    const editorExtensions = computed(() => {
      const base = [oneDark, syntaxHighlighting(defaultHighlightStyle)];
      if (!activeFile.value) return base;
      const ext = (activeFile.value.extension || '').toLowerCase();
      const title = (activeFile.value.title || '').toLowerCase();

      if (['yaml', 'yml'].includes(ext)) {
        return [...base, yaml()];
      }
      if (ext === 'sh' || ext === 'bash' || title.endsWith('.sh')) {
        return [...base, StreamLanguage.define(shell)];
      }
      if (title === 'dockerfile' || title.endsWith('dockerfile') || ext === 'dockerfile') {
        return [...base, StreamLanguage.define(dockerFile)];
      }
      if (ext === 'conf' || title.includes('nginx')) {
        return [...base, StreamLanguage.define(nginx)];
      }
      if (ext === 'py' || ext === 'pyw' || title.endsWith('.py')) {
        return [...base, StreamLanguage.define(python)];
      }
      return base;
    });



    // 递归构建 Ant Design Tree 节点格式
    const buildTreeNodes = (items: ArtifactoryItem[], parentPath = ''): any[] => {
      if (!items || !Array.isArray(items)) return [];

      return items.map((item) => {
        const rawUri = item.uri || '';
        let name = rawUri.substring(rawUri.lastIndexOf('/') + 1);
        if (!name) name = rawUri;

        const currentPath = parentPath ? `${parentPath}/${name}` : name;
        const isFolder = item.folder || false;

        let ext = '';
        if (!isFolder && name.includes('.')) {
          ext = name.substring(name.lastIndexOf('.') + 1).toLowerCase();
        } else if (name.toLowerCase() === 'dockerfile') {
          ext = 'dockerfile';
        }

        return {
          title: name,
          path: item.path || currentPath,
          isFolder: isFolder,
          extension: ext,
          size: item.size || 0,
          lastModified: item.lastModified,
          isLeaf: !isFolder,
          children: item.children ? buildTreeNodes(item.children, currentPath) : undefined,
        };
      });
    };

    // 加载目录树
    const fetchTree = async () => {
      if (!selectedProject.value) {
        createMessage.warning('请输入项目名称');
        return;
      }
      loadingTree.value = true;
      try {
        const res = await getArtifactoryTreeApi({ project: selectedProject.value });
        if (res && res.children) {
          treeData.value = buildTreeNodes(res.children);
        } else {
          treeData.value = [];
        }
        activeFile.value = null;
        fileContent.value = '';
      } catch (err: any) {
        createMessage.error(`加载配置树失败: ${err?.message || err}`);
        treeData.value = [];
      } finally {
        loadingTree.value = false;
      }
    };

    // 点击选中目录树中的节点
    const handleSelectNode = async (_selectedKeys: any, e: any) => {
      const node = e.node;
      if (!node || node.isFolder) return;

      activeFile.value = node;
      activeFileDetail.value = null;
      const ext = node.extension;

      // 异步拉取丰富元数据信息 (Created, DeployedBy, Downloads, Checksums 等)
      getArtifactoryFileInfoApi({
        project: selectedProject.value,
        path: node.path,
      }).then((detail) => {
        activeFileDetail.value = detail;
      }).catch((err) => {
        console.warn('拉取文件详细元数据失败', err);
      });

      // 判断是否为二进制包
      if (['jar', 'war', 'zip', 'tar', 'gz'].includes(ext)) {
        isBinary.value = true;
        fileContent.value = '';
      } else {
        isBinary.value = false;
        loadingContent.value = true;
        try {
          const content = await getArtifactoryContentApi({
            project: selectedProject.value,
            path: node.path,
          });
          fileContent.value = content || '';
          originalContent.value = content || '';
        } catch (err: any) {
          createMessage.error(`读取文件内容失败: ${err?.message || err}`);
        } finally {
          loadingContent.value = false;
        }
      }
    };

    // 点击【保存修改】按钮，触发 Diff 对比检查
    const handleSaveFile = () => {
      if (!activeFile.value || isBinary.value) return;

      if (originalContent.value === fileContent.value) {
        createMessage.info('配置文件内容未发生任何修改，无需保存！');
        return;
      }

      // 打开 Diff 对比确认弹窗
      openDiffModal(true, {
        path: activeFile.value.path,
        originalContent: originalContent.value,
        fileContent: fileContent.value,
      });
    };

    // 在 Diff 弹窗点击确认后真正提交保存
    const executeSaveFile = async () => {
      if (!activeFile.value) return;
      savingFile.value = true;
      try {
        await saveArtifactoryContentApi({
          project: selectedProject.value,
          path: activeFile.value.path,
          content: fileContent.value,
        });
        originalContent.value = fileContent.value;
        createMessage.success(`配置文件 [${activeFile.value.title}] 修改并保存成功！`);
      } catch (err: any) {
        createMessage.error(`保存失败: ${err?.message || err}`);
      } finally {
        savingFile.value = false;
      }
    };

    // 下载文件
    const handleDownloadActiveFile = async () => {
      if (!activeFile.value) return;
      try {
        await downloadArtifactoryFileApi(
          {
            project: selectedProject.value,
            path: activeFile.value.path,
          },
          activeFile.value.title,
        );
        createMessage.success(`文件 [${activeFile.value.title}] 开始下载...`);
      } catch (err: any) {
        createMessage.error(`文件下载失败: ${err?.message || err}`);
      }
    };

    // 打开防误删强校验弹窗
    const handleOpenDeleteModal = () => {
      if (!activeFile.value) return;
      openDeleteModal(true, {
        filename: activeFile.value.title,
      });
    };

    // 在弹窗中校验输入文件名一致后真正执行删除
    const executeDeleteFile = async () => {
      if (!activeFile.value) return;
      try {
        await deleteArtifactoryFileApi({
          project: selectedProject.value,
          path: activeFile.value.path,
        });
        createMessage.success(`制品/文件 [${activeFile.value.title}] 已彻底删除！`);
        activeFile.value = null;
        fileContent.value = '';
        fetchTree();
      } catch (err: any) {
        createMessage.error(`删除失败: ${err?.message || err}`);
      }
    };


    // 打开上传弹窗
    const handleOpenUpload = () => {
      if (!selectedProject.value) {
        createMessage.warning('请输入项目名称');
        return;
      }
      openUploadModal(true, {
        project: selectedProject.value,
        path: activeFile.value && activeFile.value.isFolder ? activeFile.value.path : '',
      });
    };

    // 格式化文件大小
    const formatSize = (bytes: number) => {
      if (!bytes || bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    };

    // 自动获取全量仓库列表
    const fetchRepos = async () => {
      loadingRepos.value = true;
      try {
        const list = await getArtifactoryReposApi();
        if (list && Array.isArray(list)) {
          repoOptions.value = list.map((item) => ({
            label: item.key,
            value: item.key,
          }));
          if (repoOptions.value.length > 0) {
            selectedProject.value = repoOptions.value[0].value;
            fetchTree();
          }
        }
      } catch (err: any) {
        createMessage.error(`获取仓库列表失败: ${err?.message || err}`);
      } finally {
        loadingRepos.value = false;
      }
    };

    onMounted(() => {
      fetchRepos();
    });

    return {
      selectedProject,
      repoOptions,
      loadingRepos,
      treeData,
      loadingTree,
      activeFile,
      activeFileDetail,
      isBinary,
      fileContent,
      loadingContent,
      savingFile,
      editorExtensions,
      fetchRepos,
      fetchTree,
      handleSelectNode,
      handleSaveFile,
      handleDownloadActiveFile,
      handleOpenDeleteModal,
      executeDeleteFile,
      handleOpenUpload,
      registerUploadModal,
      registerDiffModal,
      registerDeleteModal,
      executeSaveFile,
      formatSize,
    };
  },
});
</script>
