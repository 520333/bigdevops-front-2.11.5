<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate" v-auth="'POST:/api/workorder/createProcess'"> 新增流程 </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'users'">
          <span v-if="!record.users?.length" style="color: #ccc">
          <Icon icon="ant-design:user-outlined" /> 无
          </span>

          <Popover v-else placement="top" trigger="hover">
            <template #content>
              <div class="flex flex-wrap gap-2" style="max-width: 250px; padding: 4px;">
                <Tag
                  v-for="item in record.users"
                  :key="item.id"
                  :color="processColorMap[record.processValue] || 'blue'"
                >
                  {{ item.realName }} ({{ item.userName }})
                </Tag>
              </div>
            </template>

            <Tag 
              class="user-pill-wrapper" 
              :color="processColorMap[record.processValue] || 'blue'"
            >
              <Icon icon="ant-design:team-outlined" class="mr-1" />
              <span class="font-bold">{{ record.users.length }}</span>
            </Tag>
          </Popover>
        </template>
      


        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'clarity:note-edit-line',
                onClick: handleEdit.bind(null, record),
                auth: 'POST:/api/workorder/updateProcess'
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                popConfirm: {
                  title: '是否确认删除',
                  placement: 'left',
                  confirm: handleDelete.bind(null, record),
                },
                auth: 'DELETE:/api/workorder/deleteProcess/:id'
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <ProcessDrawer @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue';
  import { Tag, Popover, Button } from 'ant-design-vue';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import { deleteProcess, getProcessList } from '@/api/demo/system';
  import Icon from '@/components/Icon/Icon.vue';
  import { useDrawer } from '@/components/Drawer';
  import ProcessDrawer from './ProcessDrawer.vue';

  import { columns, searchFormSchema } from './process.data';
  import { useMessage } from '@/hooks/web/useMessage';
  export default defineComponent({
    name: 'ProcessManagement',
    components: { 
      BasicTable, ProcessDrawer, TableAction, Tag, Popover, AButton: Button, Icon
    },
    setup() {
      const processColorMap = {
        super: 'blue',   // 超级管理员
        test: 'orange',  // 测试
        cicd_admin: 'orange',   // 运行维护
        k8s_admin: 'red',     // 普通管理员
        tree_admin: 'cyan',    // 组织管理员
        prometheus_admin: 'green'     // 监控管理员
      };
      const [registerDrawer, { openDrawer }] = useDrawer();
      const [registerTable, { reload }] = useTable({
        title: '流程列表',
        api: getProcessList,
        columns,
        formConfig: {
          labelWidth: 120,
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

      function handleDelete(record: Recordable) {
        const { createMessage } = useMessage();
        deleteProcess(record.id).then(() => {
          createMessage.success('删除流程成功');
          reload()
        })
        .catch(() => {
          createMessage.error('删除流程失败');
        })
        .finally(() => {
          record.pending = false;
        })
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
        processColorMap,
      };
    },
  });
</script>
<style scoped lang="less">
/* 改造外层的 Tag 变成胶囊状 */
.user-pill-wrapper {
  display: inline-flex;
  align-items: center;
  padding: 2px 12px;
  border-radius: 14px; /* 圆角变成胶囊状 */
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
  border: 1px solid transparent; // 默认边框透明，跟随内置颜色

  &:hover {
    // 悬停时稍微加深
    filter: brightness(0.95);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  }

  // 修正内部图标的垂直对齐
  .anticon {
    font-size: 14px;
    margin-right: 4px;
  }
}

/* 确保 Popover 里的 Tag 间距 */
:deep(.ant-tag) {
  margin-right: 0; // 清除默认右间距，由 flex gap 控制
}
</style>