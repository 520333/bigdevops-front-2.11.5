<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate" v-auth="'POST:/api/monitor/createMonitorPromScrapeJob'">
          新增采集任务
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
              tooltip: '编辑采集任务',
              auth: 'POST:/api/monitor/updateMonitorPromScrapeJob'
            },
            {
              icon: 'ant-design:delete-outlined',
              color: 'error',
              tooltip: '删除采集任务',
              popConfirm: {
                title: '是否确认删除该采集任务？',
                placement: 'left',
                confirm: handleDelete.bind(null, record),
              },
              auth: 'DELETE:/api/monitor/deleteMonitorPromScrapeJob'
            },
          ]" />
        </template>
      </template>
    </BasicTable>

    <ScrapeJobDrawer @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useDrawer } from '@/components/Drawer';
import ScrapeJobDrawer from './ScrapeJobDrawer.vue';
import { columns, searchFormSchema } from './job.data.js';
import { useMessage } from '@/hooks/web/useMessage';
import { getMonitorPromScrapeJobList, deleteMonitorPromScrapeJob } from '@/api/demo/system';
import { useGo } from '@/hooks/web/usePage';
export default defineComponent({
  name: 'MonitorScrapePoolManagement',
  components: { BasicTable, ScrapeJobDrawer, TableAction },
  setup() {
    const [registerDrawer, { openDrawer }] = useDrawer();
    const go = useGo();
    const [registerTable, { reload }] = useTable({
      title: '采集任务列表',
      api: getMonitorPromScrapeJobList,
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
        width: 80,
        title: '操作',
        dataIndex: 'action',
      },
    });

    function handleGoPrometheus() {
      go("/monitor/pool");
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
        await deleteMonitorPromScrapeJob(record.id);
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
      handleGoPrometheus,
      handleCreate,
      handleEdit,
      handleDelete,
      handleSuccess,

    };
  },
});
</script>