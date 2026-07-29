<template>
  <div>
    <BasicTable
      @register="registerTable"
      :rowSelection="{ type: 'checkbox', selectedRowKeys: checkedKeys, onChange: onSelectChange }"
    >
      <template #toolbar>
        <div class="flex items-center space-x-3 flex-wrap gap-y-2">
          <span class="font-semibold text-gray-700 dark:text-gray-300">目标集群:</span>
          <a-select
            id="svc-cluster-select"
            v-model:value="selectedCluster"
            style="width: 180px"
            placeholder="请选择 K8s 集群"
            :options="clusterOptions"
            show-search
            @change="handleClusterChange"
          />

          <span class="font-semibold text-gray-700 dark:text-gray-300">命名空间:</span>
          <a-select
            id="svc-namespace-select"
            v-model:value="selectedNamespace"
            style="width: 180px"
            placeholder="请选择 Namespace"
            :options="namespaceOptions"
            show-search
            @change="handleNamespaceChange"
          />

          <a-input-search
            id="svc-keyword-search"
            v-model:value="keyword"
            placeholder="搜索 Service 名称"
            style="width: 240px"
            enter-button
            @search="handleReload"
          />
          <a-button type="primary" @click="handleCreateSvc">
            新增 Service
          </a-button>

          <a-popconfirm
            title="确定要批量删除选中的 Service 吗？"
            ok-text="确认删除"
            cancel-text="取消"
            :disabled="checkedKeys.length === 0"
            @confirm="handleBatchDelete"
          >
            <a-button type="primary" danger :disabled="checkedKeys.length === 0">
              批量删除 {{ checkedKeys.length > 0 ? `(${checkedKeys.length})` : '' }}
            </a-button>
          </a-popconfirm>

          <a-button @click="handleReload">刷新</a-button>
        </div>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <div @click.stop>
            <TableAction
              :actions="[
                {
                  icon: 'ant-design:edit-outlined',
                  tooltip: '编辑 / 查看 Service YAML',
                  onClick: handleEditYaml.bind(null, record),
                },
                {
                  icon: 'ant-design:download-outlined',
                  tooltip: '下载 YAML 源码',
                  onClick: handleDownloadRowYaml.bind(null, record),
                },
                {
                  icon: 'ant-design:delete-outlined',
                  color: 'error',
                  tooltip: '删除 Service',
                  popConfirm: {
                    title: `确认删除 Service [${record.name}] 吗？`,
                    confirm: handleDeleteSvc.bind(null, record),
                  },
                },
              ]"
            />
          </div>
        </template>
      </template>
    </BasicTable>

    <!-- YAML 弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isCreate ? '新增 Service (YAML 声明)' : `编辑 Service: ${activeName}`"
      width="65%"
      :confirmLoading="modalLoading"
      @ok="handleSaveSvc"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="text-xs text-gray-500">
          {{ isCreate ? '请编写完整 Service YAML 声明，保存后将创建服务暴漏端口与端点。' : '修改 YAML 内容后点击确定，系统将在线更新 Service 规则。' }}
        </div>
        <a-button size="small" type="default" @click="downloadCurrentYaml">
          下载 YAML
        </a-button>
      </div>
      <div class="border rounded bg-gray-900 overflow-hidden">
        <Codemirror
          v-model="svcYamlContent"
          :style="{ height: '500px' }"
          :extensions="extensions"
        />
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, h } from 'vue';
  import {
    Select as ASelect,
    InputSearch as AInputSearch,
    Button as AButton,
    Modal as AModal,
    Popconfirm as APopconfirm,
    Tag,
  } from 'ant-design-vue';
  import { BasicTable, useTable, TableAction, BasicColumn } from '@/components/Table';
  import {
    getClusterForSelect,
    getK8sNamespaceList,
    getK8sServiceList,
    getK8sServiceYaml,
    createK8sService,
    updateK8sService,
    deleteK8sService,
    deleteK8sServiceBatch,
  } from '@/api/demo/system';
  import { useMessage } from '@/hooks/web/useMessage';
  import { Codemirror } from 'vue-codemirror';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { yaml } from '@codemirror/lang-yaml';

  const { createMessage } = useMessage();

  const selectedCluster = ref<string>('');
  const selectedNamespace = ref<string>('');
  const keyword = ref<string>('');
  const checkedKeys = ref<string[]>([]);
  const extensions = [yaml(), oneDark];

  const clusterOptions = ref<Array<{ label: string; value: string }>>([]);
  const namespaceOptions = ref<Array<{ label: string; value: string }>>([]);

  const modalVisible = ref(false);
  const modalLoading = ref(false);
  const isCreate = ref(false);
  const activeName = ref('');
  const activeNamespace = ref('');
  const svcYamlContent = ref('');

  const defaultSvcYaml = `apiVersion: v1
kind: Service
metadata:
  name: demo-nginx-svc
  namespace: default
spec:
  type: ClusterIP
  selector:
    app: demo-nginx
  ports:
  - name: http
    port: 80
    targetPort: 80
`;

  const columns: BasicColumn[] = [
    { title: 'Service 名称', dataIndex: 'name', width: 220, ellipsis: true },
    {
      title: '命名空间',
      dataIndex: 'namespace',
      width: 130,
      customRender: ({ record }) => h(Tag, { color: 'blue' }, () => record.namespace || '-'),
    },
    {
      title: '服务类型 (Type)',
      dataIndex: 'type',
      width: 140,
      customRender: ({ record }) => {
        const type = record.type || 'ClusterIP';
        const color = type === 'NodePort' ? 'volcano' : type === 'LoadBalancer' ? 'green' : 'cyan';
        return h(Tag, { color }, () => type);
      },
    },
    { title: 'Cluster IP', dataIndex: 'clusterIP', width: 150, customRender: ({ record }) => record.clusterIP || '-' },
    {
      title: '端口映射 (Ports)',
      dataIndex: 'ports',
      width: 220,
      customRender: ({ record }) => (record.ports || []).join(', ') || '-',
    },
    { title: '存活时间', dataIndex: 'age', width: 110, customRender: ({ record }) => record.age || '-' },
    { title: '创建时间', dataIndex: 'createdAt', width: 160, customRender: ({ record }) => record.createdAt || '-' },
  ];

  const [registerTable, { reload, getDataSource }] = useTable({
    title: 'Service 服务访问入口列表',
    api: async () => {
      if (!selectedCluster.value) return { items: [], total: 0 };
      try {
        const res = await getK8sServiceList({
          clusterName: selectedCluster.value,
          namespace: selectedNamespace.value,
          keyword: keyword.value,
        });
        const list = (res?.items || []).map((item: any) => ({
          ...item,
          key: `${item.namespace}/${item.name}`,
        }));
        return { items: list, total: res?.total || 0 };
      } catch (e: any) {
        console.error(e);
        createMessage.error('获取 Service 列表失败: ' + (e.message || e));
        return { items: [], total: 0 };
      }
    },
    columns,
    pagination: {
      showQuickJumper: false,
    },
    bordered: true,
    showIndexColumn: false,
    useSearchForm: false,
    showTableSetting: true,
    clickToRowSelect: true,
    actionColumn: { width: 150, title: '操作', dataIndex: 'action', key: 'action', fixed: 'right' },
  });

  function onSelectChange(keys: any[]) { checkedKeys.value = keys; }

  function triggerDownload(filename: string, content: string) {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.yaml') ? filename : `${filename}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCurrentYaml() {
    const filename = activeName.value ? `${activeName.value}.yaml` : 'service.yaml';
    triggerDownload(filename, svcYamlContent.value);
    createMessage.success(`YAML 文件 [${filename}] 下载中...`);
  }

  async function handleDownloadRowYaml(record: Recordable) {
    try {
      createMessage.loading({ content: `正在读取 Service [${record.name}] YAML...`, key: 'download_svc_yaml' });
      const yamlStr = await getK8sServiceYaml({ clusterName: selectedCluster.value, namespace: record.namespace, name: record.name });
      createMessage.destroy('download_svc_yaml');
      const content = typeof yamlStr === 'string' ? yamlStr : JSON.stringify(yamlStr, null, 2);
      triggerDownload(`${record.name}.yaml`, content);
      createMessage.success(`Service [${record.name}.yaml] 下载成功`);
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '获取 YAML 失败: ' + (e.message || e), key: 'download_svc_yaml' });
    }
  }

  onMounted(async () => {
    try {
      const res = await getClusterForSelect();
      const list = Array.isArray(res) ? res : res?.items || res?.result || [];
      clusterOptions.value = list.map((item: any) => ({
        label: typeof item === 'object' ? (item.label || item.value || item.nameZh || item.name) : item,
        value: typeof item === 'object' ? (item.value || item.name || item.label) : item,
      }));

      if (clusterOptions.value.length > 0) {
        selectedCluster.value = clusterOptions.value[0].value;
        await loadNamespaceList(selectedCluster.value);
        await reload();
      }
    } catch (e) {
      console.error(e);
    }
  });

  async function loadNamespaceList(clusterName: string) {
    try {
      const res = await getK8sNamespaceList({ clusterName });
      const nsList = Array.isArray(res) ? res : res?.items || res?.result || [];
      namespaceOptions.value = [{ label: '全部命名空间', value: '' }, ...nsList.map((ns: string) => ({ label: ns, value: ns }))];
      selectedNamespace.value = '';
    } catch (e) {
      console.error(e);
      namespaceOptions.value = [{ label: '全部命名空间', value: '' }];
      selectedNamespace.value = '';
    }
  }

  async function handleClusterChange(val: string) {
    selectedCluster.value = val;
    checkedKeys.value = [];
    await loadNamespaceList(val);
    await reload();
  }

  async function handleNamespaceChange(val: string) {
    selectedNamespace.value = val;
    checkedKeys.value = [];
    await reload();
  }

  async function handleReload() {
    checkedKeys.value = [];
    await reload();
  }

  function handleCreateSvc() {
    isCreate.value = true;
    activeName.value = '';
    svcYamlContent.value = defaultSvcYaml;
    modalVisible.value = true;
  }

  async function handleEditYaml(record: Recordable) {
    try {
      createMessage.loading({ content: `正在读取 Service [${record.name}] YAML...`, key: 'load_svc_yaml' });
      const yamlStr = await getK8sServiceYaml({ clusterName: selectedCluster.value, namespace: record.namespace, name: record.name });
      createMessage.destroy('load_svc_yaml');
      isCreate.value = false;
      activeName.value = record.name;
      activeNamespace.value = record.namespace;
      svcYamlContent.value = typeof yamlStr === 'string' ? yamlStr : JSON.stringify(yamlStr, null, 2);
      modalVisible.value = true;
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '获取 YAML 失败: ' + (e.message || e), key: 'load_svc_yaml' });
    }
  }

  async function handleSaveSvc() {
    if (!svcYamlContent.value.trim()) return createMessage.warning('YAML 内容不能为空');
    modalLoading.value = true;
    try {
      if (isCreate.value) {
        await createK8sService({ clusterName: selectedCluster.value, namespace: selectedNamespace.value, yamlContent: svcYamlContent.value });
        createMessage.success('Service 创建成功');
      } else {
        await updateK8sService({ clusterName: selectedCluster.value, namespace: activeNamespace.value, yamlContent: svcYamlContent.value });
        createMessage.success('Service 更新成功');
      }
      modalVisible.value = false;
      await reload();
    } catch (e: any) {
      console.error(e);
      createMessage.error('保存失败: ' + (e.message || e));
    } finally {
      modalLoading.value = false;
    }
  }

  async function handleDeleteSvc(record: Recordable) {
    try {
      createMessage.loading({ content: `正在删除 Service [${record.name}]...`, key: 'del_svc' });
      await deleteK8sService({ clusterName: selectedCluster.value, namespace: record.namespace, name: record.name });
      createMessage.success({ content: `Service [${record.name}] 删除成功`, key: 'del_svc' });
      await reload();
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '删除失败: ' + (e.message || e), key: 'del_svc' });
    }
  }

  async function handleBatchDelete() {
    if (checkedKeys.value.length === 0) return;
    try {
      const allRows = getDataSource();
      const items = checkedKeys.value
        .map((key) => {
          const row = allRows.find((item: any) => `${item.namespace}/${item.name}` === key);
          if (row) return { namespace: row.namespace, name: row.name };
          const parts = key.split('/');
          if (parts.length >= 2) return { namespace: parts[0], name: parts.slice(1).join('/') };
          return { namespace: selectedNamespace.value, name: key };
        })
        .filter((item) => item.name);

      createMessage.loading({ content: `正在批量删除 ${items.length} 个 Service...`, key: 'batch_del_svc' });
      await deleteK8sServiceBatch({ clusterName: selectedCluster.value, items });
      createMessage.success({ content: '批量删除操作完成', key: 'batch_del_svc' });
      checkedKeys.value = [];
      await reload();
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '批量删除失败: ' + (e.message || e), key: 'batch_del_svc' });
    }
  }
</script>
