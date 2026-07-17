<template>
  <div>
    <BasicTable @register="registerTable" @fetch-success="onFetchSuccess">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate" v-auth="'POST:/api/system/createApi'"> 新增接口 </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction :actions="[
            {
              icon: 'clarity:note-edit-line',
              onClick: handleEdit.bind(null, record),
              // onClick: (e) => { e.stopPropagation(); handleEdit(record); },
              auth: 'POST:/api/system/updateApi'
              
            },
            {
              icon: 'ant-design:delete-outlined',
              color: 'error',
              popConfirm: {
                title: '是否确认删除',
                placement: 'left',
                confirm: handleDelete.bind(null, record),
              },
              auth: 'DELETE:/api/system/deleteApi/:id'
            },
          ]" />
        </template>
      </template>
    </BasicTable>
    <ApiDrawer @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>
<script lang="ts">
import { defineComponent, nextTick } from 'vue';

import { BasicTable, useTable, TableAction } from '@/components/Table';
import { deleteApi, getApiList } from '@/api/demo/system';

import { useDrawer } from '@/components/Drawer';
import ApiDrawer from './ApiDrawer.vue';

import { columns, searchFormSchema } from './api.data';
import { useMessage } from '@/hooks/web/useMessage';

export default defineComponent({
  name: 'ApiManagement',
  components: { BasicTable, ApiDrawer, TableAction },
  setup() {
    const [registerDrawer, { openDrawer }] = useDrawer();
    const [registerTable, { reload, expandAll }] = useTable({
      title: '接口列表',
      api: getApiList,
      rowKey: 'id',
      columns,
      formConfig: {
        labelWidth: 120,
        schemas: searchFormSchema,
      },
      isTreeTable: true,
      pagination: false,
      striped: false,
      useSearchForm: true,
      showTableSetting: true,
      bordered: true,
      showIndexColumn: false,
      expandRowByClick: true,
      canResize: true,
      actionColumn: {
        width: 80,
        title: '操作',
        dataIndex: 'action',
      },
      rowClassName: (record: any) => {
        return record.type === '0' ? 'tree-parent-row' : 'tree-child-row';
      }
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
      console.log(record);
      const { createMessage } = useMessage();
      deleteApi(record.id).then(() => {
        createMessage.success('删除成功');
        reload()
      }).catch(() => {
        createMessage.error('删除失败');
      });

    }

    function handleSuccess() {
      reload();
    }

    function onFetchSuccess() {
      // 演示默认展开所有表项
      // nextTick(expandAll);
    }

    return {
      registerTable,
      registerDrawer,
      handleCreate,
      handleEdit,
      handleDelete,
      handleSuccess,
      onFetchSuccess,
    };
  },
});
</script>
<style scoped lang="less">
:deep(.ant-table-tbody > tr.tree-parent-row > td) {
  background-color: #fafafa !important;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

:deep(.ant-table-tbody > tr.tree-parent-row > td:first-child) {
  position: relative;
}

:deep(.ant-table-tbody > tr.tree-parent-row > td:first-child::before) {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background-color: #1890ff;
}

:deep(.ant-table-tbody > tr.tree-child-row > td) {
  background-color: #ffffff !important;
}

:deep(.ant-table-tbody > tr.tree-parent-row:hover > td) {
  background-color: #f0f7ff !important;
}
</style>