<template>
  <div>
    <BasicTable @register="registerTable" class="w-full cicd-baseline-table">
      <template #toolbar>
        <a-button type="primary" preIcon="ant-design:plus-outlined" :disabled="!selectedInstanceId"
          v-auth="'POST:/api/cicd/createJenkinsJob'" @click="handleCreateJob">
          新建服务基线
        </a-button>
        <a-button :disabled="!selectedInstanceId" :loading="syncLoading" preIcon="ant-design:sync-outlined"
          v-auth="['POST:/api/cicd/createJenkinsJob', 'POST:/api/cicd/updateJenkinsJob']" @click="handleManualSync">
          同步远程任务
        </a-button>
      </template>

      <!-- Custom Body Cells: Action Column -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <div @click.stop>
            <TableAction :actions="[
              {
                icon: 'ant-design:caret-right-outlined',
                tooltip:
                  record.canBuild === false
                    ? '当前环境仅具有只读权限，不可触发构建'
                    : record.status === 'BUILDING'
                      ? '当前任务正在构建中，不可重复发起'
                      : '构建部署',
                disabled: record.status === 'BUILDING' || record.canBuild === false,
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
                icon: 'ant-design:file-text-outlined',
                tooltip: '实时日志',
                onClick: () => handleOpenRealtimeLogModal(record),
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
            ]" />
          </div>
        </template>
      </template>
    </BasicTable>

    <!-- Create and Edit drawer -->
    <JobDrawer @register="registerCreateDrawer" @success="reload" />

    <!-- Build parameters modal -->
    <BuildModal @register="registerBuildModal" @confirm="handleConfirmBuild" />

    <!-- Real-time log drawer -->
    <JobLogDrawer @register="registerLogDrawer" @close="reload" @success="reload" />

    <!-- Service baseline live log modal (bin/docker/k8s) -->
    <BaselineRealtimeLogModal ref="realtimeLogModalRef" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useDrawer } from '@/components/Drawer';
import { useModal } from '@/components/Modal';
import {
  getJenkinsInstanceList,
  getJenkinsJobList,
  deleteJenkinsJob,
} from '@/api/cicd';
import { useMessage } from '@/hooks/web/useMessage';
import { useUserStore } from '@/store/modules/user';
import { columns, searchFormSchema } from './job.data';
import JobDrawer from './JobDrawer.vue';
import BuildModal from './BuildModal.vue';
import JobLogDrawer from './JobLogDrawer.vue';
import BaselineRealtimeLogModal from './BaselineRealtimeLogModal.vue';

defineOptions({ name: 'JenkinsJobManagement' });

const { createMessage } = useMessage();
const userStore = useUserStore();
const selectedInstanceId = ref<number | undefined>(undefined);
const syncLoading = ref<boolean>(false);
const instanceOptions = ref<any[]>([]);

let pollBuildingTimer: any = null;

function checkBuildingPolling(items: any[]) {
  const hasBuilding = (items || []).some((item: any) => item.status === 'BUILDING');
  if (hasBuilding) {
    if (!pollBuildingTimer) {
      pollBuildingTimer = setInterval(() => {
        reload();
      }, 3000);
    }
  } else {
    stopBuildingPolling();
  }
}

function stopBuildingPolling() {
  if (pollBuildingTimer) {
    clearInterval(pollBuildingTimer);
    pollBuildingTimer = null;
  }
}

onUnmounted(() => {
  stopBuildingPolling();
});

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
  afterFetch: (items: any[]) => {
    checkBuildingPolling(items);
    return (items || []).map((item: any, idx: number) => ({
      ...item,
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
  canResize: false,
  rowKey: 'id',
  rowSelection: {
    type: 'radio',
  },
  clickToRowSelect: true,
  pagination: {
    pageSize: 20,
    showQuickJumper: true,
  },
  actionColumn: {
    width: 170,
    title: '操作',
    dataIndex: 'action',
    key: 'action',
  },
  scroll: { x: 'max-content' },
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
  checkBuildingPolling([{ status: 'BUILDING' }]);
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

const realtimeLogModalRef = ref<any>(null);

function handleOpenRealtimeLogModal(record: Recordable) {
  realtimeLogModalRef.value?.open(record, selectedInstanceId.value);
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
    await getJenkinsJobList({
      instanceId: selectedInstanceId.value,
      sync: true,
    });
    createMessage.success('远程 Jenkins 状态同步完成！');
    reload();
  } catch {
    createMessage.error('远程同步请求异常');
  } finally {
    syncLoading.value = false;
  }
}
</script>

<style lang="less" scoped>
.cicd-baseline-table {
  :deep(.ant-table-thead > tr > th) {
    white-space: nowrap !important;
  }

  // 1. 安全隐蔽选择列，避免破坏 Ant Design 内部 colgroup 布局与 DOM 同步
  :deep(.ant-table-selection-column),
  :deep(.ant-table-selection-col) {
    width: 0 !important;
    min-width: 0 !important;
    max-width: 0 !important;
    padding: 0 !important;
    border-right: none !important;
    visibility: hidden !important;
    overflow: hidden !important;
  }

  // 2. 跨浏览器 100% 稳定的选中行淡蓝色高亮 (包含常规单元格与固定操作列)
  :deep(.ant-table-tbody > tr.ant-table-row-selected > td),
  :deep(.ant-table-tbody > tr.ant-table-row-selected td) {
    background-color: #e6f7ff !important;
    transition: background-color 0.2s ease;
  }

  :deep(.ant-table-tbody > tr.ant-table-row-selected:hover > td),
  :deep(.ant-table-tbody > tr.ant-table-row-selected:hover td) {
    background-color: #bae7ff !important;
  }

  // 3. 暗色模式兼容适配
  :global([data-theme='dark']) & {
    :deep(.ant-table-tbody > tr.ant-table-row-selected > td),
    :deep(.ant-table-tbody > tr.ant-table-row-selected td) {
      background-color: #111d2c !important;
    }

    :deep(.ant-table-tbody > tr.ant-table-row-selected:hover > td),
    :deep(.ant-table-tbody > tr.ant-table-row-selected:hover td) {
      background-color: #172d47 !important;
    }
  }
}
</style>