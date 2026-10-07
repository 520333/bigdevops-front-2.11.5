<template>
  <div>
    <BasicTable @register="registerTable" class="w-full cicd-baseline-table">
      <template #toolbar>
        <a-button
          type="primary"
          preIcon="ant-design:plus-outlined"
          :disabled="!selectedInstanceId"
          v-auth="'POST:/api/cicd/createJenkinsJob'"
          @click="handleCreateJob"
        >
          新建服务基线
        </a-button>
        <a-button
          :disabled="!selectedInstanceId"
          :loading="syncLoading"
          preIcon="ant-design:sync-outlined"
          @click="handleManualSync"
        >
          同步远程任务
        </a-button>
      </template>

      <!-- Custom Body Cells: Action Column -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <div @click.stop>
            <TableAction
              :actions="[
                {
                  icon: 'ant-design:play-circle-outlined',
                  tooltip:
                    record.status === 'BUILDING' ? '当前任务正在构建中，不可重复发起' : '构建部署',
                  disabled: record.status === 'BUILDING',
                  auth: 'POST:/api/cicd/triggerJenkinsBuild',
                  onClick: () => handleOpenBuildModal(record),
                },
                {
                  icon: 'ant-design:code-outlined',
                  tooltip: '构建日志',
                  auth: 'GET:/api/cicd/getJenkinsBuildLogs',
                  onClick: () => handleOpenLogDrawer(record),
                },
                {
                  icon: 'ant-design:edit-outlined',
                  tooltip: '编辑配置',
                  auth: 'POST:/api/cicd/updateJenkinsJob',
                  onClick: () => handleEditJob(record),
                },
                {
                  icon: 'ant-design:delete-outlined',
                  color: 'error',
                  tooltip:
                    record.enableDelete !== 1 ? '已锁定禁止删除 (请在编辑中开启)' : '删除作业',
                  disabled: record.enableDelete !== 1 || record.status === 'BUILDING',
                  auth: 'DELETE:/api/cicd/deleteJenkinsJob',
                  popConfirm: {
                    title: `确认删除服务基线作业 [${record.name}] 吗？`,
                    placement: 'left',
                    confirm: () => handleDeleteJob(record),
                  },
                },
              ]"
            />
          </div>
        </template>
      </template>

      <!-- Expandable Detail Row slot -->
      <template #expandedRowRender="{ record }">
        <div
          class="p-4 bg-slate-50/60 dark:bg-slate-900/60 rounded-md border border-slate-200 dark:border-slate-800 transition-all w-full max-w-full overflow-hidden box-border"
        >
          <div
            class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-800 pb-2 mb-4"
          >
            <span
              class="text-sm font-bold text-blue-900 dark:text-cyan-400 flex items-center gap-2 shrink-0"
            >
              <Icon icon="ant-design:info-circle-outlined" class="text-blue-500" />
              <span>持续集成流水线控制面板 (服务: {{ record.name }})</span>
            </span>
            <span
              class="text-xs font-mono text-gray-500 flex items-center gap-1 min-w-0 max-w-md truncate"
              :title="record.url"
            >
              <span class="shrink-0">Jenkins URL:</span>
              <a
                v-if="record.url"
                :href="record.url"
                target="_blank"
                class="text-cyan-500 hover:underline truncate"
                >{{ record.url }}</a
              ><span v-else>暂无物理配置</span>
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-12 gap-4 min-w-0 w-full">
            <!-- Left panel: Parameters -->
            <div
              class="col-span-1 md:col-span-4 min-w-0 bg-white dark:bg-slate-800 p-3 rounded border border-gray-200 dark:border-slate-700"
            >
              <div
                class="text-xs font-bold text-gray-700 dark:text-gray-200 mb-2 border-b border-gray-100 dark:border-gray-700 pb-1 flex items-center gap-1"
              >
                <Icon icon="ant-design:setting-outlined" class="text-blue-500" />
                <span>具体构建参数</span>
              </div>
              <ul class="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                <li class="flex items-center justify-between">
                  <span>部署环境 (deployEnv):</span>
                  <Tag
                    :color="
                      record.deployEnv === 'prod'
                        ? 'red'
                        : record.deployEnv === 'uat'
                          ? 'purple'
                          : 'cyan'
                    "
                  >
                    {{ record.deployEnv || 'dev' }}
                  </Tag>
                </li>
                <li class="flex items-center justify-between">
                  <span>项目空间 (projectName):</span>
                  <span class="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                    {{ record.projectName || record.folder || '/' }}
                  </span>
                </li>
                <li class="flex items-center justify-between">
                  <span>编译分支 (gitBranch):</span>
                  <span
                    class="font-mono bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded border border-green-300 font-semibold"
                  >
                    {{ record.gitBranch || 'main' }}
                  </span>
                </li>
                <li class="flex items-center justify-between" v-if="record.lastBuildTime">
                  <span>最后构建时间:</span>
                  <span class="font-mono text-gray-700 dark:text-gray-300 text-xs">
                    {{
                      String(record.lastBuildTime)
                        .replace('T', ' ')
                        .replace(/\..*$/, '')
                        .replace('Z', '')
                    }}
                  </span>
                </li>
              </ul>
            </div>

            <!-- Right panel: Real Jenkins Stage View (Timeline) -->
            <div
              class="col-span-1 md:col-span-8 min-w-0 bg-white dark:bg-slate-800 p-3 rounded border border-gray-200 dark:border-slate-700"
            >
              <div
                class="text-xs font-bold text-gray-700 dark:text-gray-200 mb-3 border-b border-gray-100 dark:border-gray-700 pb-1 flex items-center justify-between gap-2"
              >
                <span class="flex items-center gap-1.5 shrink-0">
                  <Icon icon="ant-design:clock-circle-outlined" class="text-cyan-500" />
                  <span>远端 Jenkins Stage View 真实视图 (时间轴)</span>
                  <Tag
                    v-if="
                      stageViewMap[getJobKey(record)]?.buildNumber &&
                      stageViewMap[getJobKey(record)]?.buildNumber !== '-'
                    "
                    color="blue"
                    class="ml-1 font-mono"
                  >
                    {{ stageViewMap[getJobKey(record)].buildNumber }}
                  </Tag>
                  <Tag
                    v-if="
                      stageViewMap[getJobKey(record)]?.status === 'IN_PROGRESS' ||
                      stageViewMap[getJobKey(record)]?.status === 'BUILDING' ||
                      record.status === 'BUILDING'
                    "
                    color="processing"
                    class="animate-pulse"
                  >
                    构建中...
                  </Tag>
                </span>
                <Button
                  size="small"
                  type="link"
                  class="text-xs text-blue-500 p-0 h-auto shrink-0"
                  @click="fetchStageView(getJobKey(record), true, record)"
                >
                  <template #icon>
                    <Icon icon="ant-design:reload-outlined" />
                  </template>
                  刷新阶段
                </Button>
              </div>
              <div class="py-2 px-1 min-w-0">
                <div
                  v-if="stageViewMap[getJobKey(record)]?.loading"
                  class="flex items-center justify-center py-4 text-xs text-gray-400 gap-2"
                >
                  <Spin size="small" />
                  <span>连线 Jenkins 抓取真实 Stage View 中...</span>
                </div>
                <div
                  v-else-if="
                    stageViewMap[getJobKey(record)]?.stages &&
                    stageViewMap[getJobKey(record)].stages.length > 0
                  "
                  class="pt-2 px-2 overflow-x-auto max-w-full"
                >
                  <a-timeline class="custom-stage-timeline text-xs font-mono">
                    <a-timeline-item
                      v-for="stg in stageViewMap[getJobKey(record)].stages"
                      :key="stg.id"
                      :color="getTimelineColor(stg.status)"
                    >
                      <template #dot>
                        <span
                          v-if="stg.status === 'IN_PROGRESS' || stg.status === 'BUILDING'"
                          class="w-3.5 h-3.5 rounded-full border-2 border-dashed border-blue-500 animate-spin inline-block"
                        ></span>
                        <Icon
                          v-else-if="stg.status === 'SUCCESS'"
                          icon="ant-design:check-circle-outlined"
                          class="text-green-500 text-sm"
                        />
                        <Icon
                          v-else-if="stg.status === 'FAILED' || stg.status === 'FAILURE'"
                          icon="ant-design:close-circle-outlined"
                          class="text-red-500 text-sm"
                        />
                        <Icon
                          v-else-if="stg.status === 'ABORTED'"
                          icon="ant-design:minus-circle-outlined"
                          class="text-orange-500 text-sm"
                        />
                        <Icon
                          v-else
                          icon="ant-design:clock-circle-outlined"
                          class="text-gray-400 text-sm"
                        />
                      </template>
                      <div
                        class="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-800 shadow-2xs"
                      >
                        <span class="font-bold text-gray-800 dark:text-gray-200">{{
                          stg.name
                        }}</span>
                        <Tag
                          :color="getStageTagColor(stg.status)"
                          class="text-[11px] font-semibold px-1.5 py-0 border-0 rounded"
                        >
                          {{ stg.status }}
                        </Tag>
                        <span class="text-gray-500 text-[11px] font-mono"
                          >⏱ {{ formatDuration(stg.durationMillis) }}</span
                        >
                      </div>
                    </a-timeline-item>
                  </a-timeline>
                </div>
                <div v-else class="text-xs text-gray-400 py-3 text-center italic">
                  暂无远端 Stage View 运行记录
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </BasicTable>

    <!-- Create and Edit drawer -->
    <JobDrawer @register="registerCreateDrawer" @success="reload" />

    <!-- Build parameters modal -->
    <BuildModal @register="registerBuildModal" @confirm="handleConfirmBuild" />

    <!-- Real-time log drawer -->
    <JobLogDrawer @register="registerLogDrawer" @close="reload" />
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import { Tag, Timeline as ATimeline, TimelineItem as ATimelineItem, Spin } from 'ant-design-vue';
  import { Button } from '@/components/Button';
  import Icon from '@/components/Icon/Icon.vue';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import { useDrawer } from '@/components/Drawer';
  import { useModal } from '@/components/Modal';
  import {
    getJenkinsInstanceList,
    getJenkinsJobList,
    deleteJenkinsJob,
    getJenkinsJobStageView,
  } from '@/api/cicd';
  import { useMessage } from '@/hooks/web/useMessage';
  import { useUserStore } from '@/store/modules/user';
  import { columns, searchFormSchema } from './job.data';
  import JobDrawer from './JobDrawer.vue';
  import BuildModal from './BuildModal.vue';
  import JobLogDrawer from './JobLogDrawer.vue';

  defineOptions({ name: 'JenkinsJobManagement' });

  const { createMessage } = useMessage();
  const userStore = useUserStore();
  const selectedInstanceId = ref<number | undefined>(undefined);
  const syncLoading = ref<boolean>(false);
  const instanceOptions = ref<any[]>([]);
  const stageViewMap = ref<
    Record<string, { loading: boolean; buildNumber?: string; status?: string; stages?: any[] }>
  >({});
  const timerMap = ref<Record<string, any>>({});
  const expandedRowKey = ref<string>('');

  function getJobKey(record: Recordable): string {
    if (!record) return '';
    return record.id
      ? String(record.id)
      : `${record.projectName || record.folder || ''}/${record.name || ''}`;
  }

  const [registerCreateDrawer, { openDrawer: openCreateDrawer }] = useDrawer();
  const [registerBuildModal, { openModal: openBuildModal }] = useModal();
  const [registerLogDrawer, { openDrawer: openLogDrawer }] = useDrawer();

  const [registerTable, { reload, getForm, getDataSource }] = useTable({
    title: '服务基线列表',
    api: async (params) => {
      if (!params?.instanceId) return [];
      const res: any = await getJenkinsJobList({
        instanceId: params.instanceId,
        name: params.name,
        projectName: params.projectName,
        status: params.status,
        gitRepo: params.gitRepo,
        deployEnv: params.deployEnv,
        lang: params.lang,
        keyword: params.keyword,
      });
      return res?.items || res || [];
    },
    afterFetch: (items: any[]) => {
      return (items || []).map((item: any, idx: number) => ({
        ...item,
        // 确保每行具备全局唯一且为基本类型的 id 字段
        id: item.id
          ? String(item.id)
          : `${item.projectName || item.folder || 'root'}/${item.name || idx}`,
      }));
    },
    columns,
    formConfig: {
      labelWidth: 100,
      schemas: searchFormSchema,
      autoSubmitOnEnter: true,
    },
    useSearchForm: true,
    showTableSetting: true,
    bordered: true,
    showIndexColumn: false,
    accordion: true,
    expandRowByClick: true,
    canResize: false,
    rowKey: 'id',
    rowClassName: (record: Recordable) => {
      return String(record.id) === expandedRowKey.value ? 'ant-table-row-selected' : '';
    },
    onExpandedRowsChange: (keys: any[]) => {
      const currentKey = keys && keys.length > 0 ? String(keys[keys.length - 1]) : '';
      expandedRowKey.value = currentKey;
      if (currentKey) {
        if (
          !stageViewMap.value[currentKey]?.loading &&
          (!stageViewMap.value[currentKey]?.stages ||
            stageViewMap.value[currentKey]?.stages.length === 0)
        ) {
          const list = getDataSource?.() || [];
          const targetRecord = list.find((item: any) => String(item.id) === currentKey);
          fetchStageView(currentKey, true, targetRecord);
        }
      }
    },
    pagination: {
      pageSize: 100,
      showQuickJumper: true,
    },
    actionColumn: {
      width: 140,
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      fixed: 'right',
    },
  });

  function getTimelineColor(status: string) {
    if (status === 'SUCCESS') return 'green';
    if (status === 'IN_PROGRESS' || status === 'BUILDING') return 'blue';
    if (status === 'FAILED' || status === 'FAILURE') return 'red';
    if (status === 'ABORTED') return 'orange';
    return 'gray';
  }

  function getStageTagColor(status: string) {
    if (status === 'SUCCESS') return 'success';
    if (status === 'IN_PROGRESS' || status === 'BUILDING') return 'processing';
    if (status === 'FAILED' || status === 'FAILURE') return 'error';
    if (status === 'ABORTED') return 'warning';
    return 'default';
  }

  function formatDuration(ms: number) {
    if (!ms || ms <= 0) return '未执行';
    if (ms < 1000) return `${ms}ms`;
    const sec = (ms / 1000).toFixed(1);
    return `${sec}s`;
  }

  async function fetchStageView(jobKey: string, manual = false, record?: any) {
    if (!jobKey || !selectedInstanceId.value) return;

    if (!record) {
      const list = getDataSource?.() || [];
      record = list.find((item: any) => getJobKey(item) === jobKey);
    }

    const shortJobName = record?.name || (jobKey.includes('/') ? jobKey.split('/').pop()! : jobKey);
    const folder =
      record?.projectName || record?.folder || (jobKey.includes('/') ? jobKey.split('/')[0] : '');

    if (!stageViewMap.value[jobKey]) {
      stageViewMap.value[jobKey] = { loading: true, stages: [] };
    } else if (manual) {
      stageViewMap.value[jobKey].loading = true;
    }

    try {
      const res: any = await getJenkinsJobStageView({
        instanceId: selectedInstanceId.value,
        jobName: shortJobName,
        folder: folder,
        projectName: folder,
      });
      const stages = res?.stages || [];
      const buildStatus = res?.status || 'UNKNOWN';
      stageViewMap.value[jobKey] = {
        loading: false,
        buildNumber: res?.buildNumber || '-',
        status: buildStatus,
        stages,
      };

      const isBuilding =
        buildStatus === 'IN_PROGRESS' ||
        buildStatus === 'BUILDING' ||
        stages.some((s: any) => s.status === 'IN_PROGRESS' || s.status === 'BUILDING');
      if (isBuilding) {
        startStagePolling(jobKey);
      } else {
        stopStagePolling(jobKey);
      }
    } catch {
      stageViewMap.value[jobKey] = { ...stageViewMap.value[jobKey], loading: false };
      stopStagePolling(jobKey);
    }
  }

  function startStagePolling(jobName: string) {
    if (timerMap.value[jobName]) return;
    timerMap.value[jobName] = setInterval(() => {
      fetchStageView(jobName, false);
    }, 2500);
  }

  function stopStagePolling(jobName: string) {
    if (timerMap.value[jobName]) {
      clearInterval(timerMap.value[jobName]);
      delete timerMap.value[jobName];
    }
  }

  function clearAllPolling() {
    Object.keys(timerMap.value).forEach((jobName) => {
      stopStagePolling(jobName);
    });
  }

  onUnmounted(() => {
    clearAllPolling();
  });

  onMounted(async () => {
    try {
      const res: any = await getJenkinsInstanceList();
      const list = res?.items || res || [];
      instanceOptions.value = list.map((item: any) => ({
        label: `${item.name} (${item.env})`,
        value: item.id,
      }));

      if (instanceOptions.value.length > 0) {
        const defaultId = instanceOptions.value[0].value;
        selectedInstanceId.value = defaultId;
        const form = getForm();
        if (form) {
          form.updateSchema({
            field: 'instanceId',
            componentProps: {
              options: instanceOptions.value,
              onChange: (val: number) => {
                selectedInstanceId.value = val;
                reload();
              },
            },
          });
          form.setFieldsValue({ instanceId: defaultId });
        }
        reload();
      }
    } catch {
      // ignore
    }
  });

  function handleCreateJob() {
    if (!selectedInstanceId.value) {
      createMessage.warning('请先选择 Jenkins 实例');
      return;
    }
    openCreateDrawer(true, {
      isUpdate: false,
      instanceId: selectedInstanceId.value,
    });
  }

  function handleEditJob(record: Recordable) {
    if (!selectedInstanceId.value) return;
    openCreateDrawer(true, {
      isUpdate: true,
      instanceId: selectedInstanceId.value,
      record,
    });
  }

  function handleOpenBuildModal(record: Recordable) {
    if (!selectedInstanceId.value) return;
    openBuildModal(true, {
      instanceId: selectedInstanceId.value,
      record,
    });
  }

  function handleConfirmBuild(data: any) {
    if (!selectedInstanceId.value) return;
    const record = data.record;
    if (record) {
      record.status = 'BUILDING';
      if (data.branch) {
        record.gitBranch = data.branch;
      }
    }
    if (data.jobName) {
      setTimeout(() => {
        fetchStageView(data.jobName, true);
      }, 1500);
    }
    const currentUser = userStore.getUserInfo?.username || userStore.getUserInfo?.realName || '';
    openLogDrawer(true, {
      instanceId: selectedInstanceId.value,
      jobName: data.jobName,
      folder: data.folder,
      projectName: data.projectName || data.folder,
      branch: data.branch || '',
      customParams: data.customParams,
      createUserName: currentUser,
      triggerBuild: true,
    });
  }

  function handleOpenLogDrawer(record: Recordable) {
    if (!selectedInstanceId.value) return;
    openLogDrawer(true, {
      instanceId: selectedInstanceId.value,
      jobName: record.name,
      folder: record.folder || record.projectName,
      projectName: record.projectName || record.folder,
      buildNumber: record.count || 0,
      triggerBuild: false,
    });
  }

  async function handleDeleteJob(record: Recordable) {
    if (!selectedInstanceId.value) return;
    try {
      const jobNameKey = record.name || '';
      const shortJobName = jobNameKey.includes('/') ? jobNameKey.split('/').pop()! : jobNameKey;
      const folder =
        record.folder ||
        record.projectName ||
        (jobNameKey.includes('/') ? jobNameKey.split('/')[0] : '');

      await deleteJenkinsJob({
        instanceId: selectedInstanceId.value,
        jobName: shortJobName,
        folder: folder,
        projectName: folder,
      });
      createMessage.success(`作业 [${jobNameKey}] 删除成功！`);
      reload();
    } catch {
      // ignore
    }
  }

  async function handleManualSync() {
    if (!selectedInstanceId.value) return;
    syncLoading.value = true;
    try {
      await getJenkinsJobList({ instanceId: selectedInstanceId.value, sync: true });
      createMessage.success('已完成与 Jenkins 远端的镜像比对，同步刷新成功！');
      reload();
    } catch (err: any) {
      createMessage.error('同步失败: ' + (err?.message || err));
    } finally {
      syncLoading.value = false;
    }
  }
</script>

<style lang="less" scoped>
  .cicd-baseline-table {
    :deep(.ant-table-tbody) {
      // Vben 官方规范：通过主题主色 @primary-color 透明度渐变高亮当前展开/选中行，深浅模式及自定义主色自动平滑适配
      > tr.ant-table-row-selected > td,
      > tr:has(.ant-table-row-expand-icon-expanded) > td {
        background-color: fade(@primary-color, 8%) !important;
        transition: background-color 0.2s ease;
      }

      > tr.ant-table-row-selected:hover > td,
      > tr:has(.ant-table-row-expand-icon-expanded):hover > td {
        background-color: fade(@primary-color, 14%) !important;
      }
    }

    // Vben 官方规范：展开行面板底色使用 @component-background，暗黑模式自动融入无缝隙
    :deep(.ant-table-expanded-row) {
      > td {
        background-color: @component-background !important;
        padding: 12px 16px !important;
        box-sizing: border-box;
        max-width: 0;
      }
    }
  }
</style>
