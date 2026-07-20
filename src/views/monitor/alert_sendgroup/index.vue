<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate" v-auth="'POST:/api/monitor/createMonitorAlertManagerSendGroup'">
          新增发送组
        </a-button>
      </template>




      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'poolName'">
          <a-button type="link" size="small" @click="handleGoPlan()">
            {{ record.poolName }}
          </a-button>
        </template>

        <template v-if="column.key === 'onDutyGroupName'">
          <a-button type="link" size="small" @click="handleGoDutyGroupName(record.onDutyGroupId)">
            {{ record.onDutyGroupName }}
          </a-button>
        </template>

        <template v-if="column.key === 'toDayOnDutyUser'">
          <a-button type="primary" shape="round">
            {{ record.toDayOnDutyUser.realName }}
          </a-button>
        </template>

        <template v-if="column.key === 'firstUpgradeUsers'">
          <span v-if="!record.firstUpgradeUsers?.length" style="color: #ccc">
            <Icon icon="ant-design:user-outlined" /> 无
          </span>
          <Popover v-else placement="top" trigger="hover">
            <template #content>
              <div class="flex flex-wrap gap-2" style="max-width: 250px; padding: 4px;">
                <Tag v-for="(item, index) in record.firstUpgradeUsers" :key="item.id || index"
                  :color="roleColorMap[Number(index) % roleColorMap.length] || 'blue'">
                  {{ item.realName }}
                </Tag>
              </div>
            </template>

            <Tag class="user-pill-wrapper" :color="roleColorMap[record.id % roleColorMap.length]">
              <Icon icon="ant-design:team-outlined" class="mr-1" />
              <span class="font-bold">{{ record.firstUpgradeUsers.length }}</span>
            </Tag>
          </Popover>
        </template>


        <template v-if="column.key === 'action'">
          <TableAction :actions="[
            {
              icon: 'clarity:note-edit-line',
              onClick: handleEdit.bind(null, record),
              tooltip: '编辑发送组',
              auth: 'POST:/api/monitor/updateMonitorAlertManagerSendGroup'
            },
            {
              icon: 'ant-design:delete-outlined',
              color: 'error',
              tooltip: '删除发送组',
              popConfirm: {
                title: '是否确认删除该发送组？',
                placement: 'left',
                confirm: handleDelete.bind(null, record),
              },
              auth: 'DELETE:/api/monitor/deleteMonitorAlertManagerSendGroup'
            },
          ]" />
        </template>
      </template>
    </BasicTable>

    <SendGroupDrawer @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Tag, Popover, Button } from 'ant-design-vue';
import Icon from '@/components/Icon/Icon.vue';

import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useDrawer } from '@/components/Drawer';
import { useModal } from '@/components/Modal';
import SendGroupDrawer from './SendGroupDrawer.vue';
import { columns, searchFormSchema } from './sendgroup.data.js';
import { useMessage } from '@/hooks/web/useMessage';
import { getMonitorAlertManagerSendGroupList, deleteMonitorAlertManagerSendGroup } from '@/api/demo/system';
import { useGo } from '@/hooks/web/usePage';
export default defineComponent({
  name: 'MonitorAlertSendGroup',
  components: { BasicTable, SendGroupDrawer, TableAction, Tag, Popover, AButton: Button, Icon },
  setup() {
    const go = useGo();
    const [registerDrawer, { openDrawer }] = useDrawer();
    const [registerYamlModal, { openModal: openYamlModal }] = useModal();
    const roleColorMap = ['blue', 'orange', 'orange', 'red', 'cyan', 'green'];
    const [registerTable, { reload }] = useTable({
      title: '发送组列表',
      api: getMonitorAlertManagerSendGroupList,
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
    function handleGoPlan() {
      go("/monitor/alert_manager");
    }

    function handleGoDutyGroupName(id: number) {
      go(`/monitor/onduty_plan?id=${id}`);
    }
    function openYamlPreview(member: string) {
      // 打开弹窗，并把成员姓名传给弹窗去请求后端
      openYamlModal(true, { member });
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
        await deleteMonitorAlertManagerSendGroup(record.id);
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
      handleGoPlan,
      handleGoDutyGroupName
    };
  },
});
</script>