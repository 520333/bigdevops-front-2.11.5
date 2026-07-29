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
            id="sts-cluster-select"
            v-model:value="selectedCluster"
            style="width: 180px"
            placeholder="请选择 K8s 集群"
            :options="clusterOptions"
            show-search
            @change="handleClusterChange"
          />

          <span class="font-semibold text-gray-700 dark:text-gray-300">命名空间:</span>
          <a-select
            id="sts-namespace-select"
            v-model:value="selectedNamespace"
            style="width: 180px"
            placeholder="请选择 Namespace"
            :options="namespaceOptions"
            show-search
            @change="handleNamespaceChange"
          />

          <a-input-search
            id="sts-keyword-search"
            v-model:value="keyword"
            placeholder="搜索 StatefulSet 名称 / 镜像"
            style="width: 240px"
            enter-button
            @search="handleReload"
          />
          <a-button type="primary" @click="handleCreateSts">
            新增 StatefulSet
          </a-button>

          <a-popconfirm
            title="确定要批量删除选中的 StatefulSet 吗？"
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
                  icon: 'ant-design:appstore-outlined',
                  tooltip: '查看所属 Pod 容器组',
                  onClick: handleGoPods.bind(null, record),
                },
                {
                  icon: 'ant-design:sliders-outlined',
                  tooltip: '扩缩容副本数量 (Scale)',
                  onClick: handleOpenScale.bind(null, record),
                },
                {
                  icon: 'ant-design:redo-outlined',
                  tooltip: '滚动重启 StatefulSet',
                  popConfirm: {
                    title: `确认重启 StatefulSet [${record.name}] 吗？`,
                    confirm: handleRolloutRestart.bind(null, record),
                  },
                },
                {
                  icon: 'ant-design:edit-outlined',
                  tooltip: '编辑 / 查看 StatefulSet YAML',
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
                  tooltip: '删除 StatefulSet',
                  popConfirm: {
                    title: `确认删除 StatefulSet [${record.name}] 吗？`,
                    confirm: handleDeleteSts.bind(null, record),
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
      :title="isCreate ? '新增 StatefulSet (YAML 声明)' : `编辑 StatefulSet: ${activeName}`"
      width="65%"
      :confirmLoading="modalLoading"
      @ok="handleSaveSts"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="text-xs text-gray-500">
          {{ isCreate ? '请编写完整 StatefulSet YAML 声明，保存后将自动提交至对应 K8s 集群。' : '修改 YAML 内容后点击确定，系统将在线更新该 StatefulSet 配置。' }}
        </div>
        <a-button size="small" type="default" @click="downloadCurrentYaml">
          下载 YAML
        </a-button>
      </div>
      <div class="border rounded bg-gray-900 overflow-hidden">
        <Codemirror
          v-model="stsYamlContent"
          :style="{ height: '500px' }"
          :extensions="extensions"
        />
      </div>
    </a-modal>

    <ScaleStatefulSetModal
      v-model:open="scaleModalVisible"
      :clusterName="selectedCluster"
      :namespace="activeNamespace"
      :stsName="activeName"
      :currentReplicas="activeReplicas"
      @success="handleReload"
    />
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
    Tooltip,
  } from 'ant-design-vue';
  import { BasicTable, useTable, TableAction, BasicColumn } from '@/components/Table';
  import {
    getClusterForSelect,
    getK8sNamespaceList,
    getK8sStatefulSetList,
    getK8sStatefulSetYaml,
    createK8sStatefulSet,
    updateK8sStatefulSet,
    restartK8sStatefulSet,
    deleteK8sStatefulSet,
    deleteK8sStatefulSetBatch,
  } from '@/api/demo/system';
  import { useMessage } from '@/hooks/web/useMessage';
  import { useGo } from '@/hooks/web/usePage';
  import { Codemirror } from 'vue-codemirror';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { yaml } from '@codemirror/lang-yaml';
  import ScaleStatefulSetModal from './ScaleStatefulSetModal.vue';

  const { createMessage } = useMessage();
  const go = useGo();

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
  const activeReplicas = ref(1);
  const stsYamlContent = ref('');
  const scaleModalVisible = ref(false);

  const defaultStsYaml = `apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: demo-redis-sts
  namespace: default
spec:
  serviceName: "redis"
  replicas: 3
  selector:
    matchLabels:
      app: demo-redis
  template:
    metadata:
      labels:
        app: demo-redis
    spec:
      containers:
      - name: redis
        image: redis:7.0-alpine
        ports:
        - containerPort: 6379
`;

  const columns: BasicColumn[] = [
    { title: 'StatefulSet 名称', dataIndex: 'name', width: 220, ellipsis: true },
    {
      title: '命名空间',
      dataIndex: 'namespace',
      width: 130,
      customRender: ({ record }) => h(Tag, { color: 'blue' }, () => record.namespace || '-'),
    },
    {
      title: '就绪副本',
      dataIndex: 'ready',
      width: 110,
      customRender: ({ record }) => {
        const isReady = record.readyReplicas === record.replicas && record.replicas > 0;
        const color = isReady ? 'green' : record.replicas === 0 ? 'default' : 'orange';
        return h(Tag, { color }, () => record.ready || '0/0');
      },
    },
    { title: '绑定 Service', dataIndex: 'serviceName', width: 140, customRender: ({ record }) => record.serviceName || '-' },
    {
      title: '容器镜像',
      dataIndex: 'images',
      width: 240,
      ellipsis: true,
      customRender: ({ record }) => {
        const images: string[] = record.images || [];
        if (images.length === 0) return '-';
        const tooltipVNode = h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
          images.map((img, idx) => h('div', { key: idx, style: { whiteSpace: 'nowrap' } }, img)),
        );
        return h(
          Tooltip,
          { overlayStyle: { maxWidth: 'none' }, overlayInnerStyle: { whiteSpace: 'nowrap' } },
          { title: () => tooltipVNode, default: () => h('span', { class: 'cursor-pointer hover:text-blue-500' }, images.join(', ')) },
        );
      },
    },
    { title: '存活时间', dataIndex: 'age', width: 110, customRender: ({ record }) => record.age || '-' },
    { title: '创建时间', dataIndex: 'createdAt', width: 160, customRender: ({ record }) => record.createdAt || '-' },
  ];

  const [registerTable, { reload, getDataSource }] = useTable({
    title: 'StatefulSet 控制器列表',
    api: async () => {
      if (!selectedCluster.value) return { items: [], total: 0 };
      try {
        const res = await getK8sStatefulSetList({
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
        createMessage.error('获取 StatefulSet 列表失败: ' + (e.message || e));
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
    actionColumn: { width: 210, title: '操作', dataIndex: 'action', key: 'action', fixed: 'right' },
  });

  function onSelectChange(keys: any[]) { checkedKeys.value = keys; }

  function handleGoPods(record: Recordable) {
    go({ path: '/k8s/pod', query: { cluster: selectedCluster.value, namespace: record.namespace, keyword: record.name } });
  }

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
    const filename = activeName.value ? `${activeName.value}.yaml` : 'statefulset.yaml';
    triggerDownload(filename, stsYamlContent.value);
    createMessage.success(`YAML 文件 [${filename}] 下载中...`);
  }

  async function handleDownloadRowYaml(record: Recordable) {
    try {
      createMessage.loading({ content: `正在读取 StatefulSet [${record.name}] YAML...`, key: 'download_sts_yaml' });
      const yamlStr = await getK8sStatefulSetYaml({ clusterName: selectedCluster.value, namespace: record.namespace, name: record.name });
      createMessage.destroy('download_sts_yaml');
      const content = typeof yamlStr === 'string' ? yamlStr : JSON.stringify(yamlStr, null, 2);
      triggerDownload(`${record.name}.yaml`, content);
      createMessage.success(`StatefulSet [${record.name}.yaml] 下载成功`);
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '获取 YAML 失败: ' + (e.message || e), key: 'download_sts_yaml' });
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

  function handleCreateSts() {
    isCreate.value = true;
    activeName.value = '';
    stsYamlContent.value = defaultStsYaml;
    modalVisible.value = true;
  }

  function handleOpenScale(record: Recordable) {
    activeName.value = record.name;
    activeNamespace.value = record.namespace;
    activeReplicas.value = record.replicas || 0;
    scaleModalVisible.value = true;
  }

  async function handleRolloutRestart(record: Recordable) {
    try {
      createMessage.loading({ content: `正在重启 StatefulSet [${record.name}]...`, key: 'restart_sts' });
      await restartK8sStatefulSet({ clusterName: selectedCluster.value, namespace: record.namespace, name: record.name });
      createMessage.success({ content: `StatefulSet [${record.name}] 重启成功`, key: 'restart_sts' });
      await reload();
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '重启失败: ' + (e.message || e), key: 'restart_sts' });
    }
  }

  async function handleEditYaml(record: Recordable) {
    try {
      createMessage.loading({ content: `正在读取 StatefulSet [${record.name}] YAML...`, key: 'load_sts_yaml' });
      const yamlStr = await getK8sStatefulSetYaml({ clusterName: selectedCluster.value, namespace: record.namespace, name: record.name });
      createMessage.destroy('load_sts_yaml');
      isCreate.value = false;
      activeName.value = record.name;
      activeNamespace.value = record.namespace;
      stsYamlContent.value = typeof yamlStr === 'string' ? yamlStr : JSON.stringify(yamlStr, null, 2);
      modalVisible.value = true;
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '获取 YAML 失败: ' + (e.message || e), key: 'load_sts_yaml' });
    }
  }

  async function handleSaveSts() {
    if (!stsYamlContent.value.trim()) return createMessage.warning('YAML 内容不能为空');
    modalLoading.value = true;
    try {
      if (isCreate.value) {
        await createK8sStatefulSet({ clusterName: selectedCluster.value, namespace: selectedNamespace.value, yamlContent: stsYamlContent.value });
        createMessage.success('StatefulSet 创建成功');
      } else {
        await updateK8sStatefulSet({ clusterName: selectedCluster.value, namespace: activeNamespace.value, yamlContent: stsYamlContent.value });
        createMessage.success('StatefulSet 更新成功');
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

  async function handleDeleteSts(record: Recordable) {
    try {
      createMessage.loading({ content: `正在删除 StatefulSet [${record.name}]...`, key: 'del_sts' });
      await deleteK8sStatefulSet({ clusterName: selectedCluster.value, namespace: record.namespace, name: record.name });
      createMessage.success({ content: `StatefulSet [${record.name}] 删除成功`, key: 'del_sts' });
      await reload();
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '删除失败: ' + (e.message || e), key: 'del_sts' });
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

      createMessage.loading({ content: `正在批量删除 ${items.length} 个 StatefulSet...`, key: 'batch_del_sts' });
      await deleteK8sStatefulSetBatch({ clusterName: selectedCluster.value, items });
      createMessage.success({ content: '批量删除操作完成', key: 'batch_del_sts' });
      checkedKeys.value = [];
      await reload();
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '批量删除失败: ' + (e.message || e), key: 'batch_del_sts' });
    }
  }
</script>
