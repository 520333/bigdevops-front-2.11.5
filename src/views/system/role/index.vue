<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate" v-auth="'POST:/api/system/createRole'"> 新增角色 </a-button>
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
                  :color="roleColorMap[record.roleValue] || 'blue'"
                >
                  {{ item.realName }} ({{ item.userName }})
                </Tag>
              </div>
            </template>

            <Tag 
              class="user-pill-wrapper" 
              :color="roleColorMap[record.roleValue] || 'blue'"
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
                auth: 'POST:/api/system/updateRole'
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                popConfirm: {
                  title: '是否确认删除',
                  placement: 'left',
                  confirm: handleDelete.bind(null, record),
                },
                auth: 'DELETE:/api/system/deleteRole/:id'
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <RoleDrawer @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue';
  import { Tag, Popover, Button } from 'ant-design-vue';
  

  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import { deleteRole, getRoleListByPage } from '@/api/demo/system';
  import Icon from '@/components/Icon/Icon.vue';
  import { useDrawer } from '@/components/Drawer';
  import RoleDrawer from './RoleDrawer.vue';

  import { columns, searchFormSchema } from './role.data';
  import { useMessage } from '@/hooks/web/useMessage';
  export default defineComponent({
    name: 'RoleManagement',
    components: { 
      BasicTable, RoleDrawer, TableAction, Tag, Popover, AButton: Button, Icon
    },
    setup() {
      const roleColorMap = {
        super: 'blue',   // 超级管理员
        test: 'orange',  // 测试
        cicd_admin: 'orange',   // 运行维护
        k8s_admin: 'red',     // 普通管理员
        tree_admin: 'cyan',    // 组织管理员
        prometheus_admin: 'green'     // 监控管理员
      };
      const [registerDrawer, { openDrawer }] = useDrawer();
      const [registerTable, { reload }] = useTable({
        title: '角色列表',
        api: getRoleListByPage,
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
        deleteRole(record.id).then(() => {
          createMessage.success('删除角色成功');
          reload()
        })
        .catch(() => {
          createMessage.error('删除角色失败');
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
        roleColorMap,
      };
    },
  });
</script>
<!-- <style scoped lang="less">
.user-pill-wrapper {
  display: inline-flex;
  align-items: center;
  padding: 2px 12px;
  border-radius: 14px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
  border: 1px solid transparent;

  &:hover {
    filter: brightness(0.95);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  }

  .anticon {
    font-size: 14px;
    margin-right: 4px;
  }
}

:deep(.ant-tag) {
  margin-right: 0;
}
</style> -->