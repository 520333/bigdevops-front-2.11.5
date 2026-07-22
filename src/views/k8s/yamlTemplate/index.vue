<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate">新增 YAML 模板</a-button>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'ant-design:code-outlined',
                tooltip: '查看 YAML 模版',
                onClick: handlePreviewYaml.bind(null, record),
              },
              {
                icon: 'ant-design:download-outlined',
                tooltip: '下载 YAML 模版文件',
                onClick: handleDownloadYaml.bind(null, record),
              },
              {
                icon: 'ant-design:edit-outlined',
                tooltip: '编辑模板',
                onClick: handleEdit.bind(null, record),
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                tooltip: '删除模板',
                popConfirm: {
                  title: '是否确认删除该模板？',
                  confirm: handleDelete.bind(null, record),
                },
              },
            ]"
          />
        </template>
      </template>

    </BasicTable>

    <YamlTemplateDrawer @register="registerDrawer" @success="handleSuccess" />

    <!-- 🚀 YAML 模版预览弹窗 -->
    <a-modal
      v-model:open="previewVisible"
      :title="`YAML 模板预览: ${previewTitle}`"
      width="60%"
    >
      <template #footer>
        <a-button type="primary" @click="handleDownloadFromPreview">
          下载该 YAML 文件
        </a-button>
      </template>
      <div class="p-2 border rounded bg-gray-900 overflow-hidden">
        <Codemirror
          v-model="previewContent"
          :style="{ height: '480px' }"
          :disabled="true"
          :extensions="extensions"
        />
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { Modal as AModal, Button as AButton } from 'ant-design-vue';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import { getK8sYamlTemplateList, deleteK8sYamlTemplate } from '@/api/demo/system';
  import { useDrawer } from '@/components/Drawer';
  import { columns, searchFormSchema } from './yamlTemplate.data';
  import YamlTemplateDrawer from './YamlTemplateDrawer.vue';
  import { useMessage } from '@/hooks/web/useMessage';
  import { Codemirror } from 'vue-codemirror';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { yaml } from '@codemirror/lang-yaml';

  const { createMessage } = useMessage();
  const [registerDrawer, { openDrawer }] = useDrawer();
  const extensions = [yaml(), oneDark];

  const previewVisible = ref(false);
  const previewTitle = ref('');
  const previewContent = ref('');

  const [registerTable, { reload }] = useTable({
    title: 'K8s YAML 模板列表',
    api: getK8sYamlTemplateList,
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
      width: 170,
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      fixed: 'right',
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

  function handlePreviewYaml(record: Recordable) {
    previewTitle.value = record.name;
    previewContent.value = record.content || '';
    previewVisible.value = true;
  }

  function handleDownloadYaml(record: Recordable) {
    downloadFile(record.name, record.content || '');
  }

  function handleDownloadFromPreview() {
    downloadFile(previewTitle.value, previewContent.value);
  }

  function downloadFile(name: string, content: string) {
    const filename = `${name || 'template'}.yaml`;
    const blob = new Blob([content], { type: 'text/yaml;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    createMessage.success(`YAML 文件 ${filename} 已开始下载`);
  }

  async function handleDelete(record: Recordable) {
    try {
      await deleteK8sYamlTemplate(record.id);
      createMessage.success('模板删除成功');
      reload();
    } catch (e: any) {
      console.error(e);
    }
  }

  function handleSuccess() {
    createMessage.success('操作成功');
    reload();
  }
</script>
