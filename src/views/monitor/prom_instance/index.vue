<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate" v-auth="'POST:/api/monitor/createMonitorPromScrapePool'">
          新增采集池
        </a-button>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'prometheus_instances'">
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            <a-dropdown v-for="ip in record.prometheus_instances" :key="ip" :trigger="['click']">
              <a-button size="small" type="primary" shape="round"
                style="display: flex; align-items: center; padding: 0 10px;">
                {{ ip }}
                <Icon icon="ant-design:down-outlined" style="margin-left: 4px; font-size: 10px;" />
              </a-button>

              <template #overlay>
                <a-menu>
                  <a-menu-item key="main" @click="openYamlPreview(ip, 'main')"
                    v-if="hasPermission('GET:/api/monitor/getMonitorPrometheusYamlOne')">
                    查看主配置 (prometheus.yml)
                  </a-menu-item>
                  <a-menu-item key="rule" @click="openYamlPreview(ip, 'rule')"
                    v-if="hasPermission('GET:/api/monitor/getMonitorPrometheusAlertRuleYamlOne')">
                    查看告警规则 (rule.yml)
                  </a-menu-item>
                  <a-menu-item key="record" @click="openYamlPreview(ip, 'record')"
                    v-if="hasPermission('GET:/api/monitor/getMonitorPrometheusRecordRuleYamlOne')">
                    查看预聚合规则 (record.yml)
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </template>

        <template v-if="column.key === 'action'">
          <TableAction :actions="[
            {
              icon: 'clarity:note-edit-line',
              onClick: handleEdit.bind(null, record),
              tooltip: '编辑采集池',
              auth: 'POST:/api/monitor/updateMonitorPromScrapePool'
            },
            {
              icon: 'ant-design:delete-outlined',
              color: 'error',
              tooltip: '删除采集池',
              popConfirm: {
                title: '是否确认删除该采集池？',
                placement: 'left',
                confirm: handleDelete.bind(null, record),
              },
              auth: 'DELETE:/api/monitor/deleteMonitorPromScrapePool/:id'
            },
          ]" />
        </template>
      </template>
    </BasicTable>

    <PoolDrawer @register="registerDrawer" @success="handleSuccess" />
    <YamlModal @register="registerYamlModal" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useDrawer } from '@/components/Drawer';
import { useModal } from '@/components/Modal';

import { Dropdown, Menu, MenuItem } from 'ant-design-vue';
import Icon from '@/components/Icon/Icon.vue';

import YamlModal from './yaml.vue';
import PoolDrawer from './PoolDrawer.vue';
import { columns, searchFormSchema } from './pool.data.js';
import { useMessage } from '@/hooks/web/useMessage';
import { getMonitorPromScrapePoolList, deleteMonitorPromScrapePool } from '@/api/demo/system';
import { usePermission } from '@/hooks/web/usePermission';

export default defineComponent({
  name: 'MonitorScrapePoolManagement',
  components: {
    BasicTable, PoolDrawer, TableAction, YamlModal,
    Icon, ADropdown: Dropdown, AMenu: Menu, AMenuItem: MenuItem
  },
  setup() {
    const [registerDrawer, { openDrawer }] = useDrawer();
    const [registerYamlModal, { openModal: openYamlModal }] = useModal();
    const { hasPermission } = usePermission();
    const [registerTable, { reload }] = useTable({
      title: '采集池列表',
      api: getMonitorPromScrapePoolList,
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


    function openYamlPreview(ip: string, type: 'main' | 'rule' | 'record' = 'main') {
      openYamlModal(true, { ip, type });
    }

    function handleCreate() {
      openDrawer(true, { isUpdate: false });
    }

    function handleEdit(record: Recordable) {
      openDrawer(true, { record, isUpdate: true });
    }

    async function handleDelete(record: Recordable) {
      const { createMessage } = useMessage();
      try {
        await deleteMonitorPromScrapePool(record.id);
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
      hasPermission
    };
  },
});
</script>