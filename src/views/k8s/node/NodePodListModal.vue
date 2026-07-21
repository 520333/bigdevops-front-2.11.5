<template>
  <BasicModal
    v-bind="$attrs"
    @register="registerModal"
    :title="`节点运行 Pod 详情 - [ ${nodeName} ]`"
    width="88%"
    :canFullscreen="true"
    :minHeight="540"
    :showOkBtn="false"
    cancelText="关闭"
  >
    <div class="p-2">
      <!-- 头部节点提示信息 -->
      <div class="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs shadow-sm">
        <div class="flex items-center space-x-3">
          <div>
            <span class="font-bold mr-1 text-gray-700 dark:text-gray-300">所属集群:</span>
            <a-tag color="blue" class="font-semibold">{{ clusterName }}</a-tag>
          </div>
          <div>
            <span class="font-bold mr-1 text-gray-700 dark:text-gray-300">节点名称:</span>
            <a-tag color="purple" class="font-semibold">{{ nodeName }}</a-tag>
          </div>
        </div>
        <div>
          <span class="font-bold mr-2 text-gray-700 dark:text-gray-300">运行 Pod 总数:</span>
          <a-tag color="processing" class="font-bold text-sm px-2">{{ podList.length }} 个</a-tag>
        </div>
      </div>

      <!-- Pod 完整表格 -->
      <a-table
        :data-source="podList"
        :columns="podColumns"
        :loading="loading"
        size="small"
        bordered
        row-key="name"
        :scroll="{ x: 'max-content' }"
        :pagination="pagination"
      >
        <template #bodyCell="{ column, record }">
          <!-- 状态 -->
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'Running' ? 'green' : record.status === 'Succeeded' ? 'blue' : 'red'" class="font-semibold">
              {{ record.status }}
            </a-tag>
          </template>

          <!-- Ready -->
          <template v-else-if="column.key === 'ready'">
            <a-tag color="processing">{{ record.ready }}</a-tag>
          </template>

          <!-- 镜像 (Image) -->
          <template v-else-if="column.key === 'image'">
            <span :title="record.image" class="truncate block max-w-sm text-xs font-mono text-gray-700 dark:text-gray-300">
              {{ record.image }}
            </span>
          </template>

          <!-- CPU 申请/上限 -->
          <template v-else-if="column.key === 'cpuRequestInfo'">
            <span class="font-mono text-xs text-blue-600 dark:text-blue-400 font-medium">
              {{ record.cpuRequestInfo || '0 / 0' }}
            </span>
          </template>

          <!-- 内存 申请/上限 -->
          <template v-else-if="column.key === 'memRequestInfo'">
            <span class="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {{ record.memRequestInfo || '0 / 0' }}
            </span>
          </template>
        </template>
      </a-table>
    </div>
  </BasicModal>
</template>

<script lang="ts" setup>
  import { ref, reactive } from 'vue';
  import { Tag as ATag, Table as ATable } from 'ant-design-vue';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { getPodListByNodeName } from '@/api/demo/system';

  const clusterName = ref<string>('');
  const nodeName = ref<string>('');
  const podList = ref<any[]>([]);
  const loading = ref<boolean>(false);

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

  const podColumns = [
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 150, ellipsis: true },
    { title: 'Pod 名称', dataIndex: 'name', key: 'name', width: 280, ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', width: 95 },
    { title: 'Ready', dataIndex: 'ready', key: 'ready', width: 85 },
    { title: '重启数', dataIndex: 'restarts', key: 'restarts', width: 80 },
    { title: '镜像 (Image)', dataIndex: 'image', key: 'image', width: 320, ellipsis: true },
    { title: 'CPU 申请 / 上限 (Req / Limit)', dataIndex: 'cpuRequestInfo', key: 'cpuRequestInfo', width: 200 },
    { title: '内存 申请 / 上限 (Req / Limit)', dataIndex: 'memRequestInfo', key: 'memRequestInfo', width: 220 },
    { title: '存活时间', dataIndex: 'age', key: 'age', width: 100 },
  ];

  const [registerModal] = useModalInner(async (data) => {
    clusterName.value = data?.clusterName || '';
    nodeName.value = data?.nodeName || '';
    podList.value = [];
    pagination.current = 1;

    if (clusterName.value && nodeName.value) {
      fetchPods(clusterName.value, nodeName.value);
    }
  });

  async function fetchPods(cluster: string, node: string) {
    loading.value = true;
    try {
      const res = await getPodListByNodeName({ cluster, node });
      const items = Array.isArray(res) ? res : res?.items || [];
      podList.value = items;
      pagination.total = items.length;
      pagination.current = 1;
    } catch (e) {
      console.error('获取节点 Pod 列表失败:', e);
      podList.value = [];
      pagination.total = 0;
    } finally {
      loading.value = false;
    }
  }
</script>
