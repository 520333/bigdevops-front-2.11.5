<template>
  <div class="h-full flex flex-col w-full bg-white">

    <div v-if="showTableIf" class="flex-1 overflow-auto h-full p-4">
      <BasicTable @register="registerTable">
        <template #toolbar>
          <a-button type="primary" @click="handleCreate" v-auth="'POST:/api/workorder/createWorkOrderTemplate'">
            新增表单设计
          </a-button>
        </template>

        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <TableAction :actions="[
              {
                icon: 'clarity:note-edit-line',
                tooltip: '设计表单',
                onClick: handleEdit.bind(null, record),
                auth: 'POST:/api/workorder/updateWorkOrderTemplate'
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                tooltip: '删除表单',
                popConfirm: {
                  title: '是否确认删除该表单?',
                  placement: 'left',
                  confirm: handleDelete.bind(null, record),
                },
                auth: 'DELETE:/api/workorder/deleteWorkOrderTemplate/:id'
              },
            ]" />
          </template>
        </template>
      </BasicTable>
    </div>

    <div v-if="showFormDesignIf" class="flex-1 flex flex-col h-full overflow-hidden">
      <div class="p-2 border-b flex justify-between items-center bg-white z-10 shadow-sm">

        <div class="flex items-center ml-2">
          <span class="font-bold text-base mr-4">
            {{ isUpdate ? '编辑表单' : '新增表单' }}
          </span>
          <span class="text-red-500 mr-1">*</span>
          <a-input v-model:value="formName" placeholder="请输入表单名称" style="width: 250px"
            :status="nameError ? 'error' : ''" @change="nameError = false" />
        </div>

        <div>
          <a-button type="primary" class="mr-2" @click="handleSave" :loading="saving"> 保存配置 </a-button>
          <a-button @click="handleBack"> 返回表格 </a-button>
        </div>
      </div>

      <PageWrapper dense contentFullHeight fixedHeight>
        <VFormDesign ref="formDesignRef" />
      </PageWrapper>
    </div>

  </div>
</template>

<script lang="ts">
import { defineComponent, ref, nextTick, unref } from 'vue';
import { Button, Input } from 'ant-design-vue';
import VFormDesign from '@/views/form-design/components/VFormDesign/index.vue';
import { BasicTable, useTable, TableAction } from '@/components/Table';
import { useMessage } from '@/hooks/web/useMessage';
import { columns, searchFormSchema } from './formDesign.data';
import { PageWrapper } from '@/components/Page';
import {
  getFormDesignList,
  createFormDesign,
  updateFormDesign,
  deleteFormDesign
} from '@/api/demo/system';

export default defineComponent({
  name: 'FormDesignManagement',
  components: { BasicTable, TableAction, VFormDesign, PageWrapper, AButton: Button, AInput: Input },
  setup() {
    const { createMessage } = useMessage();

    // --- 页面状态控制 ---
    const showFormDesignIf = ref(false);
    const showTableIf = ref(true);
    const saving = ref(false);

    // 表单名称相关
    const formName = ref('');
    const nameError = ref(false);

    const formDesignRef = ref();
    const isUpdate = ref(false);
    const currentRecord = ref<Recordable | null>(null);

    // --- 注册表格 ---
    const [registerTable, { reload }] = useTable({
      title: '表单设计列表',
      api: getFormDesignList,
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

    // --- 辅助函数：通过 Vue 底层实例强行获取未导出的 setup 状态 ---
    const getDesignerState = () => {
      return formDesignRef.value?.$?.setupState || {};
    };

    // --- 1. 新增操作 ---
    function handleCreate() {
      isUpdate.value = false;
      currentRecord.value = null;

      formName.value = '';
      nameError.value = false;

      showTableIf.value = false;
      showFormDesignIf.value = true;

      // 新增时清空画板
      nextTick(() => {
        const state = getDesignerState();
        if (typeof state.handleClearFormItems === 'function') {
          state.handleClearFormItems();

        }
      });
    }

    // --- 2. 编辑操作 (数据回显) ---
    function handleEdit(record: Recordable) {
      isUpdate.value = true;
      currentRecord.value = record;

      formName.value = record.name || '';
      nameError.value = false;

      showTableIf.value = false;
      showFormDesignIf.value = true;

      nextTick(() => {
        if (record.formConfig) {
          try {
            const configData = typeof record.formConfig === 'string'
              ? JSON.parse(record.formConfig)
              : record.formConfig;

            const state = getDesignerState();
            // 直接调用子组件内部的 setFormConfig
            if (typeof state.setFormConfig === 'function') {
              state.setFormConfig(configData);
            }
          } catch (error) {
            console.error('解析表单配置失败', error);
          }
        }
      });
    }

    // --- 3. 保存操作 (调用 API) ---
    async function handleSave() {
      if (!formName.value || !formName.value.trim()) {
        nameError.value = true;
        createMessage.warning('请先输入表单名称！');
        return;
      }

      const state = getDesignerState();

      // 直接读取子组件内部的 formConfig 变量
      let result = {};
      if (state.formConfig) {
        result = unref(state.formConfig);
      }

      const payload = {
        ...(currentRecord.value || {}),
        name: formName.value.trim(),
        formConfig: JSON.stringify(result),
      };

      try {
        saving.value = true;

        if (isUpdate.value) {
          await updateFormDesign({ ...payload, id: currentRecord.value?.id });
          createMessage.success('表单更新成功');
        } else {
          await createFormDesign(payload);
          createMessage.success('表单创建成功');
        }

        handleBack();
        reload();
      } catch (error: any) {
        console.error(error);
        if (error?.message?.includes('Duplicate entry') || error?.message?.includes('1062')) {
          createMessage.error(`保存失败：表单名称 "${formName.value}" 已存在，请换一个名称`);
          nameError.value = true;
        } else {
          createMessage.error('保存失败，请检查网络或后端日志');
        }
      } finally {
        saving.value = false;
      }
    }

    // --- 4. 删除操作 ---
    async function handleDelete(record: Recordable) {
      try {
        await deleteFormDesign(record.id);
        createMessage.success('删除成功');
        reload();
      } catch (error) {
        createMessage.error('删除失败');
      }
    }

    // --- 5. 返回表格 ---
    function handleBack() {
      showFormDesignIf.value = false;
      showTableIf.value = true;
    }

    return {
      registerTable,
      handleCreate,
      handleEdit,
      handleDelete,
      handleSave,
      handleBack,
      showFormDesignIf,
      showTableIf,
      formDesignRef,
      isUpdate,
      saving,
      formName,
      nameError
    };
  },
});
</script>