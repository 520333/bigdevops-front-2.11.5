<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate" v-auth="'POST:/api/k8s/createK8sCluster'">
          新增集群
        </a-button>
        <a-button danger @click="handleBatchDelete" :disabled="!hasSelected" v-auth="'DELETE:/api/k8s/deleteK8sClusterBatch'">
          批量删除
        </a-button>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'env'">
          <Tag :color="envColorMap[record.env] || 'default'">
            {{ record.env }}
          </Tag>
        </template>

        <template v-if="column.key === 'action'">
          <TableAction :actions="[
            {
              icon: 'clarity:note-edit-line',
              onClick: handleEdit.bind(null, record),
              tooltip: '编辑集群',
              auth: 'POST:/api/k8s/updateK8sCluster'
            },
            {
              icon: 'ant-design:delete-outlined',
              color: 'error',
              tooltip: '删除集群',
              popConfirm: {
                title: '是否确认删除该集群及配置？',
                placement: 'left',
                confirm: handleDelete.bind(null, record),
              },
              auth: 'DELETE:/api/k8s/deleteK8sCluster/:id'
            },
          ]" />
        </template>
      </template>
    </BasicTable>

    <ClusterDrawer @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { Tag } from 'ant-design-vue';
import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useDrawer } from '@/components/Drawer';
import { useMessage } from '@/hooks/web/useMessage';
import ClusterDrawer from './ClusterDrawer.vue';
import { columns, searchFormSchema } from './cluster.data';
import { getK8sClusterList, deleteK8sCluster, deleteK8sClusterBatch } from '@/api/demo/system';

export default defineComponent({
  name: 'K8sClusterManagement',
  components: { BasicTable, Tag, TableAction, ClusterDrawer },
  setup() {
    const [registerDrawer, { openDrawer }] = useDrawer();
    const { createMessage, createConfirm } = useMessage();

    const envColorMap: Record<string, string> = {
      dev: 'green',
      test: 'blue',
      pre: 'orange',
      prod: 'red',
    };

    const [registerTable, { reload, getSelectRowKeys, clearSelectedRowKeys, getSelectRows }] = useTable({
      title: 'K8s集群列表',
      api: getK8sClusterList,
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
        width: 100,
        title: '操作',
        dataIndex: 'action',
      },
    });

    const hasSelected = computed(() => getSelectRows().length > 0);

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
      try {
        await deleteK8sCluster(record.id);
        createMessage.success('删除成功');
        reload();
      } catch (error) {
        console.error('删除失败:', error);
      }
    }

    async function handleBatchDelete() {
      const ids = getSelectRowKeys().map((id) => Number(id));
      if (ids.length === 0) return;

      createConfirm({
        iconType: 'warning',
        title: '批量删除确认',
        content: `确定要批量删除选中的 ${ids.length} 个K8s集群吗？`,
        onOk: async () => {
          try {
            await deleteK8sClusterBatch({ ids });
            createMessage.success('批量删除成功');
            clearSelectedRowKeys();
            reload();
          } catch (error) {
            console.error('批量删除失败:', error);
          }
        },
      });
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
      handleBatchDelete,
      handleSuccess,
      hasSelected,
      envColorMap,
    };
  },
});
</script>