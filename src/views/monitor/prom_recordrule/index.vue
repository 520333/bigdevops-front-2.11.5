<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate" v-auth="'POST:/api/monitor/createMonitorPromRecordRule'">
          新增聚合规则
        </a-button>
        <a-button
          type="default"
          preIcon="ant-design:copy-outlined"
          @click="handleCopySelected"
          v-auth="'POST:/api/monitor/createMonitorPromRecordRule'"
        >
          复制聚合规则
        </a-button>
        <a-button @click="handleBatchStatus(1)" :disabled="!hasSelected"
          v-auth="'POST:/api/monitor/setMonitorPromRecordRuleStatusBatch'">
          批量启用
        </a-button>

        <a-button @click="handleBatchStatus(2)" :disabled="!hasSelected"
          v-auth="'POST:/api/monitor/setMonitorPromRecordRuleStatusBatch'">
          批量禁用
        </a-button>
        <a-button danger @click="handleBatchDelete()" :disabled="!hasSelected"
          v-auth="'DELETE:/api/monitor/deleteMonitorPromRecordRuleBatch'">
          批量删除
        </a-button>
      </template>




      <template #bodyCell="{ column, record }">

        <template v-if="column.key === 'poolName'">
          <a-button type="link" size="small" @click.stop="handleGoPrometheus()">
            {{ record.poolName }}
          </a-button>
        </template>

        <template v-if="column.key === 'action'">
          <TableAction :actions="[
            {
              icon: 'clarity:note-edit-line',
              onClick: handleEdit.bind(null, record),
              tooltip: '编辑聚合规则',
              auth: 'POST:/api/monitor/updateMonitorPromRecordRule'
            },
            {
              icon: 'ant-design:copy-outlined',
              onClick: handleCopy.bind(null, record),
              tooltip: '复制聚合规则',
              auth: 'POST:/api/monitor/createMonitorPromRecordRule'
            },
            {
              icon: 'ant-design:delete-outlined',
              color: 'error',
              tooltip: '删除聚合规则',
              popConfirm: {
                title: '是否确认删除该聚合规则？',
                placement: 'left',
                confirm: handleDelete.bind(null, record),
              },
              auth: 'DELETE:/api/monitor/deleteMonitorPromRecordRule/:id'
            },
          ]" />
        </template>
      </template>
    </BasicTable>

    <RecordRuleDrawer @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Tag, Popover, Button } from 'ant-design-vue';
import Icon from '@/components/Icon/Icon.vue';
import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useDrawer } from '@/components/Drawer';
import RecordRuleDrawer from './RecordRuleDrawer.vue';
import { columns, searchFormSchema } from './recordrule.data.js';
import { useMessage } from '@/hooks/web/useMessage';
import { getMonitorPromRecordRuleList, deleteMonitorPromRecordRule, setMonitorPromRecordRuleStatusBatch, deleteMonitorPromRecordRuleBatch } from '@/api/demo/system';
import { useGo } from '@/hooks/web/usePage';
import { computed } from 'vue';
export default defineComponent({
  name: 'MonitorRecordRule',
  components: { BasicTable, RecordRuleDrawer, TableAction, Tag, Popover, AButton: Button, Icon },
  setup() {
    const { createMessage } = useMessage();
    const go = useGo();
    const [registerDrawer, { openDrawer }] = useDrawer();
    const roleColorMap = ['blue', 'orange', 'orange', 'red', 'cyan', 'green'];
    const [registerTable, { reload, getSelectRowKeys, clearSelectedRowKeys, getSelectRows }] = useTable({
      title: '聚合规则列表',
      api: getMonitorPromRecordRuleList,
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
      rowKey: 'id',
      actionColumn: {
        width: 120,
        title: '操作',
        dataIndex: 'action',
      },
    });

    const hasSelected = computed(() => getSelectRows().length > 0);
    async function handleBatchStatus(enable: number) {
      const ids = getSelectRowKeys().map((id) => Number(id));
      if (ids.length === 0) return;

      const actionText = enable === 1 ? '启用' : '禁用';
      const { createConfirm } = useMessage();

      createConfirm({
        iconType: 'warning',
        title: '批量操作确认',
        content: `确定要批量${actionText}选中的 ${ids.length} 条聚合规则吗？`,
        onOk: async () => {
          try {
            await setMonitorPromRecordRuleStatusBatch({ ids, enable });
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

      const { createConfirm } = useMessage();

      createConfirm({
        iconType: 'error',
        title: '危险操作确认',
        content: `确定要【永久删除】选中的 ${ids.length} 条聚合规则吗？此操作不可逆！`,
        onOk: async () => {
          try {
            await deleteMonitorPromRecordRuleBatch({ ids });
            createMessage.success(`成功删除 ${ids.length} 条聚合规则`);
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
        isCopy: false,
      });
    }

    function handleEdit(record: Recordable) {
      openDrawer(true, {
        record,
        isUpdate: true,
        isCopy: false,
      });
    }

    function handleCopy(record: Recordable) {
      openDrawer(true, {
        record,
        isUpdate: false,
        isCopy: true,
      });
    }

    function handleCopySelected() {
      const selected = getSelectRows();
      if (!selected || selected.length === 0) {
        createMessage.warning('请先在列表中勾选要复制的聚合规则');
        return;
      }
      if (selected.length > 1) {
        createMessage.warning('每次仅支持复制单条规则，请仅勾选一条聚合规则');
        return;
      }
      handleCopy(selected[0]);
    }

    async function handleDelete(record: Recordable) {
      try {
        await deleteMonitorPromRecordRule(record.id);
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
      handleCopy,
      handleCopySelected,
      handleDelete,
      handleSuccess,
      roleColorMap,
      handleGoPrometheus,
      handleGoSendGroup,
      hasSelected,
      handleBatchStatus,
      handleBatchDelete,
    };
  },
});
</script>