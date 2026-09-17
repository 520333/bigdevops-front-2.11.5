<template>
  <PageWrapper dense contentFullHeight contentClass="flex flex-col">
    <!-- 顶部 Tabs 切换导航 -->
    <div class="bg-white dark:bg-[#151515] px-4 pt-2 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
      <Tabs v-model:activeKey="activeTab" :tabBarStyle="{ margin: 0 }">
        <TabPane key="auditLog" tab="操作日志" />
        <TabPane key="onlineUser">
          <template #tab>
            <span>
              在线用户
              <Badge
                :count="onlineCount"
                :overflow-count="999"
                :number-style="{ backgroundColor: '#52c41a', marginLeft: '6px' }"
              />
            </span>
          </template>
        </TabPane>
      </Tabs>
    </div>

    <!-- 表格展示主体 -->
    <div class="flex-1 overflow-hidden">
      <!-- 1. 操作日志表格 -->
      <BasicTable v-show="activeTab === 'auditLog'" @register="registerTable" class="w-full">
        <template #bodyCell="{ column, record }">
          <!-- 业务模块彩色标签 -->
          <template v-if="column.key === 'module'">
            <Tag color="cyan">{{ record.module || '通用' }}</Tag>
          </template>

          <!-- 请求方法标签 -->
          <template v-if="column.key === 'method'">
            <Tag :color="getMethodColor(record.method)">{{ record.method }}</Tag>
          </template>

          <!-- 响应状态标签 -->
          <template v-if="column.key === 'status'">
            <Tag :color="record.status >= 200 && record.status < 300 ? 'green' : 'red'">
              {{ record.status }}
            </Tag>
          </template>

          <!-- 操作动作标签 -->
          <template v-if="column.key === 'action'">
            <Tag :color="getActionColor(record.action)">{{ record.action || '-' }}</Tag>
          </template>

          <!-- 最右侧操作按钮列 -->
          <template v-if="column.key === 'operate'">
            <TableAction
              :actions="[
                {
                  icon: 'ant-design:eye-outlined',
                  label: '详情',
                  onClick: handleViewDetail.bind(null, record),
                },
              ]"
            />
          </template>
        </template>
      </BasicTable>

      <!-- 2. 在线用户表格 -->
      <BasicTable v-show="activeTab === 'onlineUser'" @register="registerOnlineTable" class="w-full">
        <template #toolbar>
          <a-button type="primary" preIcon="ant-design:reload-outlined" @click="handleReloadOnline">
            刷新在线列表
          </a-button>
        </template>

        <template #bodyCell="{ column, record }">
          <!-- 用户角色标签 -->
          <template v-if="column.key === 'roles'">
            <Tag color="blue" v-for="role in (record.roles || [])" :key="role" class="mr-1">
              {{ role }}
            </Tag>
            <span v-if="!record.roles || record.roles.length === 0" class="text-gray-400">无</span>
          </template>

          <!-- 在线状态 -->
          <template v-if="column.key === 'status'">
            <Badge status="processing" color="green" text="在线" />
          </template>

          <!-- 强退操作列 -->
          <template v-if="column.key === 'operate'">
            <TableAction
              :actions="[
                {
                  icon: 'ant-design:logout-outlined',
                  color: 'error',
                  label: '强退',
                  popConfirm: {
                    title: `确定要强制踢出用户【${record.realName || record.userName}】下线吗？`,
                    placement: 'left',
                    confirm: handleKickout.bind(null, record),
                  },
                  disabled: record.userName === currentUsername,
                  tooltip: record.userName === currentUsername ? '当前登录账号不可强退自身' : '',
                },
              ]"
            />
          </template>
        </template>
      </BasicTable>
    </div>

    <!-- 操作日志详情抽屉 -->
    <AuditDetailDrawer @register="registerDrawer" />
  </PageWrapper>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Tabs, TabPane, Tag, Badge } from 'ant-design-vue';
import { PageWrapper } from '@/components/Page';
import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useDrawer } from '@/components/Drawer';
import { useMessage } from '@/hooks/web/useMessage';
import { useUserStore } from '@/store/modules/user';
import { getAuditLogList, getOnlineUserList, kickoutUser } from '@/api/demo/system';
import { columns, searchFormSchema } from './audit.data';
import { onlineColumns } from './online.data';
import AuditDetailDrawer from './AuditDetailDrawer.vue';

const activeTab = ref('auditLog');
const onlineCount = ref(0);

const userStore = useUserStore();
const currentUsername = computed(() => userStore.getUserInfo?.userName || userStore.getUserInfo?.username);
const { createMessage } = useMessage();

// 操作审计抽屉
const [registerDrawer, { openDrawer }] = useDrawer();

// 操作审计日志表格
const [registerTable] = useTable({
  title: '系统操作审计日志',
  api: getAuditLogList,
  columns,
  formConfig: {
    labelWidth: 80,
    schemas: searchFormSchema,
    autoSubmitOnEnter: true,
  },
  useSearchForm: true,
  showTableSetting: true,
  bordered: true,
  showIndexColumn: false,
  canResize: false,
  beforeFetch(params) {
    if (params.dateRange && Array.isArray(params.dateRange)) {
      params.startDate = params.dateRange[0];
      params.endDate = params.dateRange[1];
      delete params.dateRange;
    }
    return params;
  },
  actionColumn: {
    width: 80,
    title: '操作',
    dataIndex: 'operate',
  },
});

// 在线用户表格
const [registerOnlineTable, { reload: reloadOnlineTable }] = useTable({
  title: '当前在线活跃用户列表',
  api: getOnlineUserList,
  columns: onlineColumns,
  bordered: true,
  showIndexColumn: true,
  pagination: false,
  canResize: false,
  afterFetch(data) {
    onlineCount.value = Array.isArray(data) ? data.length : 0;
    return data;
  },
  actionColumn: {
    width: 100,
    title: '操作',
    dataIndex: 'operate',
  },
});

function handleReloadOnline() {
  reloadOnlineTable();
}

async function handleKickout(record: Recordable) {
  try {
    await kickoutUser(record.userName);
    createMessage.success(`用户【${record.realName || record.userName}】已被成功强退下线`);
    reloadOnlineTable();
  } catch (err: any) {
    createMessage.error(err?.message || '强退操作失败');
  }
}

function getMethodColor(method: string) {
  switch (method?.toUpperCase()) {
    case 'POST':
      return 'blue';
    case 'DELETE':
      return 'red';
    case 'PUT':
      return 'orange';
    case 'GET':
      return 'green';
    default:
      return 'default';
  }
}

function getActionColor(action: string) {
  if (!action) return 'default';
  if (action.includes('登录成功') || action.includes('新增') || action.includes('创建') || action.includes('开户')) {
    return 'green';
  }
  if (action.includes('修改') || action.includes('更新')) {
    return 'orange';
  }
  if (action.includes('删除') || action.includes('失败') || action.includes('强退')) {
    return 'red';
  }
  if (action.includes('认领') || action.includes('屏蔽')) {
    return 'purple';
  }
  return 'blue';
}

function handleViewDetail(record: Recordable) {
  openDrawer(true, { record });
}
</script>
