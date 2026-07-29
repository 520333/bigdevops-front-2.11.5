<template>
  <PageWrapper dense contentFullHeight contentClass="flex">
    <BasicTable @register="registerTable" class="w-full">
      <template #toolbar>
        <Button type="primary" class="bg-blue-600 hover:bg-blue-500 border-0 shadow-md font-semibold"
          :disabled="!selectedInstanceId" @click="handleCreateJob">
          新建 Jenkins 作业
        </Button>
        <Button :disabled="!selectedInstanceId" @click="reload">
          刷新状态
        </Button>
      </template>

      <!-- Custom Body Cells -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'">
          <span class="font-bold text-gray-800 dark:text-gray-100 font-mono">
            {{ record.name }}
          </span>
        </template>

        <template v-else-if="column.key === 'count'">
          <span v-if="record.count"
            class="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
            #{{ record.count }}
          </span>
          <span v-else class="text-gray-400 text-xs italic">暂无构建</span>
        </template>

        <template v-else-if="column.key === 'status'">
          <span :class="[
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold select-none border',
            (record.status === 'SUCCESS') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-800' :
              (record.status === 'FAILURE') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-800' :
                (record.status === 'BUILDING') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-800 animate-pulse' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'
          ]">
            <span v-if="record.status === 'BUILDING'" class="w-3.5 h-3.5 rounded-full border-2 border-dashed border-blue-600 animate-spin inline-block"></span>
            <span v-else-if="record.status === 'SUCCESS'">●</span>
            <span v-else-if="record.status === 'FAILURE'">●</span>
            <span v-else>●</span>
            {{ record.status || 'NOT_BUILT' }}
          </span>
        </template>

        <!-- Vben 官方 TableAction 操作列机制 (阻止冒泡防止触发行展开) -->
        <template v-else-if="column.key === 'action'">
          <div @click.stop>
            <TableAction :actions="[
              {
                label: '构建部署',
                icon: 'ant-design:play-circle-outlined',
                onClick: (e?: any) => { e?.stopPropagation?.(); handleOpenBuildModal(record); },
              },
              {
                label: '构建日志',
                icon: 'ant-design:code-outlined',
                onClick: (e?: any) => { e?.stopPropagation?.(); handleOpenLogDrawer(record); },
              },
              {
                label: '编辑',
                icon: 'ant-design:edit-outlined',
                onClick: (e?: any) => { e?.stopPropagation?.(); handleEditJob(record); },
              },
              {
                label: '删除',
                icon: 'ant-design:delete-outlined',
                color: 'error',
                disabled: !record.enableDelete || record.status === 'BUILDING',
                popConfirm: {
                  title: `确认从 Jenkins 云端永久删除作业 '${record.name}' 吗？`,
                  confirm: (e?: any) => { e?.stopPropagation?.(); handleDeleteJob(record); },
                },
              },
            ]" />
          </div>
        </template>
      </template>

      <!-- Expandable Detail Row slot -->
      <template #expandedRowRender="{ record }">
        <div
          class="p-4 bg-slate-50 dark:bg-slate-900/90 rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner">
          <div class="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">
            <span class="text-sm font-bold text-blue-900 dark:text-cyan-400 flex items-center gap-2">
              <Icon icon="ant-design:info-circle-outlined" class="text-blue-500" />
              <span>持续集成流水线控制面板 (服务: {{ record.name }})</span>
            </span>
            <span class="text-xs font-mono text-gray-500">
              Jenkins URL: <a v-if="record.url" :href="record.url" target="_blank"
                class="text-cyan-500 hover:underline">{{ record.url }}</a><span v-else>暂无物理配置</span>
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
            <!-- Left panel: Parameters -->
            <div
              class="col-span-1 md:col-span-4 bg-white dark:bg-slate-800 p-3 rounded border border-gray-200 dark:border-slate-700">
              <div
                class="text-xs font-bold text-gray-700 dark:text-gray-200 mb-2 border-b border-gray-100 dark:border-gray-700 pb-1 flex items-center gap-1">
                <Icon icon="ant-design:setting-outlined" class="text-blue-500" />
                <span>具体构建参数</span>
              </div>
              <ul class="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                <li class="flex items-center justify-between">
                  <span>部署类型 (deployType):</span>
                  <span
                    class="font-mono bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 truncate max-w-[180px]">
                    {{ record.deployType || '容器集群' }}
                  </span>
                </li>
                <li class="flex items-center justify-between">
                  <span>部署环境 (deployEnv):</span>
                  <Tag :color="record.deployEnv === 'prod' ? 'red' : record.deployEnv === 'uat' ? 'purple' : 'cyan'">
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
                    class="font-mono bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded border border-green-300 font-semibold">
                    {{ record.gitBranch || 'main' }}
                  </span>
                </li>
              </ul>
            </div>

            <!-- Right panel: Real Jenkins Stage View (Timeline) -->
            <div class="col-span-1 md:col-span-8 bg-white dark:bg-slate-800 p-3 rounded border border-gray-200 dark:border-slate-700">
              <div class="text-xs font-bold text-gray-700 dark:text-gray-200 mb-3 border-b border-gray-100 dark:border-gray-700 pb-1 flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <Icon icon="ant-design:clock-circle-outlined" class="text-cyan-500" />
                  <span>远端 Jenkins Stage View 真实视图 (时间轴)</span>
                  <Tag v-if="stageViewMap[record.name]?.buildNumber && stageViewMap[record.name]?.buildNumber !== '-'" color="blue" class="ml-1 font-mono">
                    {{ stageViewMap[record.name].buildNumber }}
                  </Tag>
                  <Tag v-if="stageViewMap[record.name]?.status === 'IN_PROGRESS' || stageViewMap[record.name]?.status === 'BUILDING' || record.status === 'BUILDING'" color="processing" class="animate-pulse">
                    构建中...
                  </Tag>
                </span>
                <Button size="small" type="link" class="text-xs text-blue-500 p-0 h-auto" @click="fetchStageView(record.name, true)">
                  <template #icon><Icon icon="ant-design:reload-outlined" /></template>
                  刷新阶段
                </Button>
              </div>
              <div class="py-2 px-1">
                <div v-if="stageViewMap[record.name]?.loading" class="flex items-center justify-center py-4 text-xs text-gray-400 gap-2">
                  <Spin size="small" />
                  <span>连线 Jenkins 抓取真实 Stage View 中...</span>
                </div>
                <div v-else-if="stageViewMap[record.name]?.stages && stageViewMap[record.name].stages.length > 0" class="pt-2 px-2 overflow-x-auto">
                  <a-timeline class="custom-stage-timeline text-xs font-mono">
                    <a-timeline-item
                      v-for="stg in stageViewMap[record.name].stages"
                      :key="stg.id"
                      :color="getTimelineColor(stg.status)"
                    >
                      <template #dot>
                        <span v-if="stg.status === 'IN_PROGRESS' || stg.status === 'BUILDING'" class="w-3.5 h-3.5 rounded-full border-2 border-dashed border-blue-500 animate-spin inline-block"></span>
                        <Icon v-else-if="stg.status === 'SUCCESS'" icon="ant-design:check-circle-outlined" class="text-green-500 text-sm" />
                        <Icon v-else-if="stg.status === 'FAILED' || stg.status === 'FAILURE'" icon="ant-design:close-circle-outlined" class="text-red-500 text-sm" />
                        <Icon v-else-if="stg.status === 'ABORTED'" icon="ant-design:minus-circle-outlined" class="text-orange-500 text-sm" />
                        <Icon v-else icon="ant-design:clock-circle-outlined" class="text-gray-400 text-sm" />
                      </template>
                      <div class="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <span class="font-bold text-gray-800 dark:text-gray-200">{{ stg.name }}</span>
                        <Tag :color="getStageTagColor(stg.status)" class="text-[11px] font-semibold px-1.5 py-0 border-0 rounded">
                          {{ stg.status }}
                        </Tag>
                        <span class="text-gray-500 text-[11px] font-mono">⏱ {{ formatDuration(stg.durationMillis) }}</span>
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
  </PageWrapper>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Tag, Timeline as ATimeline, TimelineItem as ATimelineItem, Spin } from 'ant-design-vue';
import { PageWrapper } from '@/components/Page';
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
import { columns, searchFormSchema } from './job.data';
import JobDrawer from './JobDrawer.vue';
import BuildModal from './components/BuildModal.vue';
import JobLogDrawer from './components/JobLogDrawer.vue';

defineOptions({ name: 'JenkinsJobManagement' });

const { createMessage } = useMessage();
const selectedInstanceId = ref<number | undefined>(undefined);
const instanceOptions = ref<any[]>([]);
const stageViewMap = ref<Record<string, { loading: boolean; buildNumber?: string; status?: string; stages?: any[] }>>({});
const timerMap = ref<Record<string, any>>({});

const [registerCreateDrawer, { openDrawer: openCreateDrawer }] = useDrawer();
const [registerBuildModal, { openModal: openBuildModal }] = useModal();
const [registerLogDrawer, { openDrawer: openLogDrawer }] = useDrawer();

const [registerTable, { reload, getForm }] = useTable({
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
  columns,
  showIndexColumn: false,
  formConfig: {
    labelWidth: 100,
    schemas: searchFormSchema,
    autoSubmitOnEnter: true,
  },
  useSearchForm: true,
  showTableSetting: true,
  bordered: false,
  expandRowByClick: true,
  canResize: true,
  onExpandedRowsChange: (keys: any[]) => {
    if (Array.isArray(keys) && keys.length > 0) {
      keys.forEach((key) => {
        const name = String(key);
        if (name && !stageViewMap.value[name]?.loading && (!stageViewMap.value[name]?.stages || stageViewMap.value[name]?.stages.length === 0)) {
          fetchStageView(name, true);
        }
      });
    }
  },
  pagination: {
    current: 1,
    pageSize: 10,
    showQuickJumper: true,
    showSizeChanger: true,
  },
  rowKey: 'name',
  actionColumn: { width: 320, title: '运维与安全防护', dataIndex: 'action', key: 'action', fixed: 'right' },
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

async function fetchStageView(jobNameKey: string, manual = false) {
  if (!jobNameKey || !selectedInstanceId.value) return;

  const shortJobName = jobNameKey.includes('/') ? jobNameKey.split('/').pop()! : jobNameKey;
  const folder = jobNameKey.includes('/') ? jobNameKey.split('/')[0] : '';

  if (!stageViewMap.value[jobNameKey]) {
    stageViewMap.value[jobNameKey] = { loading: true, stages: [] };
  } else if (manual) {
    stageViewMap.value[jobNameKey].loading = true;
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
    stageViewMap.value[jobNameKey] = {
      loading: false,
      buildNumber: res?.buildNumber || '-',
      status: buildStatus,
      stages,
    };

    const isBuilding = buildStatus === 'IN_PROGRESS' || buildStatus === 'BUILDING' || stages.some((s: any) => s.status === 'IN_PROGRESS' || s.status === 'BUILDING');
    if (isBuilding) {
      startStagePolling(jobNameKey);
    } else {
      stopStagePolling(jobNameKey);
    }
  } catch (err) {
    stageViewMap.value[jobNameKey] = { ...stageViewMap.value[jobNameKey], loading: false };
    stopStagePolling(jobNameKey);
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

async function handleExpandRow(expanded: boolean, record: Recordable) {
  if (!record?.name) return;
  if (expanded) {
    fetchStageView(record.name, true);
  } else {
    stopStagePolling(record.name);
  }
}

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
  } catch (err) { }
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
    record.gitBranch = data.branch;
    record.deployEnv = data.deployEnv;
    record.deployType = data.deployType;
    record.gitRepo = data.gitRepo;
    record.status = 'BUILDING';
  }
  if (data.jobName) {
    setTimeout(() => {
      fetchStageView(data.jobName, true);
    }, 1500);
  }
  openLogDrawer(true, {
    instanceId: selectedInstanceId.value,
    jobName: data.jobName,
    folder: data.folder,
    projectName: data.projectName || data.folder,
    branch: data.branch,
    deployEnv: data.deployEnv,
    deployType: data.deployType,
    gitRepo: data.gitRepo,
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
    const folder = record.folder || record.projectName || (jobNameKey.includes('/') ? jobNameKey.split('/')[0] : '');

    await deleteJenkinsJob({
      instanceId: selectedInstanceId.value,
      jobName: shortJobName,
      folder: folder,
      projectName: folder,
    });
    createMessage.success(`作业【${jobNameKey}】已成功从远端及系统删除！`);
    reload();
  } catch (err) { }
}
</script>
