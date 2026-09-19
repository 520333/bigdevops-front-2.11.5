<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate" v-auth="'POST:/api/monitor/createMonitorPromScrapeJob'">
          新增采集任务
        </a-button>
        <a-button
          type="default"
          preIcon="ant-design:copy-outlined"
          @click="handleCopySelected"
          v-auth="'POST:/api/monitor/createMonitorPromScrapeJob'"
        >
          复制采集任务
        </a-button>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'poolName' || column.dataIndex === 'poolName'">
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
              icon: 'ant-design:copy-outlined',
              onClick: handleCopy.bind(null, record),
              tooltip: '复制采集任务',
              auth: 'POST:/api/monitor/createMonitorPromScrapeJob'
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
              auth: 'DELETE:/api/monitor/deleteMonitorPromScrapeJob/:id'
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
    const { createMessage } = useMessage();
    const [registerDrawer, { openDrawer }] = useDrawer();
    const go = useGo();
    const [registerTable, { reload, getSelectRows }] = useTable({
      title: '采集任务列表',
      api: getMonitorPromScrapeJobList,
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
        width: 120,
        title: '操作',
        dataIndex: 'action',
      },
    });

    function handleGoPrometheus() {
      go("/monitor/prom_instance");
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
        createMessage.warning('请先在列表中勾选要复制的采集任务');
        return;
      }
      if (selected.length > 1) {
        createMessage.warning('每次仅支持复制单条任务，请仅勾选一条采集任务');
        return;
      }
      handleCopy(selected[0]);
    }

    async function handleDelete(record: Recordable) {
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
      handleCopy,
      handleCopySelected,
      handleDelete,
      handleSuccess,
    };
  },
});
</script>