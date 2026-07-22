<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate">新增发布任务</a-button>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'ant-design:play-circle-outlined',
                color: 'success',
                tooltip: '执行发布 (Apply)',
                popConfirm: {
                  title: `确定要对集群 [${record.clusterName}] 执行发布任务 [${record.name}] 吗？`,
                  confirm: handleApplyTask.bind(null, record),
                },
              },
              {
                icon: 'ant-design:history-outlined',
                tooltip: '查看执行历史记录',
                onClick: handleViewLog.bind(null, record),
              },
              {
                icon: 'ant-design:download-outlined',
                tooltip: '下载渲染后的 YAML 文件',
                onClick: handleDownloadYaml.bind(null, record),
              },
              {
                icon: 'ant-design:edit-outlined',
                tooltip: '编辑任务',
                onClick: handleEdit.bind(null, record),
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                tooltip: '删除任务',
                popConfirm: {
                  title: '是否确认删除该任务？',
                  confirm: handleDelete.bind(null, record),
                },
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>

    <YamlTaskDrawer @register="registerDrawer" @success="handleSuccess" />
    <YamlTaskLogDrawer @register="registerLogDrawer" />
  </div>
</template>

<script lang="ts" setup>
  import { Button as AButton } from 'ant-design-vue';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import { getK8sYamlTaskList, deleteK8sYamlTask, applyK8sYamlTaskOne, getK8sYamlTemplateList } from '@/api/demo/system';
  import { useDrawer } from '@/components/Drawer';
  import { columns, searchFormSchema } from './yamlTask.data';
  import YamlTaskDrawer from './YamlTaskDrawer.vue';
  import YamlTaskLogDrawer from './YamlTaskLogDrawer.vue';
  import { useMessage } from '@/hooks/web/useMessage';

  const { createMessage } = useMessage();
  const [registerDrawer, { openDrawer }] = useDrawer();
  const [registerLogDrawer, { openDrawer: openLogDrawer }] = useDrawer();

  const [registerTable, { reload }] = useTable({
    title: 'K8s YAML 发布任务列表',
    api: getK8sYamlTaskList,
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
      width: 220,
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      fixed: 'right',
    },
  });

  function handleViewLog(record: Recordable) {
    openLogDrawer(true, {
      taskId: record.id,
      taskName: record.name,
    });
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

  async function handleDownloadYaml(record: Recordable) {
    try {
      createMessage.loading({ content: '正在生成 YAML 文件...', key: 'download_task_yaml' });
      const res = await getK8sYamlTemplateList({ page: 1, pageSize: 200 });
      const items = res?.items || res || [];
      const target = items.find((t: any) => t.id === record.TemplateId);
      let yamlContent = target ? target.content : '';

      if (!yamlContent) {
        createMessage.error({ content: '获取绑定的 YAML 模板内容失败', key: 'download_task_yaml' });
        return;
      }

      // 替换变量
      const vars: string[] = record.variables || [];
      vars.forEach((kv: string) => {
        const parts = kv.split('=');
        if (parts.length === 2) {
          yamlContent = yamlContent.replaceAll(parts[0], parts[1]);
        }
      });

      const filename = `${record.name || 'task'}.yaml`;
      const blob = new Blob([yamlContent], { type: 'text/yaml;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      createMessage.success({ content: `YAML 文件 ${filename} 已成功下载`, key: 'download_task_yaml' });
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '下载失败: ' + (e.message || e), key: 'download_task_yaml' });
    }
  }

  async function handleApplyTask(record: Recordable) {
    try {
      createMessage.loading({ content: `正在应用 YAML 任务 [${record.name}] 至集群 [${record.clusterName}]...`, key: 'apply_task' });
      await applyK8sYamlTaskOne(record.id);
      createMessage.success({ content: `任务 [${record.name}] 成功应用到集群 [${record.clusterName}]`, key: 'apply_task' });
      reload();
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: `应用任务失败: ${e.message || e}`, key: 'apply_task' });
    }
  }

  async function handleDelete(record: Recordable) {
    try {
      await deleteK8sYamlTask(record.id);
      createMessage.success('任务删除成功');
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
