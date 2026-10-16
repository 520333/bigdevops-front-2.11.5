<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" title="发起 SQL 变更申请 (Archery)" width="65%" :isDetail="true"
    :showDetailBack="false">
    <template #titleToolbar>
      <Space>
        <Button size="small" @click="handleResetForm">清空重置</Button>
        <Button type="default" size="small" preIcon="ant-design:safety-certificate-outlined" @click="handleSqlCheck"
          :loading="checkingSql">
          SQL预检
        </Button>
        <Button type="primary" size="small" preIcon="ant-design:send-outlined" @click="handleSubmitWorkflow"
          :loading="submittingWorkflow">
          提交工单
        </Button>
      </Space>
    </template>

    <div class="p-4 max-w-[1000px] mx-auto">
      <Alert message="提交工单前，系统基于 Inception / goInception 引擎执行实时语法分析与合规检测，诊断是否有缺少主键、语法错误或高危全表更新风险。" type="info" show-icon
        class="mb-6" />

      <Form ref="formRef" :model="formModel" :rules="formRules" layout="vertical">
        <div class="grid grid-cols-3 gap-4">
          <FormItem label="1. 所属审批资源组" name="groupId">
            <Select v-model:value="formModel.groupId" :options="groupOptions" placeholder="请先选择审批资源组"
              :loading="loadingGroups" show-search option-filter-prop="label" :dropdown-match-select-width="false"
              :dropdown-style="{ minWidth: '260px' }"
              @dropdownVisibleChange="(open) => { if (open && groupOptions.length === 0) fetchGroups(); }"
              @change="handleGroupChange" />
          </FormItem>

          <FormItem label="2. 目标数据库实例" name="instanceId">
            <Select v-model:value="formModel.instanceId" :options="filteredInstanceOptions" :placeholder="!formModel.groupId
              ? '请先选择资源组'
              : filteredInstanceOptions.length
                ? '请选择数据库实例'
                : '该资源组暂无关联实例'
              " :loading="loadingInstances" show-search option-filter-prop="label" :dropdown-match-select-width="false"
              :dropdown-style="{ minWidth: '360px' }"
              :disabled="!formModel.groupId || filteredInstanceOptions.length === 0"
              @dropdownVisibleChange="(open) => { if (open && instances.length === 0) fetchInstances(); }"
              @change="handleInstanceChange" />
          </FormItem>

          <FormItem label="3. 目标数据库" name="dbName">
            <Select v-model:value="formModel.dbName" :options="databaseOptions"
              :placeholder="formModel.instanceId ? '请选择数据库' : '请先选择实例'" :loading="loadingDatabases" show-search
              :disabled="!formModel.instanceId" />
          </FormItem>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <FormItem label="工单标题" name="workflowName">
            <Input v-model:value="formModel.workflowName" placeholder="例如: [订单系统] 添加支付状态联合索引" :maxlength="50"
              allow-clear />
          </FormItem>

          <FormItem label="需求或任务链接 (选填)" name="demandUrl">
            <Input v-model:value="formModel.demandUrl" placeholder="例如: https://jira.company.com/browse/DEV-1024"
              allow-clear />
          </FormItem>
        </div>

        <FormItem label="备份策略" name="isBackup">
          <RadioGroup v-model:value="formModel.isBackup">
            <Radio :value="true">
              <span class="font-bold">开启数据备份 (推荐)</span>
              <span class="text-xs text-gray-500 ml-2">变更执行前自动备份受影响数据，支持一键回滚</span>
            </Radio>
            <Radio :value="false">
              <span>不备份</span>
            </Radio>
          </RadioGroup>
        </FormItem>

        <FormItem label="SQL 脚本内容 (支持多条语句，以分号结束)" name="sqlContent">
          <div class="border border-gray-200 dark:border-zinc-800 rounded overflow-hidden">
            <Codemirror v-model="formModel.sqlContent"
              placeholder="-- 在此输入需要上线的 SQL 脚本，例如：&#10;ALTER TABLE `user` ADD COLUMN `age` INT NOT NULL DEFAULT 0 COMMENT '年龄';"
              :style="{ height: '260px' }" :extensions="[oneDark]" />
          </div>
        </FormItem>

        <!-- SQL 预审核检测结果面板 -->
        <div v-if="checkResult" class="mb-6">
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-gray-200 dark:border-zinc-800">
            <div class="flex items-center gap-3">
              <span class="font-bold text-sm">
                Inception 语法诊断结果
              </span>
              <Button type="link" size="small" class="text-xs p-0 h-auto" @click="toggleExpandAllSql">
                {{ isAllSqlExpanded ? '收起全部 SQL ▴' : '展开全部完整 SQL ▾' }}
              </Button>
            </div>
            <Space>
              <Tag :color="checkResult.error_count > 0 ? 'error' : 'success'">
                错误: {{ checkResult.error_count }}
              </Tag>
              <Tag :color="checkResult.warning_count > 0 ? 'warning' : 'default'">
                警告: {{ checkResult.warning_count }}
              </Tag>
            </Space>
          </div>

          <Table :columns="checkColumns" :data-source="checkResult.rows" :pagination="false" size="small" row-key="id"
            bordered>
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'errlevel'">
                <Tag v-if="record.errlevel === 0" color="success">PASS (正常)</Tag>
                <Tag v-else-if="record.errlevel === 1" color="warning">WARN (警告)</Tag>
                <Tag v-else color="error">ERROR (拦截)</Tag>
              </template>
              <template v-else-if="column.key === 'errormessage'">
                <span :class="record.errlevel > 0 ? 'text-red-500 font-medium' : 'text-gray-500'">
                  {{ record.errormessage || '语法合规，通过校验' }}
                </span>
              </template>
              <template v-else-if="column.key === 'sql'">
                <div class="space-y-1.5 py-0.5">
                  <div class="text-xs font-mono p-1.5 rounded transition-all select-text border" :class="[
                    isSqlExpanded(record.id)
                      ? 'whitespace-pre-wrap break-all bg-gray-50 dark:bg-zinc-900 border-blue-400 dark:border-blue-600 shadow-sm'
                      : 'truncate max-w-[420px] bg-gray-100 dark:bg-zinc-800 border-transparent hover:border-gray-300 dark:hover:border-zinc-700 cursor-pointer'
                  ]" @click="toggleExpandSql(record.id)"
                    :title="isSqlExpanded(record.id) ? '点击收起 SQL' : '点击展开完整 SQL 语句'">
                    {{ record.sql }}
                  </div>
                  <div class="flex items-center gap-3 text-xs">
                    <a class="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium cursor-pointer inline-flex items-center gap-0.5 select-none"
                      @click.stop="toggleExpandSql(record.id)">
                      <span>{{ isSqlExpanded(record.id) ? '收起 ▴' : '点击展开完整 SQL ▾' }}</span>
                    </a>
                    <a class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer select-none"
                      @click.stop="copyText(record.sql)">
                      复制
                    </a>
                  </div>
                </div>
              </template>
            </template>
          </Table>
        </div>

        <!-- 底部提交操作区 -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
          <Button @click="handleResetForm">清空重置</Button>
          <Button type="default" preIcon="ant-design:safety-certificate-outlined" @click="handleSqlCheck"
            :loading="checkingSql">
            SQL检测
          </Button>
          <Button type="primary" preIcon="ant-design:send-outlined" @click="handleSubmitWorkflow"
            :loading="submittingWorkflow">
            确认提交工单
          </Button>
        </div>
      </Form>
    </div>
  </BasicDrawer>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import {
  Button,
  Input,
  Space,
  Tag,
  Alert,
  Form,
  FormItem,
  Select,
  RadioGroup,
  Radio,
  Table,
  message,
} from 'ant-design-vue';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
import { Codemirror } from 'vue-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { copyText } from '@/utils/copyTextToClipboard';
import {
  getArcheryInstancesApi,
  getArcheryGroupsApi,
  getArcheryDatabasesApi,
  checkArcherySqlApi,
  createArcheryWorkflowApi,
  type ArcheryGroupItem,
  type ArcheryInstance,
  type ArcherySqlCheckResult,
} from '@/api/workorder/archery';

const emit = defineEmits(['success', 'register']);

// 实例与组列表状态
const instances = ref<ArcheryInstance[]>([]);
const groupOptions = ref<{ label: string; value: number }[]>([]);
const loadingGroups = ref(false);
const loadingInstances = ref(false);
const databaseOptions = ref<{ label: string; value: string }[]>([]);
const loadingDatabases = ref(false);

const fetchGroups = async () => {
  loadingGroups.value = true;
  try {
    const res: any = await getArcheryGroupsApi();
    const list: any[] = Array.isArray(res) ? res : res?.items || res?.data || res?.result || [];
    groupOptions.value = list.map((g) => ({
      label: g.name || g.group_name || `资源组 #${g.id || g.group_id}`,
      value: Number(g.id || g.group_id),
    }));
    if (!formModel.groupId && groupOptions.value.length === 1) {
      formModel.groupId = groupOptions.value[0].value;
    }
  } catch (err: any) {
    message.error(err?.message || '获取审批资源组失败');
  } finally {
    loadingGroups.value = false;
  }
};

const fetchInstances = async () => {
  loadingInstances.value = true;
  try {
    const res: any = await getArcheryInstancesApi();
    const list: any[] = Array.isArray(res) ? res : res?.items || res?.data || res?.result || [];
    instances.value = list.map((inst) => ({
      ...inst,
      id: Number(inst.id),
      resource_group: Array.isArray(inst.resource_group)
        ? inst.resource_group.map((rg: any) => Number(rg))
        : [],
    }));
  } catch (err: any) {
    message.error(err?.message || '获取数据库实例列表失败');
  } finally {
    loadingInstances.value = false;
  }
};

// 注册 Drawer (并在打开时主动刷新组与实例数据)
const [registerDrawer, { closeDrawer, setDrawerProps }] = useDrawerInner(async () => {
  setDrawerProps({ loading: true });
  try {
    await Promise.all([fetchGroups(), fetchInstances()]);
  } finally {
    setDrawerProps({ loading: false });
  }
});

// 组件挂载时立即预拉取
onMounted(() => {
  fetchGroups();
  fetchInstances();
});

// 表单模型
const formRef = ref();
const formModel = reactive({
  groupId: undefined as number | undefined,
  instanceId: undefined as number | undefined,
  dbName: undefined as string | undefined,
  workflowName: '',
  demandUrl: '',
  isBackup: false,
  sqlContent: '',
});

const formRules: Record<string, any> = {
  groupId: [{ required: true, message: '请选择审批资源组', trigger: 'change' }],
  instanceId: [{ required: true, message: '请选择目标数据库实例', trigger: 'change' }],
  dbName: [{ required: true, message: '请选择目标数据库', trigger: 'change' }],
  workflowName: [
    { required: true, message: '请输入工单标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符之间', trigger: 'blur' },
  ],
  sqlContent: [{ required: true, message: '请输入需要上线的 SQL 语句', trigger: 'blur' }],
};

// 根据选中的资源组过滤实例列表
const filteredInstanceOptions = computed(() => {
  if (!formModel.groupId) return [];
  const targetGroupId = Number(formModel.groupId);
  const matched = instances.value.filter((inst) => {
    if (Array.isArray(inst.resource_group)) {
      return inst.resource_group.some((rg: any) => Number(rg) === targetGroupId);
    }
    return false;
  });
  return matched.map((inst) => ({
    label: `${inst.instance_name} (${inst.host}:${inst.port} - ${inst.db_type})`,
    value: inst.id,
  }));
});

// 切换资源组时清空下游
const handleGroupChange = () => {
  formModel.instanceId = undefined;
  formModel.dbName = undefined;
  databaseOptions.value = [];
};

// 切换实例拉取数据库列表
const handleInstanceChange = async (val: any) => {
  formModel.dbName = undefined;
  databaseOptions.value = [];
  if (!val) return;

  loadingDatabases.value = true;
  try {
    const dbs = await getArcheryDatabasesApi({ instanceId: val });
    if (dbs && Array.isArray(dbs)) {
      databaseOptions.value = dbs.map((db) => ({
        label: db,
        value: db,
      }));
    }
  } catch (err: any) {
    message.error(err?.message || '获取该实例的数据库列表失败');
  } finally {
    loadingDatabases.value = false;
  }
};

const checkingSql = ref(false);
const checkResult = ref<ArcherySqlCheckResult | null>(null);
const submittingWorkflow = ref(false);

const checkColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '检测状态', dataIndex: 'errlevel', key: 'errlevel', width: 110 },
  { title: 'SQL 语句', dataIndex: 'sql', key: 'sql', minWidth: 320 },
  { title: '审查提示/错误信息', dataIndex: 'errormessage', key: 'errormessage' },
  { title: '预估影响行数', dataIndex: 'affected_rows', key: 'affected_rows', width: 110 },
];

// SQL 展开/收起
const expandedSqlIds = ref<number[]>([]);
const isSqlExpanded = (id: number) => expandedSqlIds.value.includes(id);

const toggleExpandSql = (id: number) => {
  const index = expandedSqlIds.value.indexOf(id);
  if (index > -1) {
    expandedSqlIds.value.splice(index, 1);
  } else {
    expandedSqlIds.value.push(id);
  }
};

const isAllSqlExpanded = computed(() => {
  if (!checkResult.value?.rows?.length) return false;
  return checkResult.value.rows.every((r) => expandedSqlIds.value.includes(r.id));
});

const toggleExpandAllSql = () => {
  if (!checkResult.value?.rows?.length) return;
  if (isAllSqlExpanded.value) {
    expandedSqlIds.value = [];
  } else {
    expandedSqlIds.value = checkResult.value.rows.map((r) => r.id);
  }
};

// SQL 检测/预审核
const handleSqlCheck = async () => {
  if (!formModel.groupId || !formModel.instanceId || !formModel.dbName || !formModel.sqlContent.trim()) {
    message.warning('请先完整选择审批资源组、目标实例、数据库名称及填写 SQL 语句');
    return;
  }

  checkingSql.value = true;
  checkResult.value = null;
  try {
    const result = await checkArcherySqlApi({
      instanceId: formModel.instanceId,
      dbName: formModel.dbName,
      fullSql: formModel.sqlContent.trim(),
    });
    checkResult.value = result;
    if (result.error_count > 0) {
      message.error(`检测发现 ${result.error_count} 处语法合规错误，请在下方列表查看修改！`);
    } else if (result.warning_count > 0) {
      message.warning(`检测通过，但存在 ${result.warning_count} 处合规警告建议`);
    } else {
      message.success('SQL 语法与 Inception 合规预审核全部通过！');
    }
  } catch (err: any) {
    message.error(err?.message || 'SQL 检测请求失败');
  } finally {
    checkingSql.value = false;
  }
};

// 提交工单
const handleSubmitWorkflow = async () => {
  try {
    await formRef.value?.validate();
    submittingWorkflow.value = true;

    const res = await createArcheryWorkflowApi({
      workflowName: formModel.workflowName.trim(),
      groupId: formModel.groupId!,
      instanceId: formModel.instanceId!,
      dbName: formModel.dbName!,
      isBackup: formModel.isBackup,
      demandUrl: formModel.demandUrl?.trim(),
      sqlContent: formModel.sqlContent.trim(),
    });

    message.success(res?.message || '提交工单成功！');
    handleResetForm();
    closeDrawer();
    emit('success');
  } catch (err: any) {
    if (err?.errorFields) return;
    message.error(err?.message || '提交工单失败');
  } finally {
    submittingWorkflow.value = false;
  }
};

// 重置表单
const handleResetForm = () => {
  formModel.groupId = undefined;
  formModel.instanceId = undefined;
  formModel.dbName = undefined;
  formModel.workflowName = '';
  formModel.demandUrl = '';
  formModel.isBackup = true;
  formModel.sqlContent = '';
  checkResult.value = null;
  expandedSqlIds.value = [];
  formRef.value?.clearValidate();
};
</script>
