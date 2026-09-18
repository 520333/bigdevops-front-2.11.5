<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate" v-auth="'POST:/api/monitor/createMonitorPromAlertRule'">
          新增告警规则
        </a-button>
        <a-button @click="handleBatchStatus(1)" :disabled="!hasSelected"
          v-auth="'POST:/api/monitor/setMonitorPromAlertRuleStatusBatch'">
          批量启用
        </a-button>

        <a-button @click="handleBatchStatus(2)" :disabled="!hasSelected"
          v-auth="'POST:/api/monitor/setMonitorPromAlertRuleStatusBatch'">
          批量禁用
        </a-button>
        <a-button danger @click="handleBatchDelete()" :disabled="!hasSelected"
          v-auth="'DELETE:/api/monitor/deleteMonitorPromAlertRuleBatch'">
          批量删除
        </a-button>
      </template>

      <template #bodyCell="{ column, record }">

        <template v-if="column.key === 'poolName'">
          <a-button type="link" size="small" @click.stop="handleGoPrometheus()">
            {{ record.poolName }}
          </a-button>
        </template>
        <template v-if="column.key === 'sendGroupName'">
          <a-button type="link" size="small" @click.stop="handleGoSendGroup()">
            {{ record.sendGroupName }}
          </a-button>
        </template>

        <template v-if="column.key === 'nodePath'">
          <Tag color="default">
            {{ record.nodePath }}
          </Tag>
        </template>

        <template v-if="column.key === 'severity'">
          <Tag :color="{ critical: 'red', warning: 'warning', info: 'green' }[record.severity] || 'default'">
            {{ record.severity }}
          </Tag>
        </template>


        <template v-if="column.key === 'action'">
          <TableAction :actions="[
            {
              icon: 'clarity:note-edit-line',
              onClick: handleEdit.bind(null, record),
              tooltip: '编辑告警规则',
              auth: 'POST:/api/monitor/updateMonitorPromAlertRule'
            },
            {
              icon: 'ant-design:delete-outlined',
              color: 'error',
              tooltip: '删除告警规则',
              popConfirm: {
                title: '是否确认删除该告警规则？',
                placement: 'left',
                confirm: handleDelete.bind(null, record),
              },
              auth: 'DELETE:/api/monitor/deleteMonitorPromAlertRule/:id'
            },
          ]" />
        </template>
      </template>
      <template #exprSlot="{ record }">
        <span>{{ record.expr }}</span>
      </template>
    </BasicTable>

    <AlertRuleDrawer @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Tag, Popover, Button } from 'ant-design-vue';
import Icon from '@/components/Icon/Icon.vue';
import { BasicTable, useTable, TableAction } from '@/components/Table';
import { PageWrapper } from '@/components/Page';
import { useDrawer } from '@/components/Drawer';
import AlertRuleDrawer from './AlertRuleDrawer.vue';
import { columns, searchFormSchema } from './alertrule.data.js';
import { useMessage } from '@/hooks/web/useMessage';
import { getMonitorPromAlertRuleList, deleteMonitorPromAlertRule, setMonitorPromAlertRuleStatusBatch, deleteMonitorPromAlertRuleBatch } from '@/api/demo/system';
import { useGo } from '@/hooks/web/usePage';
import { computed } from 'vue';
export default defineComponent({
  name: 'MonitorAlertRule',
  components: { BasicTable, PageWrapper, AlertRuleDrawer, TableAction, Tag, Popover, AButton: Button, Icon },
  setup() {
    const go = useGo();
    const [registerDrawer, { openDrawer }] = useDrawer();
    const roleColorMap = ['blue', 'orange', 'orange', 'red', 'cyan', 'green'];
    const [registerTable, { reload, getSelectRowKeys, clearSelectedRowKeys, getSelectRows }] = useTable({
      title: '告警规则列表',
      api: getMonitorPromAlertRuleList,
      rowKey: 'id',
      columns,
      formConfig: {
        labelWidth: 100,
        schemas: searchFormSchema,
      },
      rowSelection: {
        type: 'checkbox',
      },
      clickToRowSelect: true,
      useSearchForm: true,
      showTableSetting: true,
      bordered: true,
      showIndexColumn: false,
      actionColumn: {
        width: 80,
        title: '操作',
        dataIndex: 'action',
      },
    });

    const hasSelected = computed(() => getSelectRows().length > 0);
    async function handleBatchStatus(enable: number) {
      const ids = getSelectRowKeys().map((id) => Number(id));

      if (ids.length === 0) return;

      const actionText = enable === 1 ? '启用' : '禁用';
      const { createMessage, createConfirm } = useMessage();

      createConfirm({
        iconType: 'warning',
        title: '批量操作确认',
        content: `确定要批量${actionText}选中的 ${ids.length} 条告警规则吗？`,
        onOk: async () => {
          try {
            await setMonitorPromAlertRuleStatusBatch({ ids, enable });
            createMessage.success(`批量${actionText}成功`);
            clearSelectedRowKeys();
            reload();
          } catch (error) {
            console.error('批量操作失败:', error);
          }
        },
      });
    }
    async function handleBatchDelete() {
      const ids = getSelectRowKeys().map((id) => Number(id));
      if (ids.length === 0) return;

      const { createMessage, createConfirm } = useMessage();

      createConfirm({
        iconType: 'error',
        title: '危险操作确认',
        content: `确定要【永久删除】选中的 ${ids.length} 条告警规则吗？此操作不可逆！`,
        onOk: async () => {
          try {
            await deleteMonitorPromAlertRuleBatch({ ids });
            createMessage.success(`成功删除 ${ids.length} 条告警规则`);
            clearSelectedRowKeys();
            reload();
          } catch (error) {
            console.error('批量删除失败:', error);
          }
        },
      });
    }
    function handleGoPrometheus() {
      go("/monitor/prom_instance");
    }
    function handleGoSendGroup() {
      go("/monitor/alert_sendgroup");
    }

    function handleCreate() {
      openDrawer(true, {
        isUpdate: false,
      });
    }

    function handleEdit(record: Recordable) {
      openDrawer(true, {
        record,
        isUpdate: true,
      });
    }

    async function handleDelete(record: Recordable) {
      const { createMessage } = useMessage();
      try {
        await deleteMonitorPromAlertRule(record.id);
        createMessage.success('删除成功');
        reload();
      } catch (error) {
        createMessage.error('删除失败');
      }
    }

    function handleSuccess() {
      reload();
    }

    return {
      registerTable,
      registerDrawer,
      handleCreate,
      handleEdit,
      handleDelete,
      handleSuccess,
      roleColorMap,
      handleGoPrometheus,
      handleGoSendGroup,
      hasSelected,
      handleBatchStatus,
      handleBatchDelete
    };
  },
});
</script>