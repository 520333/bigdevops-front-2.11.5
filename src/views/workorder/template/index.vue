<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate" v-auth="'POST:/api/workorder/createWorkOrderTemplate'"> 
          新增工单模板 
        </a-button>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'clarity:note-edit-line',
                onClick: handleEdit.bind(null, record),
                tooltip: '编辑模板',
                auth: 'POST:/api/workorder/updateWorkOrderTemplate'
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                tooltip: '删除模板',
                popConfirm: {
                  title: '是否确认删除该工单模板？',
                  placement: 'left',
                  confirm: handleDelete.bind(null, record),
                },
                auth: 'DELETE:/api/workorder/deleteWorkOrderTemplate/:id'
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    
    <TemplateDrawer @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import { useDrawer } from '@/components/Drawer';
  import TemplateDrawer from './TemplateDrawer.vue';
  import { columns, searchFormSchema } from './template.data';
  import { useMessage } from '@/hooks/web/useMessage';
  
  import { getWorkOrderTemplateList, deleteWorkOrderTemplate } from '@/api/demo/system';

  export default defineComponent({
    name: 'WorkOrderTemplateManagement',
    components: { BasicTable, TemplateDrawer, TableAction },
    setup() {
      const [registerDrawer, { openDrawer }] = useDrawer();
      
      const [registerTable, { reload }] = useTable({
        title: '工单模板列表',
        api: getWorkOrderTemplateList, 
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
          await deleteWorkOrderTemplate(record.id);
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
      };
    },
  });
</script>