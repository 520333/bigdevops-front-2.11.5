<template>
  <PageWrapper dense contentFullHeight contentClass="flex">
    <BasicTable @register="registerTable" class="w-full" :searchInfo="searchInfo">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate">新增账号</a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'roles'">
          <div class="flex flex-wrap gap-1" style="white-space: normal;">
            <Tag
              :color="roleColorMap[item.value] || 'green'"
              v-for="item in (record.roles || [])"
              :key="item.roleValue"
            >
              {{ item.roleValue }}
            </Tag>
          </div>
        </template>
        

        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'clarity:info-standard-line',
                tooltip: '查看用户详情',
                onClick: handleView.bind(null, record),
              },
              {
                icon: 'clarity:note-edit-line',
                tooltip: '编辑用户资料',
                onClick: handleEdit.bind(null, record),
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                tooltip: '删除此账号',
                popConfirm: {
                  title: '是否确认删除',
                  placement: 'left',
                  confirm: handleDelete.bind(null, record),
                },
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <DeployModal @register="registerModal" @success="handleSuccess" />
  </PageWrapper>
</template>
<script lang="ts">
  import { defineComponent, reactive } from 'vue';
  import { Tag } from 'ant-design-vue';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import { getDeployList,deleteDeployList } from '@/api/cicd/deploy';
  import { PageWrapper } from '@/components/Page';
  import DeployModal from './DeployModal.vue'
  import { useModal } from '@/components/Modal';

  import { columns, searchFormSchema } from './deploy.data';
  import { useGo } from '@/hooks/web/usePage';
  import { useMessage } from '@/hooks/web/useMessage';

  export default defineComponent({
    name: 'CiCdDeployList',
    components: { BasicTable, PageWrapper,  TableAction, Tag,DeployModal },
    setup() {
      const roleColorMap = {
        super: 'blue',   // 超级管理员
        test: 'orange',  // 测试
        cicd_admin: 'orange',   // 运行维护
        k8s_admin: 'red',     // 普通管理员
        tree_admin: 'cyan',    // 组织管理员
        prometheus_admin: 'green'     // 监控管理员
      };
      const go = useGo();
      const [registerModal, { openModal }] = useModal();
      const searchInfo = reactive<Recordable>({});
      const [registerTable, { reload }] = useTable({
        title: '发布工单',
        api: getDeployList,
        rowKey: 'id',
        columns,
        formConfig: {
          labelWidth: 120,
          schemas: searchFormSchema,
          autoSubmitOnEnter: true,
        },
        useSearchForm: true,
        showTableSetting: true,
        bordered: true,
        handleSearchInfoFn(info) {
          console.log('handleSearchInfoFn', info);
          return info;
        },
        actionColumn: {
          width: 120,
          title: '操作',
          dataIndex: 'action',
        },
        canResize: false,
      });

      function handleCreate() {
        openModal(true, {
          isUpdate: false,
        });
      }

      function handleEdit(record: Recordable) {
        openModal(true, {
          record,
          isUpdate: true,
        });
      }

      function handleDelete(record: Recordable) {
        const { createMessage } = useMessage();
        deleteDeployList(record.id).then(() => {
          createMessage.success('用户删除成功');
        }).catch(() => {
          createMessage.error('用户删除失败');
        }).finally(() => {
          reload();
        });
      }

      function handleSuccess({ isUpdate, values }) {
        if (isUpdate) {
          reload();
        } else {
          reload();
        }
      }

      function handleSelect(deptId = '') {
        searchInfo.deptId = deptId;
        reload();
      }

      function handleView(record: Recordable) {
        go('/system/account_detail/' + record.userId);
      }

      return {
        registerTable,
        registerModal,
        handleCreate,
        handleEdit,
        handleDelete,
        handleSuccess,
        handleSelect,
        handleView,
        searchInfo,
        roleColorMap
      };
    },
  });
</script>
