<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate" v-auth="'POST:/api/monitor/createMonitorOndutyGroup'">
          新增值班组
        </a-button>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'">
          <a-button type="link" size="small" @click="handleGoPlan(record.id)">
            {{ record.name }}
          </a-button>
        </template>

        <template v-if="column.key === 'toDayOnDutyUser'">
          <a-button type="primary" shape="round">
            {{ record.toDayOnDutyUser.realName }}
          </a-button>
        </template>

        <template v-if="column.key === 'userNames'">
          <span v-if="!record.userNames?.length" style="color: #ccc">
            <Icon icon="ant-design:user-outlined" /> 无
          </span>
          <Popover v-else placement="top" trigger="hover">
            <template #content>
              <div class="flex flex-wrap gap-2" style="max-width: 250px; padding: 4px;">
                <Tag v-for="(item, index) in record.userNames" :key="index"
                  :color="roleColorMap[Number(index) % roleColorMap.length] || 'blue'">
                  {{ item }}
                </Tag>
              </div>
            </template>

            <Tag class="user-pill-wrapper" :color="roleColorMap[record.id % roleColorMap.length]">
              <Icon icon="ant-design:team-outlined" class="mr-1" />
              <span class="font-bold">{{ record.members.length }}</span>
            </Tag>
          </Popover>
        </template>


        <template v-if="column.key === 'action'">
          <TableAction :actions="[
            {
              icon: 'clarity:note-edit-line',
              onClick: handleEdit.bind(null, record),
              tooltip: '编辑值班组',
              auth: 'POST:/api/monitor/updateMonitorOndutyGroup'
            },
            {
              icon: 'ant-design:delete-outlined',
              color: 'error',
              tooltip: '删除值班组',
              popConfirm: {
                title: '是否确认删除该值班组？',
                placement: 'left',
                confirm: handleDelete.bind(null, record),
              },
              auth: 'DELETE:/api/monitor/deleteMonitorOndutyGroup/:id'
            },
          ]" />
        </template>
      </template>
    </BasicTable>

    <OnDutyGroupDrawer @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Tag, Popover, Button } from 'ant-design-vue';
import Icon from '@/components/Icon/Icon.vue';

import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useDrawer } from '@/components/Drawer';
import OnDutyGroupDrawer from './OnDutyGroupDrawer.vue';
import { columns, searchFormSchema } from './ondutygroup.data.js';
import { useMessage } from '@/hooks/web/useMessage';
import { getMonitorOndutyGroupList, deleteMonitorOndutyGroup } from '@/api/demo/system';
import { useGo } from '@/hooks/web/usePage';
export default defineComponent({
  name: 'MonitorOndutyGroupManagement',
  components: { BasicTable, OnDutyGroupDrawer, TableAction, Tag, Popover, AButton: Button, Icon },
  setup() {
    const go = useGo();
    const [registerDrawer, { openDrawer }] = useDrawer();
    const roleColorMap = ['blue', 'orange', 'orange', 'red', 'cyan', 'green'];
    const [registerTable, { reload }] = useTable({
      title: '值班组列表',
      api: getMonitorOndutyGroupList,
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
        await deleteMonitorOndutyGroup(record.id);
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
      handleGoPlan
    };
  },
});
</script>