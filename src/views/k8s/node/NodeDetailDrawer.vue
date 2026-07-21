<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" title="Node 节点详情" width="70%">
    <Description @register="registerDescription" class="mb-4" />

    <a-tabs v-model:activeKey="activeKey">
      <a-tab-pane key="pods" tab="运行 Pod 列表 (Pods)">
        <div class="p-2">
          <a-table
            :data-source="podList"
            :columns="podColumns"
            :loading="podLoading"
            size="small"
            bordered
            row-key="name"
            :pagination="pagination"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === 'Running' ? 'green' : record.status === 'Succeeded' ? 'blue' : 'red'">
                  {{ record.status }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'ready'">
                <a-tag color="processing">{{ record.ready }}</a-tag>
              </template>
              <template v-else-if="column.key === 'image'">
                <span :title="record.image" class="truncate block max-w-xs text-xs font-mono text-gray-700 dark:text-gray-300">
                  {{ record.image }}
                </span>
              </template>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <a-tab-pane key="conditions" tab="节点状况 (Conditions)">
        <div class="p-2">
          <a-table
            :data-source="nodeRecord.conditions || []"
            :columns="conditionColumns"
            :pagination="false"
            size="small"
            bordered
            row-key="type"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="getConditionColor(record)">
                  {{ record.status }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <a-tab-pane key="labels" tab="标签 (Labels)">
        <div class="p-2">
          <template v-if="nodeRecord.labelPairs && Object.keys(nodeRecord.labelPairs).length">
            <div v-for="(val, key) in nodeRecord.labelPairs" :key="key" class="mb-1 text-xs">
              <a-tag color="blue">{{ key }}</a-tag> = <a-tag color="cyan">{{ val || '<empty>' }}</a-tag>
            </div>
          </template>
          <a-empty v-else description="无标签数据" />
        </div>
      </a-tab-pane>

      <a-tab-pane key="annotations" tab="注解 (Annotations)">
        <div class="p-2">
          <template v-if="nodeRecord.annotation && Object.keys(nodeRecord.annotation).length">
            <div v-for="(val, key) in nodeRecord.annotation" :key="key" class="mb-1 text-xs break-all">
              <a-tag color="orange">{{ key }}</a-tag> = <span>{{ val }}</span>
            </div>
          </template>
          <a-empty v-else description="无注解数据" />
        </div>
      </a-tab-pane>

      <a-tab-pane key="taints" tab="污点 (Taints)">
        <div class="p-2">
          <template v-if="nodeRecord.taints && nodeRecord.taints.length">
            <div v-for="(taint, index) in nodeRecord.taints" :key="index" class="mb-1">
              <a-tag color="red">{{ taint.key }}</a-tag>={{ taint.value }} : <a-tag color="purple">{{ taint.effect }}</a-tag>
            </div>
          </template>
          <a-empty v-else description="无污点配置" />
        </div>
      </a-tab-pane>
    </a-tabs>
  </BasicDrawer>
</template>

<script lang="ts" setup>
  import { ref, reactive } from 'vue';
  import { Tag as ATag, Tabs as ATabs, TabPane as ATabPane, Empty as AEmpty, Table as ATable } from 'ant-design-vue';
  import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
  import { Description, useDescription } from '@/components/Description';
  import { getPodListByNodeName } from '@/api/demo/system';

  const nodeRecord = ref<Recordable>({});
  const activeKey = ref<string>('pods');
  const podList = ref<any[]>([]);
  const podLoading = ref<boolean>(false);

  // 🚀 响应式前端客户端分页配置
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (total: number) => `共 ${total} 条 Pod`,
    onChange: (page: number, size: number) => {
      pagination.current = page;
      pagination.pageSize = size;
    },
    onShowSizeChange: (current: number, size: number) => {
      pagination.current = 1;
      pagination.pageSize = size;
    },
  });

  const conditionColumns = [
    { title: '状况类型 (Type)', dataIndex: 'type', key: 'type', width: 160 },
    { title: '状态 (Status)', dataIndex: 'status', key: 'status', width: 100 },
    { title: '原因 (Reason)', dataIndex: 'reason', key: 'reason', width: 180 },
    { title: '消息 (Message)', dataIndex: 'message', key: 'message' },
  ];

  const podColumns = [
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 140, ellipsis: true },
    { title: 'Pod 名称', dataIndex: 'name', key: 'name', width: 240, ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', width: 95 },
    { title: 'Ready', dataIndex: 'ready', key: 'ready', width: 85 },
    { title: '重启数', dataIndex: 'restarts', key: 'restarts', width: 80 },
    { title: '镜像 (Image)', dataIndex: 'image', key: 'image', ellipsis: true },
    { title: '存活时间', dataIndex: 'age', key: 'age', width: 100 },
  ];

  function getConditionColor(record: Recordable) {
    if (record.type === 'Ready') {
      return record.status === 'True' ? 'green' : 'red';
    }
    return record.status === 'False' ? 'green' : 'red';
  }

  const [registerDescription, { setDescProps }] = useDescription({
    column: 2,
    schema: [
      { field: 'name', label: '节点名称' },
      { field: 'ip', label: '节点 IP' },
      { field: 'status', label: '节点状态' },
      { field: 'scheduleEnable', label: '允许调度', render: (val) => (val ? '是' : '否') },
      { field: 'podNum', label: 'Pod 数量' },
      { field: 'cpuUsageInfo', label: 'CPU 实时使用 (Usage)' },
      { field: 'memoryUsageInfo', label: '内存 实时使用 (Usage)' },
      { field: 'cpuRequestInfo', label: 'CPU Request (申请)' },
      { field: 'cpuLimitInfo', label: 'CPU Limit (上限)' },
      { field: 'memoryRequestInfo', label: '内存 Request (申请)' },
      { field: 'memoryLimitInfo', label: '内存 Limit (上限)' },
      { field: 'cpuCores', label: 'CPU 可用/总计' },
      { field: 'memGibs', label: '内存 可用/总计' },
      { field: 'ephemeralStorage', label: '临时存储 可用/总计' },
      { field: 'kubeletVersion', label: 'Kubelet 版本' },
      { field: 'criVersion', label: 'CRI 运行时' },
      { field: 'osVersion', label: '操作系统' },
      { field: 'kernelVersion', label: '内核版本' },
      { field: 'age', label: '存活时间' },
    ],
  });

  const [registerDrawer] = useDrawerInner(async (data) => {
    nodeRecord.value = data?.record || {};
    activeKey.value = data?.activeTab || 'pods';
    setDescProps({ data: nodeRecord.value });
    pagination.current = 1;

    // 拉取节点关联的 Pod 列表
    const cluster = data?.clusterName || '';
    const node = nodeRecord.value.name || '';
    if (cluster && node) {
      fetchPods(cluster, node);
    } else if (nodeRecord.value.pods) {
      podList.value = nodeRecord.value.pods;
      pagination.total = podList.value.length;
    }
  });

  async function fetchPods(cluster: string, node: string) {
    podLoading.value = true;
    try {
      const res = await getPodListByNodeName({ cluster, node });
      const items = Array.isArray(res) ? res : res?.items || [];
      podList.value = items;
      pagination.total = items.length;
      pagination.current = 1;
    } catch (e) {
      console.error('获取节点 Pod 列表失败:', e);
      podList.value = nodeRecord.value.pods || [];
      pagination.total = podList.value.length;
    } finally {
      podLoading.value = false;
    }
  }
</script>
