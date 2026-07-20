<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate" v-auth="'POST:/api/monitor/createMonitorAlertManagerPool'">
          新增实例
        </a-button>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'alertManagerInstances'">
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            <a-button v-for="ip in record.alertManagerInstances" :key="ip" size="small" type="primary" shape="round"
              style="display: flex; align-items: center; padding: 0 10px;" @click="openYamlPreview(ip)">
              {{ ip }}
            </a-button>
          </div>
        </template>

        <template v-if="column.key === 'action'">
          <TableAction :actions="[
            {
              icon: 'clarity:note-edit-line',
              onClick: handleEdit.bind(null, record),
              tooltip: '编辑实例',
              auth: 'POST:/api/monitor/updateMonitorAlertManagerPool'
            },
            {
              icon: 'ant-design:delete-outlined',
              color: 'error',
              tooltip: '删除实例',
              popConfirm: {
                title: '是否确认删除该实例？',
                placement: 'left',
                confirm: handleDelete.bind(null, record),
              },
              auth: 'DELETE:/api/monitor/deleteMonitorAlertManagerPool'
            },
          ]" />
        </template>
      </template>
    </BasicTable>

    <AlertManagerDrawer @register="registerDrawer" @success="handleSuccess" />
    <YamlModal @register="registerYamlModal" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Tag, Popover, Button } from 'ant-design-vue';
import Icon from '@/components/Icon/Icon.vue';

import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useDrawer } from '@/components/Drawer';
import { useModal } from '@/components/Modal';
import YamlModal from './yaml.vue';
import AlertManagerDrawer from './AlertManagerDrawer.vue';
import { columns, searchFormSchema } from './alertmanager.data.js';
import { useMessage } from '@/hooks/web/useMessage';
import { getMonitorAlertManagerPoolList, deleteMonitorAlertManagerPool } from '@/api/demo/system';
import { useGo } from '@/hooks/web/usePage';
export default defineComponent({
  name: 'MonitorSendGroupManagement',
  components: { BasicTable, AlertManagerDrawer, TableAction, YamlModal, Tag, Popover, AButton: Button, Icon },
  setup() {
    const go = useGo();
    const [registerDrawer, { openDrawer }] = useDrawer();
    const [registerYamlModal, { openModal: openYamlModal }] = useModal();
    const roleColorMap = ['blue', 'orange', 'orange', 'red', 'cyan', 'green'];
    const [registerTable, { reload }] = useTable({
      title: '实例列表',
      api: getMonitorAlertManagerPoolList,
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
    function handleGoPlan(id: number) {
      go(`/monitor/onduty_plan?id=${id}`);
    }
    function openYamlPreview(ip: string) {
      openYamlModal(true, { ip });
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
        await deleteMonitorAlertManagerPool(record.id);
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
      registerYamlModal,
      openYamlPreview,
      handleCreate,
      handleEdit,
      handleDelete,
      handleSuccess,
      roleColorMap,
      handleGoPlan
    };
  },
});
</script>