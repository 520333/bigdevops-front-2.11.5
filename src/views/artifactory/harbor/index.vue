<template>
  <PageWrapper
    title="镜像仓库 (Harbor)"
    content="统一纳管 Harbor 容器镜像仓库，在线查看项目、服务镜像列表、版本标签 (Tags) 与一键复制 Docker Pull 命令"
  >
    <!-- 顶部操作栏 -->
    <Card class="mb-4" :bordered="false">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <Space wrap :size="16">
          <div class="flex items-center gap-2">
            <span class="font-bold text-gray-700">Harbor 项目:</span>
            <Select
              v-model:value="selectedProject"
              style="width: 220px"
              :options="projectOptions"
              :loading="loadingProjects"
              @change="handleProjectChange"
              placeholder="请选择 Harbor 项目"
            />
          </div>

          <InputSearch
            v-model:value="searchKeyword"
            placeholder="搜索镜像仓库名称..."
            style="width: 260px"
            allow-clear
            @search="handleSearch"
          />

          <Button type="primary" preIcon="ant-design:plus-outlined" @click="handleOpenCreateProject">
            新建项目
          </Button>

          <Button type="default" preIcon="ant-design:reload-outlined" :loading="loadingRepos" @click="fetchRepositories">
            刷新
          </Button>
        </Space>

        <Space>
          <a
            v-if="harborBaseUrl"
            :href="harborBaseUrl"
            target="_blank"
            class="ant-btn ant-btn-default inline-flex items-center gap-1"
          >
            <span>直达 Harbor 原生控制台</span>
            <ExportOutlined />
          </a>
        </Space>
      </div>
    </Card>

    <!-- 镜像列表表格 -->
    <Card :bordered="false">
      <Table
        :columns="columns"
        :data-source="filteredRepoList"
        :loading="loadingRepos"
        row-key="id"
        size="middle"
        :pagination="{ pageSize: 15, showTotal: (total: number) => `共 ${total} 个镜像仓库` }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="flex items-center gap-2">
              <span class="text-blue-500 text-lg">
                <CodeSandboxOutlined />
              </span>
              <span class="font-bold text-gray-800">{{ record.name }}</span>
            </div>
          </template>

          <template v-else-if="column.key === 'fullPath'">
            <code class="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-mono">
              {{ getFullRepoPath(record.name) }}
            </code>
          </template>

          <template v-else-if="column.key === 'artifact_count'">
            <Tag color="cyan">{{ record.artifact_count }} 个版本</Tag>
          </template>

          <template v-else-if="column.key === 'pull_count'">
            <span class="text-gray-600">{{ record.pull_count }} 次</span>
          </template>

          <template v-else-if="column.key === 'update_time'">
            <span class="text-gray-500 text-xs">{{ formatDate(record.update_time) }}</span>
          </template>

          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleOpenArtifacts(record)">
                查看版本 (Tags)
              </Button>
              <Button type="link" size="small" @click="handleCopyLatest(record)">
                复制拉取命令
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 版本抽屉 -->
    <ArtifactDrawer @register="registerArtifactDrawer" @success="fetchRepositories" />

    <!-- 创建项目弹窗 -->
    <CreateProjectModal @register="registerCreateModal" @success="handleCreateProjectSuccess" />
  </PageWrapper>
</template>

<script lang="ts" setup>
  import { ref, computed, onMounted } from 'vue';
  import { PageWrapper } from '@/components/Page';
  import { Card, Space, Select, InputSearch, Button, Table, Tag, message } from 'ant-design-vue';
  import { CodeSandboxOutlined, ExportOutlined } from '@ant-design/icons-vue';
  import { useDrawer } from '@/components/Drawer';
  import { useModal } from '@/components/Modal';
  import ArtifactDrawer from './ArtifactDrawer.vue';
  import CreateProjectModal from './CreateProjectModal.vue';
  import {
    getHarborConfigApi,
    getHarborProjectsApi,
    getHarborRepositoriesApi,
    HarborProject,
    HarborRepo,
  } from '@/api/artifactory/harbor';
  import { copyText } from '@/utils/copyTextToClipboard';

  const [registerArtifactDrawer, { openDrawer: openArtifactDrawer }] = useDrawer();
  const [registerCreateModal, { openModal: openCreateModal }] = useModal();

  const harborBaseUrl = ref('');
  const loadingProjects = ref(false);
  const loadingRepos = ref(false);
  const selectedProject = ref('');
  const searchKeyword = ref('');
  const projectList = ref<HarborProject[]>([]);
  const repoList = ref<HarborRepo[]>([]);

  const projectOptions = computed(() => {
    return projectList.value.map((p) => ({
      label: p.name,
      value: p.name,
    }));
  });

  const columns = [
    { title: '镜像服务名称', key: 'name', width: 240 },
    { title: '镜像完整路径', key: 'fullPath', width: 340 },
    { title: '版本数量', key: 'artifact_count', width: 120 },
    { title: '拉取次数', key: 'pull_count', width: 110 },
    { title: '更新时间', key: 'update_time', width: 180 },
    { title: '操作', key: 'action', width: 200, align: 'center' },
  ];

  const filteredRepoList = computed(() => {
    if (!searchKeyword.value) return repoList.value;
    const kw = searchKeyword.value.trim().toLowerCase();
    return repoList.value.filter((r) => r.name.toLowerCase().includes(kw));
  });

  function getFullRepoPath(name: string) {
    const host = harborBaseUrl.value ? harborBaseUrl.value.replace(/^https?:\/\//, '') : 'harbor.cathayquantum.net';
    return `${host}/${name}`;
  }

  onMounted(async () => {
    await initConfig();
    await fetchProjects();
  });

  async function initConfig() {
    try {
      const cfg = await getHarborConfigApi();
      if (cfg && cfg.baseUrl) {
        harborBaseUrl.value = cfg.baseUrl;
      }
    } catch {
      // 忽略
    }
  }

  async function fetchProjects() {
    try {
      loadingProjects.value = true;
      const res = await getHarborProjectsApi({ page: 1, pageSize: 100 });
      projectList.value = res || [];
      if (projectList.value.length > 0 && !selectedProject.value) {
        selectedProject.value = projectList.value[0].name;
        await fetchRepositories();
      }
    } catch (e: any) {
      message.error(e?.message || '获取 Harbor 项目列表失败');
    } finally {
      loadingProjects.value = false;
    }
  }

  async function fetchRepositories() {
    if (!selectedProject.value) return;
    try {
      loadingRepos.value = true;
      const res = await getHarborRepositoriesApi({
        projectName: selectedProject.value,
        pageSize: 100,
      });
      repoList.value = res || [];
    } catch (e: any) {
      message.error(e?.message || '获取镜像仓库列表失败');
    } finally {
      loadingRepos.value = false;
    }
  }

  function handleProjectChange() {
    searchKeyword.value = '';
    fetchRepositories();
  }

  function handleSearch() {
    // 依赖 filteredRepoList 响应式过滤
  }

  function handleOpenCreateProject() {
    openCreateModal(true);
  }

  async function handleCreateProjectSuccess(newProjectName: string) {
    await fetchProjects();
    if (newProjectName) {
      selectedProject.value = newProjectName;
      await fetchRepositories();
    }
  }

  function handleOpenArtifacts(record: HarborRepo) {
    openArtifactDrawer(true, {
      projectName: selectedProject.value,
      repoName: record.name,
      harborHost: harborBaseUrl.value,
    });
  }

  function handleCopyLatest(record: HarborRepo) {
    const cmd = `docker pull ${getFullRepoPath(record.name)}:latest`;
    copyText(cmd, `已复制命令: ${cmd}`);
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('zh-CN', { hour12: false });
    } catch {
      return dateStr;
    }
  }
</script>
