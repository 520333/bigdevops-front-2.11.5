<template>
  <div>
    <BasicTable @register="registerTable">
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

    <AuditDetailDrawer @register="registerDrawer" />
  </div>
</template>

<script lang="ts" setup>
import { Tag } from 'ant-design-vue';
import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useDrawer } from '@/components/Drawer';
import { getAuditLogList } from '@/api/demo/system';
import { columns, searchFormSchema } from './audit.data';
import AuditDetailDrawer from './AuditDetailDrawer.vue';

const [registerDrawer, { openDrawer }] = useDrawer();

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
  beforeFetch(params) {
    // 处理日期范围
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
  if (action.includes('登录成功') || action.includes('新增') || action.includes('创建')) {
    return 'green';
  }
  if (action.includes('修改') || action.includes('更新')) {
    return 'orange';
  }
  if (action.includes('删除') || action.includes('失败')) {
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
