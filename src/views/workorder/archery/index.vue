<template>
  <div class="p-4">
    <!-- 顶部导航与全局操作栏 (独立卡片) -->
    <div
      class="bg-white dark:bg-[#151515] px-4 py-3 mb-4 rounded-md shadow-sm border border-gray-100 dark:border-zinc-800 flex justify-between items-center"
    >
      <div class="flex items-center space-x-3">
        <div
          class="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center border border-blue-100 dark:border-blue-800"
        >
          <Icon icon="ant-design:console-sql-outlined" class="text-blue-600 text-xl" />
        </div>
        <div>
          <div class="font-bold text-base text-gray-800 dark:text-gray-200">SQL 工单审计中心</div>
          <div class="text-xs text-gray-400 dark:text-gray-500">
            查询、Inception 合规检测、多级审批流转、上线执行与回滚全流程跟踪
          </div>
        </div>
      </div>
      <Space>
        <Button
          v-if="archeryConfig.baseUrl"
          type="default"
          preIcon="ant-design:export-outlined"
          @click="handleOpenArcheryWeb"
        >
          打开 Archery 控制台
        </Button>
        <Button type="default" preIcon="ant-design:reload-outlined" @click="handleRefreshAll">
          刷新数据
        </Button>
        <Button
          type="primary"
          preIcon="ant-design:plus-outlined"
          @click="openCreateDrawer(true, {})"
        >
          发起 SQL 变更
        </Button>
      </Space>
    </div>

    <!-- SQL 工单管理列表 (Vben 标准卡片化：检索卡片与表格卡片自动独立分层) -->
    <div>
      <BasicTable @register="registerTable">
        <template #bodyCell="{ column, record }">
          <!-- 点击工单标题呼出详情抽屉 -->
          <template v-if="column.dataIndex === 'workflow_name'">
            <a class="text-blue-600 hover:underline font-medium" @click="handleOpenDetail(record)">
              {{ record.workflow?.workflow_name }}
            </a>
          </template>

          <!-- 操作列 (Vben 规范 TableAction) -->
          <template v-if="column.key === 'action'">
            <TableAction
              :actions="[
                {
                  label: '详情',
                  icon: 'clarity:info-standard-line',
                  onClick: handleOpenDetail.bind(null, record),
                },
                {
                  label: '通过',
                  icon: 'ant-design:check-outlined',
                  color: 'success',
                  ifShow: record.workflow?.status === 'workflow_manreviewing',
                  popConfirm: {
                    title: '确认审批通过该工单？',
                    confirm: handleAuditConfirm.bind(null, record, 'pass'),
                  },
                },
                {
                  label: '执行',
                  icon: 'ant-design:play-circle-outlined',
                  ifShow: record.workflow?.status === 'workflow_review_pass',
                  popConfirm: {
                    title: '确认立即执行上线？',
                    confirm: handleExecuteConfirm.bind(null, record),
                  },
                },
                {
                  label: '终止',
                  icon: 'ant-design:stop-outlined',
                  color: 'error',
                  ifShow: ['workflow_manreviewing', 'workflow_review_pass'].includes(
                    record.workflow?.status || '',
                  ),
                  popConfirm: {
                    title: '确认终止该工单？',
                    confirm: handleAuditConfirm.bind(null, record, 'cancel'),
                  },
                },
              ]"
            />
          </template>
        </template>
      </BasicTable>
    </div>

    <!-- 新建工单抽屉 (形态 A：抽离为高内聚抽屉，既可从本页发起，也可从工单门户直接呼出) -->
    <CreateWorkflowDrawer @register="registerCreateDrawer" @success="handleSuccessReload" />

    <!-- 工单详情抽屉 -->
    <WorkflowDetailDrawer @register="registerDetailDrawer" @success="handleSuccessReload" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Button, Space, Modal, message } from 'ant-design-vue';
import Icon from '@/components/Icon/Icon.vue';
import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useDrawer } from '@/components/Drawer';
import CreateWorkflowDrawer from './CreateWorkflowDrawer.vue';
import WorkflowDetailDrawer from './WorkflowDetailDrawer.vue';
import { columns, searchFormSchema } from './archery.data';
import {
  getArcheryConfigApi,
  getArcheryWorkflowsApi,
  auditArcheryWorkflowApi,
  executeArcheryWorkflowApi,
  type ArcheryConfig,
} from '@/api/workorder/archery';

const archeryConfig = ref<ArcheryConfig>({ enable: false, baseUrl: '' });

// Vben 规范 useTable 注册
const [registerTable, { reload: reloadTable }] = useTable({
  title: 'SQL工单列表',
  api: getArcheryWorkflowsApi,
  columns,
  useSearchForm: true,
  showIndexColumn: false,
  formConfig: {
    labelWidth: 95,
    schemas: searchFormSchema,
    autoSubmitOnEnter: true,
    submitOnChange: true,
  },
  beforeFetch: (params: Record<string, any>) => {
    // 联动转换 RangePicker 的起止时间参数
    if (
      params.dateRange &&
      Array.isArray(params.dateRange) &&
      params.dateRange.length === 2 &&
      params.dateRange[0] &&
      params.dateRange[1]
    ) {
      params.startTime = params.dateRange[0];
      params.endTime = params.dateRange[1];
    } else {
      delete params.startTime;
      delete params.endTime;
    }
    delete params.dateRange;
    return params;
  },
  showTableSetting: true,
  bordered: true,
  actionColumn: {
    width: 330,
    title: '操作',
    dataIndex: 'action',
    fixed: 'right',
  },
});

// 抽屉注册
const [registerCreateDrawer, { openDrawer: openCreateDrawer }] = useDrawer();
const [registerDetailDrawer, { openDrawer: openDetailDrawer }] = useDrawer();

// 获取配置
const fetchConfig = async () => {
  try {
    const res = await getArcheryConfigApi();
    if (res) archeryConfig.value = res;
  } catch (e) {
    console.warn('获取 Archery 配置失败', e);
  }
};

// 打开工单详情
const handleOpenDetail = (record: any) => {
  openDetailDrawer(true, { record });
};

// 快捷审批与终止
const handleAuditConfirm = (record: any, auditType: 'pass' | 'cancel') => {
  const isPass = auditType === 'pass';
  const wfId = record.workflow_id || record.id;
  Modal.confirm({
    title: isPass ? '确认审批通过该工单？' : '确认终止该工单？',
    content: isPass
      ? `工单标题: ${record.workflow?.workflow_name}，审批通过后将推进至待上线状态。`
      : '工单终止后将不可再次执行上线。',
    okText: isPass ? '通过' : '终止',
    okType: isPass ? 'primary' : 'danger',
    onOk: async () => {
      try {
        const res = await auditArcheryWorkflowApi({
          workflowId: wfId,
          auditType,
          auditRemark: isPass ? '审批通过' : '终止工单',
        });
        message.success(res?.message || (isPass ? '审批通过成功' : '工单已终止'));
        reloadTable();
      } catch (e: any) {
        message.error(e?.message || '操作失败');
      }
    },
  });
};

// 快捷执行上线
const handleExecuteConfirm = (record: any) => {
  const wfId = record.workflow_id || record.id;
  Modal.confirm({
    title: '确认立即执行上线？',
    content: `目标库: [${record.workflow?.db_name}]，将向数据库立即执行工单内的 SQL 语句。`,
    okText: '立即执行',
    onOk: async () => {
      try {
        const res = await executeArcheryWorkflowApi({
          workflowId: wfId,
          mode: 'auto',
        });
        message.success(res?.message || '已触发执行，请查看执行结果');
        reloadTable();
      } catch (e: any) {
        message.error(e?.message || '执行失败');
      }
    },
  });
};

// 打开 Archery 原生 Web
const handleOpenArcheryWeb = () => {
  if (archeryConfig.value.baseUrl) {
    window.open(archeryConfig.value.baseUrl, '_blank');
  }
};

// 全量刷新
const handleRefreshAll = () => {
  reloadTable();
};

const handleSuccessReload = () => {
  reloadTable();
};

onMounted(() => {
  fetchConfig();
});
</script>
