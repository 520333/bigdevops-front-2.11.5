<template>
  <div>
    <BasicTable
      @register="registerTable"
      :rowSelection="{ type: 'checkbox', selectedRowKeys: checkedKeys, onChange: onSelectChange }"
    >
      <template #toolbar>
        <div class="flex items-center space-x-3 flex-wrap gap-y-2">
          <Button type="primary" @click="handleCreateDeployment">
            新增 Deployment
          </Button>

          <!-- 🚀 批量删除按钮 -->
          <Popconfirm
            title="确定要批量删除选中的 Deployment 吗？"
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

          <!-- 🚀 kubectl get deploy -w 实时 Watch 状态提示 -->
          <Tag v-if="isWatching" color="success" class="flex items-center px-2 py-1">
            <template #icon>
              <span class="inline-block w-2 h-2 rounded-full bg-green-500 animate-ping mr-1"></span>
            </template>
            Watch 实时同步中 (kubectl -w)
          </Tag>
        </div>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <div @click.stop>
            <TableAction
              :actions="[
                {
                  icon: 'ant-design:appstore-outlined',
                  tooltip: '查看该 Deployment 所属 Pod 容器组',
                  onClick: handleGoPods.bind(null, record),
                },
                {
                  icon: 'ant-design:sliders-outlined',
                  tooltip: '扩缩容副本数量 (Scale)',
                  onClick: handleOpenScale.bind(null, record),
                },
                {
                  icon: 'ant-design:redo-outlined',
                  tooltip: '滚动重启 Deployment (Rollout Restart)',
                  popConfirm: {
                    title: `确认要对 Deployment [${record.name}] 进行滚动重启吗？`,
                    confirm: handleRolloutRestart.bind(null, record),
                  },
                },
                {
                  icon: 'ant-design:edit-outlined',
                  tooltip: '编辑 / 查看 Deployment YAML',
                  onClick: handleEditYaml.bind(null, record),
                },
                {
                  icon: 'ant-design:download-outlined',
                  tooltip: '下载 Deployment YAML 源码',
                  onClick: handleDownloadRowYaml.bind(null, record),
                },
                {
                  icon: 'ant-design:delete-outlined',
                  color: 'error',
                  tooltip: '删除 Deployment',
                  popConfirm: {
                    title: `确认删除 Deployment [${record.name}] 吗？`,
                    confirm: handleDeleteDeployment.bind(null, record),
                  },
                },
              ]"
            />
          </div>
        </template>
      </template>
    </BasicTable>

    <!-- 🚀 新增 / 编辑 Deployment YAML 弹窗 -->
    <BasicModal
      @register="registerYamlModal"
      :title="isCreate ? '新增 Deployment (YAML 声明)' : `编辑 Deployment: ${activeName}`"
      width="65%"
      @ok="handleSaveDeployment"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="text-xs text-gray-500">
          {{ isCreate ? '请编写完整 Deployment YAML 声明，保存后将自动提交至对应 K8s 集群进行应用部署。' : '修改 YAML 内容后点击确定，系统将在线滚动更新该 Deployment 配置。' }}
        </div>
        <Button size="small" type="default" @click="downloadCurrentYaml">
          下载 YAML
        </Button>
      </div>
      <div class="border rounded bg-gray-900 overflow-hidden">
        <Codemirror
          v-model="deploymentYamlContent"
          :style="{ height: '500px' }"
          :extensions="extensions"
        />
      </div>
    </BasicModal>

    <!-- 🚀 扩缩容 副本数 弹窗 -->
    <ScaleDeploymentModal
      v-model:open="scaleModalVisible"
      :clusterName="selectedCluster"
      :namespace="activeNamespace"
      :deploymentName="activeName"
      :currentReplicas="activeReplicas"
      @success="handleReload"
    />
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import {
    Button,
    Popconfirm,
    Tag,
  } from 'ant-design-vue';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import { BasicModal, useModal } from '@/components/Modal';
  import {
    getClusterForSelect,
    getK8sNamespaceList,
    getK8sDeploymentList,
    getK8sDeploymentYaml,
    createK8sDeployment,
    updateK8sDeployment,
    restartK8sDeployment,
    deleteK8sDeployment,
    deleteK8sDeploymentBatch,
  } from '@/api/demo/system';
  import { columns, searchFormSchema } from '../deployment/deployment.data';
  import { useMessage } from '@/hooks/web/useMessage';
  import { useGo } from '@/hooks/web/usePage';
  import { useGlobSetting } from '@/hooks/setting';
  import { getToken } from '@/utils/auth';
  import { Codemirror } from 'vue-codemirror';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { yaml } from '@codemirror/lang-yaml';
  import ScaleDeploymentModal from '../deployment/ScaleDeploymentModal.vue';

  const globSetting = useGlobSetting();
  const { createMessage } = useMessage();
  const go = useGo();

  const selectedCluster = ref<string>('');
  const selectedNamespace = ref<string>('');
  const keyword = ref<string>('');
  const checkedKeys = ref<string[]>([]);
  const extensions = [yaml(), oneDark];

  const clusterOptions = ref<Array<{ label: string; value: string }>>([]);
  const namespaceOptions = ref<Array<{ label: string; value: string }>>([]);

  const [registerYamlModal, { openModal: openYamlModal, setModalProps: setYamlModalProps, closeModal: closeYamlModal }] = useModal();
  const isCreate = ref(false);
  const activeName = ref('');
  const activeNamespace = ref('');
  const activeReplicas = ref(1);
  const deploymentYamlContent = ref('');

  const scaleModalVisible = ref(false);
  const isWatching = ref(false);
  let watchWs: WebSocket | null = null;

  const defaultDeploymentYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-nginx-deploy
  namespace: default
  labels:
    app: demo-nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: demo-nginx
  template:
    metadata:
      labels:
        app: demo-nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.25.3
        ports:
        - containerPort: 80
`;

  function handleGoPods(record: Recordable) {
    go({
      path: '/k8s/pod',
      query: {
        cluster: selectedCluster.value,
        namespace: record.namespace,
        keyword: record.name,
      },
    });
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
    const filename = activeName.value ? `${activeName.value}.yaml` : 'deployment.yaml';
    triggerDownload(filename, deploymentYamlContent.value);
    createMessage.success(`YAML 文件 [${filename}] 下载中...`);
  }

  async function handleDownloadRowYaml(record: Recordable) {
    try {
      createMessage.loading({ content: `正在读取 Deployment [${record.name}] YAML...`, key: 'download_deploy_yaml' });
      const yamlStr = await getK8sDeploymentYaml({
        clusterName: selectedCluster.value,
        namespace: record.namespace,
        name: record.name,
      });
      createMessage.destroy('download_deploy_yaml');
      const content = typeof yamlStr === 'string' ? yamlStr : JSON.stringify(yamlStr, null, 2);
      triggerDownload(`${record.name}.yaml`, content);
      createMessage.success(`Deployment [${record.name}.yaml] 下载成功`);
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '获取 YAML 失败: ' + (e.message || e), key: 'download_deploy_yaml' });
    }
  }

  const [registerTable, { reload, getDataSource, setTableData, getForm }] = useTable({
    title: 'K8s Deployment 控制器列表',
    api: async (params) => {
      selectedCluster.value = params.clusterName || selectedCluster.value;
      selectedNamespace.value = params.namespace || selectedNamespace.value;
      keyword.value = params.keyword || '';

      if (!selectedCluster.value) {
        return { items: [], total: 0 };
      }
      try {
        const res = await getK8sDeploymentList({
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
        createMessage.error('获取 Deployment 列表失败: ' + (e.message || e));
        return { items: [], total: 0 };
      }
    },
    columns,
    formConfig: {
      schemas: searchFormSchema,
      autoSubmitOnEnter: true,
    },
    pagination: {
      showQuickJumper: false,
    },
    bordered: true,
    showIndexColumn: false,
    useSearchForm: true,
    showTableSetting: true,
    clickToRowSelect: true,
    actionColumn: {
      width: 210,
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      fixed: 'right',
    },
  });

  function onSelectChange(keys: any[]) {
    checkedKeys.value = keys;
  }

  // 1. 初始化加载集群列表
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
        
        await getForm().updateSchema([
          {
            field: 'clusterName',
            componentProps: {
              options: clusterOptions.value,
              onChange: async (val: string) => {
                await loadNamespaceList(val);
                getForm().setFieldsValue({ namespace: '' });
                checkedKeys.value = [];
                await reload();
                initDeploymentWatch();
              },
            },
          },
        ]);
        
        await getForm().setFieldsValue({ clusterName: selectedCluster.value });
        await loadNamespaceList(selectedCluster.value);
        await reload();
        initDeploymentWatch();
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
      selectedNamespace.value = '';
      
      await getForm().updateSchema([
        {
          field: 'namespace',
          componentProps: {
            options: namespaceOptions.value,
            onChange: async (val: string) => {
              selectedNamespace.value = val;
              checkedKeys.value = [];
              await reload();
              initDeploymentWatch();
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

  // 3. 实时 Watch Deployment 变更流 (kubectl get deploy -w)
  function stopDeploymentWatch() {
    if (watchWs) {
      watchWs.onopen = null;
      watchWs.onmessage = null;
      watchWs.onerror = null;
      watchWs.onclose = null;
      if (watchWs.readyState === WebSocket.OPEN) {
        watchWs.close();
      } else if (watchWs.readyState === WebSocket.CONNECTING) {
        // We can't cleanly close a connecting socket without throwing a browser warning,
        // so we just let it connect and then close it in a delayed manner or drop reference.
        const ws = watchWs;
        ws.onopen = () => ws.close();
      }
      watchWs = null;
    }
    isWatching.value = false;
  }

  function initDeploymentWatch() {
    stopDeploymentWatch();
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
    const wsUrl = `${path}/api/k8s/wsK8sDeploymentWatch?clusterName=${encodeURIComponent(
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
        const deploy = msg.deployment;
        if (!deploy || !deploy.name) return;

        const currentData = getDataSource();
        const targetRow = currentData.find(
          (item: any) => item.name === deploy.name && item.namespace === deploy.namespace,
        );

        if (eventType === 'MODIFIED' || eventType === 'ADDED') {
          if (targetRow) {
            Object.assign(targetRow, deploy, { key: `${deploy.namespace}/${deploy.name}` });
          } else {
            if (!selectedNamespace.value || selectedNamespace.value === deploy.namespace) {
              if (keyword.value.trim()) {
                const kw = keyword.value.trim().toLowerCase();
                const matched =
                  deploy.name.toLowerCase().includes(kw) ||
                  (deploy.images && deploy.images.some((img: string) => img.toLowerCase().includes(kw)));
                if (!matched) return;
              }
              currentData.unshift({
                ...deploy,
                key: `${deploy.namespace}/${deploy.name}`,
              });
              setTableData([...currentData]);
            }
          }
        } else if (eventType === 'DELETED') {
          const idx = currentData.findIndex(
            (item: any) => item.name === deploy.name && item.namespace === deploy.namespace,
          );
          if (idx !== -1) {
            currentData.splice(idx, 1);
            setTableData([...currentData]);
          }
        }
      } catch (e) {
        console.error('Deployment Watch 消息解析异常:', e);
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
    initDeploymentWatch();
  }

  function handleCreateDeployment() {
    isCreate.value = true;
    activeName.value = '';
    deploymentYamlContent.value = defaultDeploymentYaml;
    openYamlModal(true);
  }

  function handleOpenScale(record: Recordable) {
    activeName.value = record.name;
    activeNamespace.value = record.namespace;
    activeReplicas.value = record.replicas || 0;
    scaleModalVisible.value = true;
  }

  async function handleRolloutRestart(record: Recordable) {
    try {
      createMessage.loading({ content: `正在滚动重启 Deployment [${record.name}]...`, key: 'restart_deploy' });
      await restartK8sDeployment({
        clusterName: selectedCluster.value,
        namespace: record.namespace,
        name: record.name,
      });
      createMessage.success({ content: `Deployment [${record.name}] 滚动重启指令已下发`, key: 'restart_deploy' });
      await reload();
      initDeploymentWatch();
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '滚动重启失败: ' + (e.message || e), key: 'restart_deploy' });
    }
  }

  async function handleEditYaml(record: Recordable) {
    try {
      createMessage.loading({ content: `正在读取 Deployment [${record.name}] YAML...`, key: 'load_deploy_yaml' });
      const yamlStr = await getK8sDeploymentYaml({
        clusterName: selectedCluster.value,
        namespace: record.namespace,
        name: record.name,
      });
      createMessage.destroy('load_deploy_yaml');
      isCreate.value = false;
      activeName.value = record.name;
      activeNamespace.value = record.namespace;
      deploymentYamlContent.value = typeof yamlStr === 'string' ? yamlStr : JSON.stringify(yamlStr, null, 2);
      openYamlModal(true);
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '获取 Deployment YAML 失败: ' + (e.message || e), key: 'load_deploy_yaml' });
    }
  }

  async function handleSaveDeployment() {
    if (!deploymentYamlContent.value.trim()) {
      createMessage.warning('Deployment YAML 内容不能为空');
      return;
    }
    try {
      if (isCreate.value) {
        setYamlModalProps({ confirmLoading: true });
        await createK8sDeployment({
          clusterName: selectedCluster.value,
          namespace: selectedNamespace.value,
          yamlContent: deploymentYamlContent.value,
        });
        createMessage.success('Deployment 创建成功');
      } else {
        setYamlModalProps({ confirmLoading: true });
        await updateK8sDeployment({
          clusterName: selectedCluster.value,
          namespace: activeNamespace.value,
          yamlContent: deploymentYamlContent.value,
        });
        createMessage.success('Deployment 更新成功');
      }
      closeYamlModal();
      await reload();
      initDeploymentWatch();
    } catch (e: any) {
      console.error(e);
      createMessage.error('保存失败: ' + (e.message || e));
    } finally {
      setYamlModalProps({ confirmLoading: false });
    }
  }

  async function handleDeleteDeployment(record: Recordable) {
    try {
      createMessage.loading({ content: `正在删除 Deployment [${record.name}]...`, key: 'del_deploy' });
      await deleteK8sDeployment({
        clusterName: selectedCluster.value,
        namespace: record.namespace,
        name: record.name,
      });
      createMessage.success({ content: `Deployment [${record.name}] 删除成功`, key: 'del_deploy' });
      await reload();
      initDeploymentWatch();
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '删除失败: ' + (e.message || e), key: 'del_deploy' });
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

      createMessage.loading({
        content: `正在批量删除 ${items.length} 个 Deployment...`,
        key: 'batch_del_deploy',
      });
      await deleteK8sDeploymentBatch({
        clusterName: selectedCluster.value,
        items,
      });
      createMessage.success({ content: '批量删除操作完成', key: 'batch_del_deploy' });
      checkedKeys.value = [];
      await reload();
      initDeploymentWatch();
    } catch (e: any) {
      console.error(e);
      createMessage.error({ content: '批量删除失败: ' + (e.message || e), key: 'batch_del_deploy' });
    }
  }

  onUnmounted(() => {
    stopDeploymentWatch();
  });
</script>
