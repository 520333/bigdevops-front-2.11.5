<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" title="SQL 工单详情" width="60%" :isDetail="true"
    :showOkBtn="false" :showCancelBtn="false">
    <!-- Vben 规范: 抽屉顶部操作栏 -->
    <template #titleToolbar>
      <Space>
        <Button v-if="canShowPassAction(detail?.workflow)" type="primary"
          style="background-color: #52c41a; border-color: #52c41a;" :loading="operating" @click="handleAudit('pass')">
          审批通过
        </Button>
        <Button v-if="detail?.workflow?.status === 'workflow_review_pass'" type="primary" :loading="operating"
          @click="handleExecute">
          立即执行上线
        </Button>
        <Button v-if="['workflow_manreviewing', 'workflow_review_pass'].includes(detail?.workflow?.status || '')" danger
          :loading="operating" @click="handleAudit('cancel')">
          终止工单
        </Button>
      </Space>
    </template>

    <div v-if="detail" class="p-2 space-y-3">
      <!-- 原生双 Tab 切换：工单详情 / 工单日志 -->
      <Tabs v-model:activeKey="activeDrawerTab" size="small" class="mb-1">
        <TabPane key="detail" tab="工单详情" />
        <TabPane key="logs" tab="工单日志" />
      </Tabs>

      <!-- TAB 1: 工单详情 (遵循 Vben 规范，紧凑清爽) -->
      <div v-show="activeDrawerTab === 'detail'" class="space-y-3">
        <!-- 1. Vben 规范 Description 描述列表组件 -->
        <Description size="small" :column="3" :data="detail" :schema="workflowDescSchema"
          class="border border-gray-100 dark:border-zinc-800 rounded-md overflow-hidden bg-white dark:bg-[#151515]" />

        <!-- 2. SQL 脚本 (默认折叠，不霸占首屏空间) -->
        <Collapse ghost class="bg-gray-50 dark:bg-zinc-900/40 rounded border border-gray-100 dark:border-zinc-800">
          <CollapsePanel key="sql" header="查看提交的完整 SQL 脚本">
            <template #extra>
              <Button type="link" size="small" @click.stop="copyText(detail.sql_content)">
                复制完整 SQL
              </Button>
            </template>
            <div class="border border-gray-200 dark:border-zinc-800 rounded overflow-hidden">
              <Codemirror v-model="detail.sql_content" :disabled="true" :style="{ height: '160px' }"
                :extensions="[oneDark]" />
            </div>
          </CollapsePanel>
        </Collapse>

        <!-- 3. 原生单表格：SQL 执行与审核明细 (彻底消除重复) -->
        <div class="border border-gray-100 dark:border-zinc-800 rounded-md p-3 bg-white dark:bg-[#151515]">
          <div class="flex justify-between items-center mb-2">
            <div class="font-medium text-xs text-gray-700 dark:text-gray-300">
              <span v-if="hasExecuted" class="text-green-600 dark:text-green-400 font-semibold">● SQL 实际执行结果明细</span>
              <span v-else class="text-blue-600 dark:text-blue-400 font-semibold">● SQL 语法诊断与规则审查</span>
            </div>
            <div class="space-x-2">
              <Button v-if="hasExecuted" size="small" type="link" @click="rawJsonModalVisible = true">
                查看原始执行报文
              </Button>
            </div>
          </div>

          <Table :columns="unifiedColumns" :data-source="unifiedTableData" :pagination="false" size="small" row-key="id"
            bordered>
            <template #bodyCell="{ column, record }">
              <!-- 状态列 -->
              <template v-if="column.key === 'status'">
                <template v-if="hasExecuted">
                  <Tag :color="getExecuteStatusTag(record).color">
                    {{ getExecuteStatusTag(record).text }}
                  </Tag>
                </template>
                <template v-else>
                  <Tag v-if="record.errlevel === 0" color="success">PASS (正常)</Tag>
                  <Tag v-else-if="record.errlevel === 1" color="warning">WARN (警告)</Tag>
                  <Tag v-else color="error">ERROR (拦截)</Tag>
                </template>
              </template>

              <!-- SQL 语句列 (支持折叠收起、一键展开与复制) -->
              <template v-else-if="column.key === 'sql'">
                <div class="space-y-1 py-0.5">
                  <div class="text-xs font-mono p-1 rounded select-text border transition-all" :class="[
                    expandedSqlIds.includes(record.id)
                      ? 'whitespace-pre-wrap break-all bg-gray-50 dark:bg-zinc-900 border-blue-400 shadow-sm'
                      : 'truncate max-w-[520px] bg-gray-100 dark:bg-zinc-800 border-transparent hover:border-gray-300 cursor-pointer'
                  ]" @click="toggleSql(record.id)"
                    :title="expandedSqlIds.includes(record.id) ? '点击收起' : '点击展开完整 SQL'">
                    {{ record.sql }}
                  </div>
                  <div class="flex items-center gap-2 text-xs">
                    <a class="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                      @click.stop="toggleSql(record.id)">
                      {{ expandedSqlIds.includes(record.id) ? '收起 ▴' : '展开 ▾' }}
                    </a>
                    <a class="text-gray-400 hover:text-gray-600 cursor-pointer" @click.stop="copyText(record.sql)">
                      复制
                    </a>
                  </div>
                </div>
              </template>

              <!-- 反馈 / 错误信息 -->
              <template v-else-if="column.key === 'errormessage'">
                <span v-if="record.errormessage && record.errormessage !== 'None'"
                  :class="record.errlevel > 0 ? 'text-red-500 font-medium' : 'text-gray-600 dark:text-gray-400'"
                  class="text-xs break-all">
                  {{ record.errormessage }}
                </span>
                <span v-else class="text-green-600 dark:text-green-400 text-xs">
                  {{ hasExecuted ? '执行成功，无异常' : '语法合规，通过校验' }}
                </span>
              </template>

              <!-- 影响行数 -->
              <template v-else-if="column.key === 'rows'">
                <span class="font-mono text-xs">
                  {{ record.actual_affected_rows !== '' && record.actual_affected_rows !== undefined ?
                    record.actual_affected_rows : (record.affected_rows ?? 0) }}
                </span>
              </template>

              <!-- 耗时 -->
              <template v-else-if="column.key === 'execute_time'">
                <span class="font-mono text-xs text-gray-500">
                  {{ formatExecuteTime(record.execute_time) }}
                </span>
              </template>
            </template>
          </Table>
        </div>
      </div>

      <!-- TAB 2: 原生工单日志 -->
      <div v-show="activeDrawerTab === 'logs'" class="py-1">
        <div class="flex justify-between items-center mb-2 px-1">
          <div class="text-xs font-semibold text-gray-600 dark:text-gray-300">
            工单流转与操作审计记录
          </div>
          <Button size="small" preIcon="ant-design:reload-outlined" :loading="logsLoading" @click="fetchWorkflowLogs">
            刷新日志
          </Button>
        </div>

        <Table :columns="workflowLogColumns" :data-source="workflowLogs" :loading="logsLoading" :pagination="{
          pageSize: 10,
          showTotal: (total, range) => `显示第 ${range[0]} 到第 ${range[1]} 条记录，总共 ${total} 条记录`,
          size: 'small',
        }" size="middle" row-key="operation_time" bordered>
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'operation_type_desc'">
                <Tag :color="getLogTypeColor(record.operation_type_desc)">
                  {{ record.operation_type_desc }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'operator_display'">
                <span>
                  {{
                    record.operator_display ||
                    (record.operation_type_desc === '提交'
                      ? (detail.workflow?.engineer_display || detail.workflow?.engineer || '未知')
                      : (record.operation_type_desc?.includes('结束') ? '系统' : (detail.workflow?.engineer_display || detail.workflow?.engineer || '管理员')))
                  }}
                </span>
              </template>
            <template v-else-if="column.key === 'operation_time'">
              <span class="font-mono text-xs">{{ formatLogTime(record.operation_time) }}</span>
            </template>
            <template v-else-if="column.key === 'operation_info'">
              <span class="text-xs break-all">{{ record.operation_info }}</span>
            </template>
          </template>
        </Table>
      </div>
    </div>

    <!-- 原始报文弹窗 (不挤在主页面) -->
    <Modal v-model:visible="rawJsonModalVisible" title="原始执行结果报文" width="700px" :footer="null">
      <div class="relative group">
        <div
          class="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto max-h-450px whitespace-pre-wrap select-text border border-zinc-800">
          {{ formattedExecuteResult }}
        </div>
        <Button size="small" type="dashed" class="mt-2" @click="copyText(formattedExecuteResult)">
          复制完整报文
        </Button>
      </div>
    </Modal>
  </BasicDrawer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
import { Description } from '@/components/Description';
import {
  Tag,
  Table,
  Button,
  Space,
  Modal,
  message,
  Tabs,
  TabPane,
  Collapse,
  CollapsePanel,
  Tooltip,
} from 'ant-design-vue';
import { Codemirror } from 'vue-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { useUserStore } from '@/store/modules/user';
import {
  auditArcheryWorkflowApi,
  executeArcheryWorkflowApi,
  getArcheryWorkflowLogsApi,
  type ArcheryWorkflowItem,
  type ArcheryWorkflowLogItem,
} from '@/api/workorder/archery';
import { workflowDescSchema } from './archery.data';
import { copyText } from '@/utils/copyTextToClipboard';

const emit = defineEmits(['register', 'success']);

const userStore = useUserStore();
const detail = ref<ArcheryWorkflowItem | null>(null);
const operating = ref(false);
const activeDrawerTab = ref<'detail' | 'logs'>('detail');
const rawJsonModalVisible = ref(false);

// 判断工单是否属于生产环境（优先以所属资源组 group_name 为权威判断基准）
const isProdWorkflow = (workflow: any) => {
  if (!workflow) return false;
  const groupName = (workflow.group_name || '').toLowerCase();
  if (
    groupName.includes('prod') ||
    groupName.includes('prd') ||
    groupName.includes('生产') ||
    groupName.includes('release') ||
    groupName.includes('online')
  ) {
    return true;
  }
  if (
    groupName.includes('test') ||
    groupName.includes('dev') ||
    groupName.includes('uat') ||
    groupName.includes('qa') ||
    groupName.includes('测试') ||
    groupName.includes('开发')
  ) {
    return false;
  }

  const otherInfo = `${workflow.instance_name || ''} ${workflow.db_name || ''} ${workflow.audit_auth_groups || ''} ${workflow.workflow_name || ''}`.toLowerCase();
  if (
    otherInfo.includes('prod') ||
    otherInfo.includes('prd') ||
    otherInfo.includes('生产') ||
    otherInfo.includes('release') ||
    otherInfo.includes('online')
  ) {
    return true;
  }
  return false;
};

// 检查是否显示【通过】审批操作：
// 1. 工单必须处于待审核状态 (workflow_manreviewing)
// 2. 超级管理员 (super/admin/bot_super) 具备特权可见
// 3. 非管理员：生产环境彻底隐藏审批按钮，避免误导；非生产环境正常显示
const canShowPassAction = (workflow: any) => {
  if (workflow?.status !== 'workflow_manreviewing') {
    return false;
  }
  const roles = (userStore.getRoleList as string[]) || [];
  const isPrivileged = roles.some((r: string) => ['super', 'admin', 'bot_super'].includes(r.toLowerCase()));
  if (isPrivileged) {
    return true;
  }

  // 非管理员在生产环境下，绝不展示审批通过按钮
  if (isProdWorkflow(workflow)) {
    return false;
  }

  return true;
};

const expandedSqlIds = ref<number[]>([]);
const toggleSql = (id: number) => {
  const idx = expandedSqlIds.value.indexOf(id);
  if (idx > -1) {
    expandedSqlIds.value.splice(idx, 1);
  } else {
    expandedSqlIds.value.push(id);
  }
};

const workflowLogs = ref<ArcheryWorkflowLogItem[]>([]);
const logsLoading = ref(false);

const fetchWorkflowLogs = async () => {
  if (!detail.value) return;
  const wfId = detail.value.workflow_id || detail.value.id;
  if (!wfId) return;
  try {
    logsLoading.value = true;
    const res = await getArcheryWorkflowLogsApi(wfId);
    workflowLogs.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error(e?.message || '获取工单操作日志失败');
  } finally {
    logsLoading.value = false;
  }
};

const [registerDrawer] = useDrawerInner((data) => {
  detail.value = data?.record || null;
  expandedSqlIds.value = [];
  activeDrawerTab.value = 'detail';
  rawJsonModalVisible.value = false;
  fetchWorkflowLogs();
});

const handleAudit = (auditType: 'pass' | 'cancel') => {
  if (!detail.value) return;
  const wfId = detail.value.workflow_id || detail.value.id;
  const isPass = auditType === 'pass';
  Modal.confirm({
    title: isPass ? '确认审批通过该工单？' : '确认终止该工单？',
    content: isPass
      ? `工单标题: ${detail.value.workflow?.workflow_name}，审批通过后工单将推进至待上线状态。`
      : '工单终止后将不可再次执行上线。',
    okText: isPass ? '通过' : '终止',
    okType: isPass ? 'primary' : 'danger',
    onOk: async () => {
      try {
        operating.value = true;
        const res = await auditArcheryWorkflowApi({
          workflowId: wfId,
          auditType,
          auditRemark: isPass ? '审批通过' : '终止工单',
        });
        message.success(res?.message || (isPass ? '审批通过成功' : '工单已终止'));
        if (detail.value && detail.value.workflow) {
          detail.value.workflow.status = isPass ? 'workflow_review_pass' : 'workflow_abort';
        }
        emit('success');
      } catch (e: any) {
        message.error(e?.message || '操作失败');
      } finally {
        operating.value = false;
      }
    },
  });
};

const handleExecute = () => {
  if (!detail.value) return;
  const wfId = detail.value.workflow_id || detail.value.id;
  Modal.confirm({
    title: '确认立即执行上线？',
    content: `目标库: [${detail.value.workflow?.db_name}]，将向数据库立即执行工单内的 SQL 语句。`,
    okText: '立即执行',
    onOk: async () => {
      try {
        operating.value = true;
        const res = await executeArcheryWorkflowApi({
          workflowId: wfId,
          mode: 'auto',
        });
        message.success(res?.message || '已触发执行，请查看执行结果');
        if (detail.value && detail.value.workflow) {
          detail.value.workflow.status = 'workflow_executing';
        }
        emit('success');
      } catch (e: any) {
        message.error(e?.message || '执行失败');
      } finally {
        operating.value = false;
      }
    },
  });
};

const parsedReviewRows = computed(() => {
  if (!detail.value || !detail.value.review_content) return [];
  try {
    const rows = JSON.parse(detail.value.review_content);
    return Array.isArray(rows) ? rows.map((r, i) => ({ id: i + 1, ...r })) : [];
  } catch {
    return [];
  }
});

const parsedExecuteRows = computed(() => {
  if (!detail.value || !detail.value.execute_result) return [];
  try {
    const rows = JSON.parse(detail.value.execute_result);
    return Array.isArray(rows) ? rows.map((r, i) => ({ id: i + 1, ...r })) : [];
  } catch {
    return [];
  }
});

const hasExecuted = computed(() => parsedExecuteRows.value.length > 0);

const unifiedTableData = computed(() => {
  if (hasExecuted.value) {
    return parsedExecuteRows.value;
  }
  return parsedReviewRows.value;
});

const unifiedColumns = computed(() => {
  if (hasExecuted.value) {
    return [
      { title: '#', dataIndex: 'id', key: 'id', width: 45, align: 'center' as const },
      { title: '状态', key: 'status', width: 140 },
      { title: 'SQL 语句', dataIndex: 'sql', key: 'sql', width: 480 },
      { title: '执行反馈 / 错误详情', dataIndex: 'errormessage', key: 'errormessage' },
      { title: '影响行数', key: 'rows', width: 90, align: 'center' as const },
      { title: '耗时', key: 'execute_time', width: 85, align: 'center' as const },
    ];
  }
  return [
    { title: '#', dataIndex: 'id', key: 'id', width: 45, align: 'center' as const },
    { title: '状态', key: 'status', width: 140 },
    { title: 'SQL 语句', dataIndex: 'sql', key: 'sql', width: 480 },
    { title: '审查提示 / 错误信息', dataIndex: 'errormessage', key: 'errormessage' },
    { title: '预估行数', dataIndex: 'affected_rows', key: 'rows', width: 90, align: 'center' as const },
  ];
});

const formattedExecuteResult = computed(() => {
  if (!detail.value || !detail.value.execute_result) return '无执行日志';
  try {
    const parsed = JSON.parse(detail.value.execute_result);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return detail.value.execute_result;
  }
});

const formatExecuteTime = (timeVal: any) => {
  if (timeVal === undefined || timeVal === null || timeVal === '') return '-';
  const num = Number(timeVal);
  if (isNaN(num)) return String(timeVal);
  if (num === 0) return '0 s';
  if (num < 0.001) return '< 1 ms';
  if (num < 1) return `${(num * 1000).toFixed(1)} ms`;
  return `${num.toFixed(3)} s`;
};

const getExecuteStatusTag = (record: any) => {
  const status = (record.stagestatus || '').toLowerCase();
  const errlevel = Number(record.errlevel);
  if (errlevel > 0 || status.includes('fail') || status.includes('error')) {
    return { color: 'error', text: record.stagestatus || '执行失败' };
  }
  if (status.includes('success') || errlevel === 0) {
    return { color: 'success', text: record.stagestatus || '执行成功' };
  }
  if (status.includes('execut') || status.includes('run')) {
    return { color: 'processing', text: record.stagestatus || '执行中' };
  }
  return { color: 'default', text: record.stagestatus || '已完成' };
};

const workflowLogColumns = [
  { title: '操作', dataIndex: 'operation_type_desc', key: 'operation_type_desc', width: 110 },
  { title: '操作人', dataIndex: 'operator_display', key: 'operator_display', width: 120 },
  { title: '操作时间', dataIndex: 'operation_time', key: 'operation_time', width: 220 },
  { title: '操作信息', dataIndex: 'operation_info', key: 'operation_info' },
];

const getLogTypeColor = (typeDesc?: string) => {
  if (!typeDesc) return 'default';
  if (typeDesc.includes('通过') || typeDesc.includes('成功')) return 'success';
  if (typeDesc.includes('取消') || typeDesc.includes('终止') || typeDesc.includes('失败')) return 'error';
  if (typeDesc.includes('执行')) return 'processing';
  if (typeDesc.includes('提交')) return 'blue';
  return 'default';
};

const formatLogTime = (timeStr?: string) => {
  if (!timeStr) return '-';
  return timeStr.replace('T', ' ');
};
</script>
