<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button
          type="primary"
          preIcon="ant-design:plus-outlined"
          v-auth="'POST:/api/cicd/createJenkinsPipeline'"
          @click="handleCreatePipeline"
        >
          新增流水线模版
        </a-button>
      </template>

      <!-- Custom Body Cells: Action Column -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <div @click.stop>
            <TableAction
              :actions="[
                {
                  icon: 'ant-design:edit-outlined',
                  tooltip: '编辑模版',
                  auth: 'POST:/api/cicd/updateJenkinsPipeline',
                  onClick: handleEditPipeline.bind(null, record),
                },
                {
                  icon: 'ant-design:check-circle-outlined',
                  tooltip: '语法校验',
                  auth: 'POST:/api/cicd/validateJenkinsPipeline',
                  onClick: handleValidatePipeline.bind(null, record),
                },
                {
                  icon: 'ant-design:delete-outlined',
                  color: 'error',
                  tooltip: '删除模版',
                  auth: 'DELETE:/api/cicd/deleteJenkinsPipeline',
                  popConfirm: {
                    title: `是否确认删除流水线模版 [${record.name}]？`,
                    placement: 'left',
                    confirm: handleDeletePipeline.bind(null, record),
                  },
                },
              ]"
            />
          </div>
        </template>
      </template>

      <!-- Expand Row Slot: Show Groovy Pipeline Script -->
      <template #expandedRowRender="{ record }">
        <div
          class="p-3 bg-slate-900 rounded-lg text-white border border-slate-700 font-mono shadow-inner my-1"
        >
          <div
            class="flex items-center justify-between text-xs text-slate-400 mb-2 pb-2 border-b border-slate-800"
          >
            <span class="flex items-center gap-2">
              <Icon icon="ant-design:code-outlined" class="text-cyan-400 text-base" />
              <span class="font-bold text-slate-200 font-sans"
                >流水线 Groovy 定义: {{ record.name }}</span
              >
            </span>
          </div>
          <div class="rounded overflow-hidden">
            <Codemirror
              :model-value="record.pipelineScript || '// 暂无定义代码'"
              :style="{ height: '480px', fontSize: '13px' }"
              :extensions="pipelineEditorExtensions"
              :disabled="true"
            />
          </div>
        </div>
      </template>
    </BasicTable>

    <!-- Create & Edit Pipeline Drawer -->
    <PipelineDrawer @register="registerDrawer" @success="reload" />
  </div>
</template>

<script lang="ts" setup>
  import { Modal } from 'ant-design-vue';
  import Icon from '@/components/Icon/Icon.vue';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import { useDrawer } from '@/components/Drawer';
  import {
    getJenkinsPipelineList,
    deleteJenkinsPipeline,
    validateJenkinsPipeline,
  } from '@/api/cicd';
  import { useMessage } from '@/hooks/web/useMessage';
  import { columns, searchFormSchema, pipelineEditorExtensions } from './pipeline.data';
  import PipelineDrawer from './PipelineDrawer.vue';
  import { Codemirror } from 'vue-codemirror';

  defineOptions({ name: 'JenkinsPipelineManagement' });

  const { createMessage } = useMessage();
  const [registerDrawer, { openDrawer }] = useDrawer();

  const [registerTable, { reload }] = useTable({
    title: '流水线模版列表',
    api: async (params) => {
      const res: any = await getJenkinsPipelineList({
        lang: params?.lang,
        keyword: params?.keyword,
      });
      return res?.items || res || [];
    },
    columns,
    formConfig: {
      labelWidth: 100,
      schemas: searchFormSchema,
      autoSubmitOnEnter: true,
    },
    useSearchForm: true,
    showTableSetting: true,
    bordered: true,
    showIndexColumn: false,
    expandRowByClick: true,
    pagination: {
      pageSize: 10,
      showQuickJumper: true,
    },
    actionColumn: {
      width: 130,
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      fixed: 'right',
    },
  });

  function handleCreatePipeline() {
    openDrawer(true, { isUpdate: false });
  }

  function handleEditPipeline(record: any) {
    openDrawer(true, { isUpdate: true, record });
  }

  async function handleValidatePipeline(record: any) {
    if (!record?.pipelineScript) {
      createMessage.warning('该模版未配置 Groovy 脚本');
      return;
    }
    try {
      const res: any = await validateJenkinsPipeline({
        pipelineScript: record.pipelineScript,
      });
      if (res && res.valid) {
        Modal.success({
          title: 'Linter 语法检测通过',
          content: `流水线模版 [${record.name}] 脚本格式完全符合 Jenkins Groovy 规范。`,
        });
      } else {
        const errors = Array.isArray(res?.errors)
          ? res.errors.join('\n')
          : res?.errors || '语法检测错误';
        Modal.error({
          title: `流水线模版 [${record.name}] 语法校验未通过`,
          width: 580,
          content: `报错信息如下：\n\n${errors}`,
        });
      }
    } catch (err) {
      createMessage.error('语法检测接口连线失败');
    }
  }

  async function handleDeletePipeline(record: any) {
    try {
      await deleteJenkinsPipeline(record.id);
      createMessage.success(`流水线模版 [${record.name}] 删除成功！`);
      reload();
    } catch (err) {
      createMessage.error('删除失败');
    }
  }
</script>
