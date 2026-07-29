<template>
  <div class="p-4">
    <BasicTable
      @register="registerTable"
      :rowSelection="{ type: 'checkbox', selectedRowKeys: checkedKeys, onChange: onSelectChange }"
    >
      <template #toolbar>
        <div class="flex items-center space-x-3 flex-wrap gap-y-2">
          <Button type="primary" @click="handleCreatePod">
            新增 Pod
          </Button>

          <!-- 🚀 批量删除按钮 -->
          <Popconfirm
            title="确定要批量删除选中的 Pod 吗？"
            ok-text="确认删除"
            cancel-text="取消"
            :disabled="checkedKeys.length === 0"
            @confirm="handleBatchDelete"
          >
            <Button type="primary" danger :disabled="checkedKeys.length === 0">
              批量删除 {{ checkedKeys.length > 0 ? `(${checkedKeys.length})` : '' }}
            </Button>
          </Popconfirm>

          <Button @click="handleReload">刷新</Button>

          <!-- 🚀 kubectl -w 实时 Watch 状态提示 -->
          <Tag v-if="isWatching" color="success" class="flex items-center px-2 py-1">
            <template #icon>
              <span class="inline-block w-2 h-2 rounded-full bg-green-500 animate-ping mr-1"></span>
            </template>
            Watch 实时同步中 (kubectl -w)
          </Tag>
        </div>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'nodeName'">
          <a
            v-if="record.nodeName"
            class="text-blue-500 hover:underline font-medium cursor-pointer"
            @click.stop="handleGoNode(record.nodeName)"
          >
            {{ record.nodeName }} {{ record.hostIP ? `(${record.hostIP})` : '' }}
          </a>
          <span v-else>-</span>
        </template>

        <template v-if="column.key === 'action'">
          <div @click.stop>
            <TableAction
              :actions="[
                {
                  icon: 'ant-design:file-text-outlined',
                  tooltip: '查看 Pod 日志',
                  onClick: handleOpenLogs.bind(null, record),
                },
                {
                  icon: 'ant-design:code-outlined',
                  tooltip: '在线 Exec 终端 Shell',
                  onClick: handleOpenExec.bind(null, record),
                },
                {
                  icon: 'ant-design:edit-outlined',
                  tooltip: '编辑 / 查看 Pod YAML',
                  onClick: handleEditYaml.bind(null, record),
                },
                {
                  icon: 'ant-design:folder-open-outlined',
                  tooltip: '容器文件浏览器 (上传/下载/预览/删除)',
                  onClick: handleOpenDownloadFile.bind(null, record),
                },
                {
                  icon: 'ant-design:download-outlined',
                  tooltip: '下载 Pod YAML 源码',
                  onClick: handleDownloadRowYaml.bind(null, record),
                },
                {
                  icon: 'ant-design:delete-outlined',
                  color: 'error',
                  tooltip: '删除 Pod',
                  popConfirm: {
                    title: `确认删除 Pod [${record.name}] 吗？`,
                    confirm: handleDeletePod.bind(null, record),
                  },
                },
              ]"
            />
          </div>
        </template>
      </template>
    </BasicTable>

    <!-- 🚀 新增 / 编辑 Pod YAML 弹窗 -->
    <BasicModal
      @register="registerYamlModal"
      :title="isCreate ? '新增 Pod (YAML 声明)' : `编辑 Pod: ${activePodName}`"
      width="60%"
      @ok="handleSavePod"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="text-xs text-gray-500">
          {{ isCreate ? '请编写完整 Pod YAML 声明，保存后将自动提交至对应 K8s 集群并启动应用。' : '修改 YAML 内容后点击确定，系统将更新应用该 Pod 的声明规则。' }}
        </div>
        <Button size="small" type="default" @click="downloadCurrentYaml">
          下载 YAML
        </Button>
      </div>
      <div class="border rounded bg-gray-900 overflow-hidden">
        <Codemirror
          v-model="podYamlContent"
          :style="{ height: '480px' }"
          :extensions="extensions"
        />
      </div>
    </BasicModal>

    <!-- 🚀 Pod 实时日志查看弹窗 -->
    <PodLogsModal
      v-model:open="logsModalVisible"
      :clusterName="selectedCluster"
      :namespace="activePodNamespace"
      :podName="activePodName"
      :containers="activePodContainers"
    />

    <!-- 🚀 Pod Exec 终端 Shell 弹窗 -->
    <PodExecModal
      v-model:open="execModalVisible"
      :clusterName="selectedCluster"
      :namespace="activePodNamespace"
      :podName="activePodName"
      :containers="activePodContainers"
    />

    <!-- 🚀 Pod 容器文件浏览器弹窗 (Kuboard 风格) -->
    <PodFileManagerModal
      v-model:open="fileDownloadModalVisible"
      :clusterName="selectedCluster"
      :namespace="activePodNamespace"
      :podName="activePodName"
      :containers="activePodContainers"
    />
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, onUnmounted, nextTick } from 'vue';
  import { useRoute } from 'vue-router';
  import {
    Select,
    InputSearch,
    Button,
    Popconfirm,
    Tag,
  } from 'ant-design-vue';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import { BasicModal, useModal } from '@/components/Modal';
  import {
    getClusterForSelect,
    getK8sNamespaceList,
    getK8sPodList,
    getK8sPodYaml,
    createK8sPod,
    updateK8sPod,
    deleteK8sPod,
    deleteK8sPodBatch,
  } from '@/api/demo/system';
  import { columns, searchFormSchema } from './pod.data';
  import { useMessage } from '@/hooks/web/useMessage';
  import { useGo } from '@/hooks/web/usePage';
  import { useGlobSetting } from '@/hooks/setting';
  import { getToken } from '@/utils/auth';
  import { Codemirror } from 'vue-codemirror';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { yaml } from '@codemirror/lang-yaml';
  import PodLogsModal from './PodLogsModal.vue';
  import PodExecModal from './PodExecModal.vue';
  import PodFileManagerModal from './PodFileManagerModal.vue';

  const route = useRoute();
  const globSetting = useGlobSetting();
  const { createMessage } = useMessage();
  const go = useGo();

  const selectedCluster = ref<string>('');
  const selectedNamespace = ref<string>('');
  const keyword = ref<string>('');
  const checkedKeys = ref<string[]>([]);
  const extensions = [yaml(), oneDark];

  function handleGoNode(nodeName: string) {
    go({
      path: '/k8s/node',
      query: { cluster: selectedCluster.value, keyword: nodeName },
    });
  }

  const clusterOptions = ref<Array<{ label: string; value: string }>>([]);
  const namespaceOptions = ref<Array<{ label: string; value: string }>>([]);

  const [registerYamlModal, { openModal: openYamlModal, setModalProps: setYamlModalProps, closeModal: closeYamlModal }] = useModal();
  const isCreate = ref(false);
  const activePodName = ref('');
  const activePodNamespace = ref('');
  const activePodContainers = ref<string[]>([]);
  const podYamlContent = ref('');

  const logsModalVisible = ref(false);
  const execModalVisible = ref(false);
  const fileDownloadModalVisible = ref(false);
  const isWatching = ref(false);
  let watchWs: WebSocket | null = null;

  const defaultPodYaml = `apiVersion: v1
kind: Pod
metadata:
  name: demo-nginx-pod
  namespace: default
  labels:
    app: demo-nginx
spec:
  containers:
  - name: nginx
    image: nginx:latest
    ports:
    - containerPort: 80
`;

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
    const filename = activePodName.value ? `${activePodName.value}.yaml` : 'pod.yaml';
    triggerDownload(filename, podYamlContent.value);
    createMessage.success(`YAML 文件 [${filename}] 下载中...`);
  }

  async function handleDownloadRowYaml(record: Recordable) {
    try {
      createMessage.loading({ content: `正在读取 Pod [${record.name}] YAML...`, key: 'download_pod_yaml' });
      const yamlStr = await getK8sPodYaml({
        clusterName: selectedCluster.value,
        namespace: record.namespace,
        name: record.name,
      });
      createMessage.destroy('download_pod_yaml');
      const content = typeof yamlStr === 'string' ? yamlStr : JSON.stringify(yamlStr, null, 2);
      triggerDownload(`${record.name}.yaml`, content);
      createMessage.success(`Pod [${record.name}.yaml] 下载成功`);
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '获取 YAML 失败: ' + (e.message || e), key: 'download_pod_yaml' });
    }
  }

  const [registerTable, { reload, getDataSource, setTableData, getForm }] = useTable({
    title: 'K8s Pod 列表管理',
    api: async (params) => {
      selectedCluster.value = params.clusterName || selectedCluster.value;
      selectedNamespace.value = params.namespace || selectedNamespace.value;
      keyword.value = params.keyword || '';

      if (!selectedCluster.value) {
        return { items: [], total: 0 };
      }
      try {
        const res = await getK8sPodList({
          clusterName: selectedCluster.value,
          namespace: selectedNamespace.value,
          keyword: keyword.value,
        });
        const list = (res?.items || []).map((item: any) => ({
          ...item,
          key: `${item.namespace}/${item.name}`,
        }));
        return {
          items: list,
          total: res?.total || 0,
        };
      } catch (e: any) {
        console.error(e);
        createMessage.error('获取 Pod 列表失败: ' + (e.message || e));
        return { items: [], total: 0 };
      }
    },
    pagination: {
      showQuickJumper: false,
    },
    immediate: false,
    columns,
    formConfig: {
      schemas: searchFormSchema,
      autoSubmitOnEnter: true,
    },
    bordered: true,
    showIndexColumn: false,
    useSearchForm: true,
    showTableSetting: true,
    clickToRowSelect: true,
    actionColumn: {
      width: 250,
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      fixed: 'right',
    },
  });

  function onSelectChange(keys: any[]) {
    checkedKeys.value = keys;
  }

  // 1. 初始化加载集群列表与路由 Query 参数处理
  onMounted(async () => {
    try {
      const res = await getClusterForSelect();
      const list = Array.isArray(res) ? res : res?.items || res?.result || [];
      clusterOptions.value = list.map((item: any) => ({
        label: typeof item === 'object' ? (item.label || item.value || item.nameZh || item.name) : item,
        value: typeof item === 'object' ? (item.value || item.name || item.label) : item,
      }));

      if (clusterOptions.value.length > 0) {
        selectedCluster.value = route.query.cluster ? String(route.query.cluster) : clusterOptions.value[0].value;
        if (route.query.namespace !== undefined) {
          selectedNamespace.value = String(route.query.namespace);
        }
        if (route.query.keyword) {
          keyword.value = String(route.query.keyword);
        }

        await getForm().updateSchema([
          {
            field: 'clusterName',
            componentProps: {
              options: clusterOptions.value,
              onChange: async (val: string) => {
                selectedCluster.value = val;
                selectedNamespace.value = '';
                checkedKeys.value = [];
                await loadNamespaceList(val);
                getForm().setFieldsValue({ namespace: '' });
                await reload();
                initPodWatch();
              },
            },
          },
        ]);

        await loadNamespaceList(selectedCluster.value);
        await getForm().setFieldsValue({
          clusterName: selectedCluster.value,
          namespace: selectedNamespace.value,
          keyword: keyword.value,
        });

        reload();
        initPodWatch();
      }
    } catch (e) {
      console.error(e);
    }
  });

  // 2. 加载指定集群的 Namespace 列表
  async function loadNamespaceList(clusterName: string) {
    try {
      const res = await getK8sNamespaceList({ clusterName });
      const nsList = Array.isArray(res) ? res : res?.items || res?.result || [];
      namespaceOptions.value = [
        { label: '全部命名空间', value: '' },
        ...nsList.map((ns: string) => ({ label: ns, value: ns })),
      ];
      if (route.query.namespace === undefined) {
        selectedNamespace.value = '';
      }
      
      await getForm().updateSchema([
        {
          field: 'namespace',
          componentProps: {
            options: namespaceOptions.value,
            onChange: async (val: string) => {
              selectedNamespace.value = val;
              checkedKeys.value = [];
              await reload();
              initPodWatch();
            },
          },
        },
      ]);
    } catch (e) {
      console.error(e);
      namespaceOptions.value = [{ label: '全部命名空间', value: '' }];
      selectedNamespace.value = '';
      await getForm().updateSchema([{ field: 'namespace', componentProps: { options: namespaceOptions.value } }]);
    }
  }

  // 3. 类似于 kubectl get pod -w 的 WebSocket 实时 Watch 功能
  function stopPodWatch() {
    if (watchWs) {
      watchWs.onopen = null;
      watchWs.onmessage = null;
      watchWs.onerror = null;
      watchWs.onclose = null;
      if (watchWs.readyState === WebSocket.OPEN) {
        watchWs.close();
      } else if (watchWs.readyState === WebSocket.CONNECTING) {
        const ws = watchWs;
        ws.onopen = () => ws.close();
      }
      watchWs = null;
    }
    isWatching.value = false;
  }

  function initPodWatch() {
    stopPodWatch();
    if (!selectedCluster.value) return;

    const apiUrl = globSetting.apiUrl || '';
    let wsHost = '';
    if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
      wsHost = apiUrl.replace(/^http/, 'ws');
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsHost = `${protocol}//${window.location.host}${apiUrl.startsWith('/') ? '' : '/'}${apiUrl}`;
    }

    const token = getToken() || '';
    const path = wsHost.endsWith('/') ? wsHost.slice(0, -1) : wsHost;
    const wsUrl = `${path}/api/k8s/wsK8sPodWatch?clusterName=${encodeURIComponent(
      selectedCluster.value,
    )}&namespace=${encodeURIComponent(selectedNamespace.value)}&token=${encodeURIComponent(token)}`;

    watchWs = new WebSocket(wsUrl);

    watchWs.onopen = () => {
      isWatching.value = true;
    };

    watchWs.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const eventType = msg.type; // "ADDED" | "MODIFIED" | "DELETED"
        const pod = msg.pod;
        if (!pod || !pod.name) return;

        const currentData = getDataSource();
        const targetRow = currentData.find((item: any) => item.name === pod.name && item.namespace === pod.namespace);

        if (eventType === 'MODIFIED' || eventType === 'ADDED') {
          if (targetRow) {
            Object.assign(targetRow, pod, { key: `${pod.namespace}/${pod.name}` });
          } else {
            if (!selectedNamespace.value || selectedNamespace.value === pod.namespace) {
              if (keyword.value.trim()) {
                const kw = keyword.value.trim().toLowerCase();
                const matched =
                  pod.name.toLowerCase().includes(kw) ||
                  (pod.podIP && pod.podIP.includes(kw)) ||
                  (pod.nodeName && pod.nodeName.toLowerCase().includes(kw));
                if (!matched) return;
              }
              currentData.unshift({
                ...pod,
                key: `${pod.namespace}/${pod.name}`,
              });
              setTableData([...currentData]);
            }
          }
        } else if (eventType === 'DELETED') {
          const idx = currentData.findIndex((item: any) => item.name === pod.name && item.namespace === pod.namespace);
          if (idx !== -1) {
            currentData.splice(idx, 1);
            setTableData([...currentData]);
          }
        }
      } catch (e) {
        console.error('Pod Watch 消息解析异常:', e);
      }
    };

    watchWs.onclose = () => {
      isWatching.value = false;
    };

    watchWs.onerror = () => {
      isWatching.value = false;
    };
  }

  async function handleReload() {
    checkedKeys.value = [];
    await reload();
    initPodWatch();
  }

  function handleCreatePod() {
    isCreate.value = true;
    activePodName.value = '';
    podYamlContent.value = defaultPodYaml;
    openYamlModal(true);
  }

  function handleOpenLogs(record: Recordable) {
    activePodName.value = record.name;
    activePodNamespace.value = record.namespace;
    activePodContainers.value = record.containers || [];
    logsModalVisible.value = true;
  }

  function handleOpenExec(record: Recordable) {
    activePodName.value = record.name;
    activePodNamespace.value = record.namespace;
    activePodContainers.value = record.containers || [];
    execModalVisible.value = true;
  }

  function handleOpenDownloadFile(record: Recordable) {
    activePodName.value = record.name;
    activePodNamespace.value = record.namespace;
    activePodContainers.value = record.containers || [];
    fileDownloadModalVisible.value = true;
  }

  async function handleEditYaml(record: Recordable) {
    try {
      createMessage.loading({ content: `正在读取 Pod [${record.name}] YAML...`, key: 'load_pod_yaml' });
      const yamlStr = await getK8sPodYaml({
        clusterName: selectedCluster.value,
        namespace: record.namespace,
        name: record.name,
      });
      createMessage.destroy('load_pod_yaml');
      isCreate.value = false;
      activePodName.value = record.name;
      activePodNamespace.value = record.namespace;
      podYamlContent.value = typeof yamlStr === 'string' ? yamlStr : JSON.stringify(yamlStr, null, 2);
      openYamlModal(true);
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '获取 Pod YAML 失败: ' + (e.message || e), key: 'load_pod_yaml' });
    }
  }

  async function handleSavePod() {
    if (!podYamlContent.value.trim()) {
      createMessage.warning('Pod YAML 内容不能为空');
      return;
    }
    try {
      if (isCreate.value) {
        setYamlModalProps({ confirmLoading: true });
        await createK8sPod({
          clusterName: selectedCluster.value,
          namespace: selectedNamespace.value,
          yamlContent: podYamlContent.value,
        });
        createMessage.success('Pod 创建成功');
      } else {
        setYamlModalProps({ confirmLoading: true });
        await updateK8sPod({
          clusterName: selectedCluster.value,
          namespace: activePodNamespace.value,
          yamlContent: podYamlContent.value,
        });
        createMessage.success('Pod 更新成功');
      }
      closeYamlModal();
      await reload();
      initPodWatch();
    } catch (e: any) {
      console.error(e);
      createMessage.error('保存失败: ' + (e.message || e));
    } finally {
      setYamlModalProps({ confirmLoading: false });
    }
  }

  async function handleDeletePod(record: Recordable) {
    try {
      createMessage.loading({ content: `正在删除 Pod [${record.name}]...`, key: 'del_pod' });
      await deleteK8sPod({
        clusterName: selectedCluster.value,
        namespace: record.namespace,
        name: record.name,
      });
      createMessage.success({ content: `Pod [${record.name}] 删除提交成功`, key: 'del_pod' });
      await reload();
      initPodWatch();
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '删除失败: ' + (e.message || e), key: 'del_pod' });
    }
  }

  async function handleBatchDelete() {
    if (checkedKeys.value.length === 0) return;
    try {
      const allRows = getDataSource();
      const items = checkedKeys.value
        .map((key) => {
          const row = allRows.find((item: any) => `${item.namespace}/${item.name}` === key);
          if (row) {
            return { namespace: row.namespace, name: row.name };
          }
          const parts = key.split('/');
          if (parts.length >= 2) {
            return { namespace: parts[0], name: parts.slice(1).join('/') };
          }
          return { namespace: selectedNamespace.value, name: key };
        })
        .filter((item) => item.name);

      createMessage.loading({ content: `正在批量删除 ${items.length} 个 Pod...`, key: 'batch_del_pod' });
      await deleteK8sPodBatch({
        clusterName: selectedCluster.value,
        items,
      });
      createMessage.success({ content: '批量删除操作完成', key: 'batch_del_pod' });
      checkedKeys.value = [];
      await reload();
      initPodWatch();
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '批量删除失败: ' + (e.message || e), key: 'batch_del_pod' });
    }
  }

  onUnmounted(() => {
    stopPodWatch();
  });
</script>
