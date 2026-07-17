<template>
  <div>
    <BasicTable @register="registerTable" :rowSelection="{ type: 'checkbox' }">
      <template #toolbar>
        <a-button type="primary" @click="handleBatchSilence" :disabled="!hasSelected"
          v-auth="'POST:/api/monitor/alertManagerEventBatchSilence'">
          批量屏蔽
        </a-button>
        <a-button danger @click="handleBatchUnSilence" :disabled="!hasSelected"
          v-auth="'POST:/api/monitor/alertManagerEventBatchUnSilence'">
          批量解除屏蔽
        </a-button>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <Tag
            :color="{ firing: 'red', resolved: 'green', upgraded: 'warning', silenced: 'blue', renling: 'purple' }[record.status] || 'default'">
            {{ record.status }}
          </Tag>
        </template>


        <template v-if="column.key === 'sendGroupName'">
          <a-button type="link" size="small" @click.stop="handleGoSendGroupName()">
            {{ record.sendGroupName }}
          </a-button>
        </template>

        <template v-if="column.key === 'action'">
          <TableAction :actions="[
            {
              icon: 'bi:bell-slash',
              onClick: handleSilence.bind(null, record),
              tooltip: '屏蔽告警',
              ifShow: () => record.status !== 'silenced' && record.status !== 'resolved',
              auth: 'POST:/api/monitor/alertManagerEventSilence'
            },
            {
              icon: 'bi:bell',
              onClick: handleUnSilence.bind(null, record),
              tooltip: '解除屏蔽',
              ifShow: () => record.status === 'silenced',
              auth: 'POST:/api/monitor/alertManagerEventUnSilence'
            },
            {
              icon: 'ant-design:check-circle-outlined',
              color: 'success',
              tooltip: '认领告警',
              ifShow: () => record.status !== 'renling' && record.status !== 'resolved',
              popConfirm: {
                title: '是否确认认领该告警事件？',
                placement: 'left',
                confirm: handleReLing.bind(null, record),
              },
              auth: 'POST:/api/monitor/alertManagerEventReLing'
            },
          ]" />
        </template>
      </template>
    </BasicTable>

    <EventDrawer @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, unref } from 'vue';
import { Tag, Button } from 'ant-design-vue';
import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useDrawer } from '@/components/Drawer';
import { useMessage } from '@/hooks/web/useMessage';
import { useGo } from '@/hooks/web/usePage';
import { columns, searchFormSchema } from './event.data';
import {
  getMonitorAlertManagerEventList,
  alertManagerEventReLing,
  alertManagerEventUnSilence,
  alertManagerEventBatchUnSilence
} from '@/api/demo/system';
import EventDrawer from './EventDrawer.vue';

export default defineComponent({
  name: 'MonitorAlertEvent',
  components: { BasicTable, EventDrawer, TableAction, Tag, AButton: Button },
  setup() {
    const go = useGo();
    const [registerDrawer, { openDrawer }] = useDrawer();
    const roleColorMap = ['blue', 'orange', 'red', 'cyan', 'green'];
    const { createMessage, createConfirm } = useMessage();
    const [registerTable, { reload, getSelectRowKeys, clearSelectedRowKeys, getSelectRows }] = useTable({
      title: '告警事件列表',
      api: getMonitorAlertManagerEventList,
      columns,
      formConfig: {
        labelWidth: 100,
        schemas: searchFormSchema,
      },
      useSearchForm: true,
      showTableSetting: true,
      bordered: true,
      showIndexColumn: false,
      actionColumn: {
        width: 100,
        title: '操作',
        dataIndex: 'action',
      },
      rowKey: 'id',
    });

    const hasSelected = computed(() => unref(getSelectRows()).length > 0);

    function handleGoSendGroupName() {
      go('/monitor/sendgroup');
    }

    function handleSilence(record: Recordable) {
      openDrawer(true, {
        isUpdate: true,
        isBatch: false,
        record,
      });
    }

    function handleBatchSilence() {
      const selectedIds = unref(getSelectRowKeys());
      if (selectedIds.length === 0) return;

      openDrawer(true, {
        isUpdate: true,
        isBatch: true,
        selectedIds,
      });
    }


    async function handleUnSilence(record: Recordable) {
      try {
        await alertManagerEventUnSilence(record.id);
        createMessage.success('解除屏蔽成功');
        reload();
      } catch (error) {
        createMessage.error('解除屏蔽失败');
      }
    }

    function handleBatchUnSilence() {
      const selectedIds = unref(getSelectRowKeys());
      if (selectedIds.length === 0) return;

      createConfirm({
        iconType: 'warning',
        title: '确认批量解除屏蔽',
        content: `确认解除选中的 ${selectedIds.length} 个告警的屏蔽状态吗？`,
        onOk: async () => {
          try {
            await alertManagerEventBatchUnSilence({ eventIds: selectedIds });
            createMessage.success('批量解除屏蔽请求已发送');
            clearSelectedRowKeys();
            reload();
          } catch (error: any) {
            const errorMsg = error?.response?.data?.message || error?.message || '批量解除屏蔽失败';
            createMessage.error(errorMsg);
          }
        },
      });
    }

    async function handleReLing(record: Recordable) {
      try {
        await alertManagerEventReLing(record.id);
        createMessage.success('认领告警成功');
        reload();
      } catch (error) {
        createMessage.error('认领告警失败');
      }
    }

    function handleSuccess() {
      clearSelectedRowKeys();
      reload();
    }

    return {
      registerTable,
      registerDrawer,
      hasSelected,
      handleSilence,
      handleBatchSilence,
      handleUnSilence,
      handleBatchUnSilence,
      handleReLing,
      handleSuccess,
      roleColorMap,
      handleGoSendGroupName,
    };
  },
});
</script>