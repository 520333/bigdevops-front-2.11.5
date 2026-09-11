<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="关联 ECS 资源到当前节点" :width="960" :destroyOnClose="true"
    :confirmLoading="submitting" @ok="handleSubmit" okText="确认关联" cancelText="取消">
    <!-- 头部提示 & 快捷搜索栏 -->
    <div class="mb-3 flex flex-wrap justify-between items-center gap-3">
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-500 dark:text-gray-400">
          目标节点：<strong class="text-blue-600 dark:text-blue-400 text-sm">{{ targetNode.title }}</strong>
        </span>
        <a-tag v-if="targetNode.level" color="blue" class="text-xs">Level {{ targetNode.level }}</a-tag>
      </div>

      <div class="flex items-center gap-2">
        <a-input-search v-model:value="searchKeyword" placeholder="搜索 IP / 实例名 / 主机名" allow-clear style="width: 280px"
          @search="handleSearch" />
        <a-button type="default" @click="handleResetSearch" preIcon="ant-design:reload-outlined">
          重置
        </a-button>
      </div>
    </div>

    <!-- 资产选择表格 (免去右箭头穿梭，直接复选框极简勾选) -->
    <a-table :columns="columns" :data-source="filteredData" :row-selection="rowSelection"
      :row-key="(record: any) => String(record.id)" :loading="loading" :pagination="pagination" :scroll="{ y: 400 }"
      size="middle" :custom-row="customRow" class="border border-gray-100 dark:border-zinc-800 rounded">
      <!-- 实例名 & 实例 ID 组合展示 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'instanceInfo'">
          <div class="flex flex-col">
            <span class="font-medium text-gray-800 dark:text-gray-200">
              {{ record.title || record.instanceName || '-' }}
            </span>
            <span class="text-xs text-gray-400 font-mono">
              {{ record.InstanceId || record.instanceId || '-' }}
            </span>
          </div>
        </template>

        <!-- 私网 IP 突出展示 -->
        <template v-else-if="column.key === 'ip'">
          <div class="flex flex-wrap gap-1">
            <template v-if="getIps(record).length">
              <a-tag v-for="ip in getIps(record)" :key="ip" color="blue" class="font-mono text-xs">
                {{ ip }}
              </a-tag>
            </template>
            <span v-else class="text-xs text-gray-400">无内网IP</span>
          </div>
        </template>

        <!-- 规格展示 (CPU/内存) -->
        <template v-else-if="column.key === 'spec'">
          <span class="text-xs text-gray-600 dark:text-gray-300">
            {{ formatSpec(record) }}
          </span>
        </template>


        <!-- 厂商/账号 -->
        <template v-else-if="column.key === 'vendor'">
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ record.account_name || (record.vendor === 'self' || record.vendor === 'idc' ? '自建' : record.vendor) || '-' }}
          </span>
        </template>
      </template>
    </a-table>

    <!-- 底部状态指示 -->
    <template #footer>
      <div class="flex justify-between items-center w-full">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          <span>已勾选 </span>
          <strong class="text-blue-600 dark:text-blue-400 font-semibold">{{ selectedRowKeys.length }}</strong>
          <span> 台主机</span>
          <a-button v-if="selectedRowKeys.length > 0" type="link" size="small"
            class="text-gray-400 hover:text-red-500 ml-2" @click="selectedRowKeys = []">
            清空已选
          </a-button>
        </div>

        <div class="flex gap-2">
          <a-button @click="closeModal">取消</a-button>
          <a-button type="primary" :loading="submitting" :disabled="selectedRowKeys.length === 0" @click="handleSubmit">
            确认关联 {{ selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : '' }}
          </a-button>
        </div>
      </div>
    </template>
  </BasicModal>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed } from 'vue';
import { BasicModal, useModalInner } from '@/components/Modal';
import { Table, Tag, Input, Button } from 'ant-design-vue';
import { getResourceEcsUnbindList, bindEcsToStreeNode } from '@/api/demo/system';
import { useMessage } from '@/hooks/web/useMessage';

export default defineComponent({
  name: 'EcsBindModal',
  components: {
    BasicModal,
    ATable: Table,
    ATag: Tag,
    AInputSearch: Input.Search,
    AButton: Button,
  },
  emits: ['success', 'register'],
  setup(_, { emit }) {
    const { createMessage } = useMessage();
    const loading = ref(false);
    const submitting = ref(false);
    const targetNode = ref<any>({});
    const rawList = ref<any[]>([]);
    const searchKeyword = ref('');
    const selectedRowKeys = ref<string[]>([]);

    const pagination = reactive({
      current: 1,
      pageSize: 8,
      showSizeChanger: true,
      pageSizeOptions: ['10', '20', '50', '100'],
      showTotal: (total: number) => `共 ${total} 台可选主机`,
      onChange: (page: number, size: number) => {
        pagination.current = page;
        pagination.pageSize = size;
      },
      onShowSizeChange: (_current: number, size: number) => {
        pagination.current = 1;
        pagination.pageSize = size;
      },
    });

    const columns = [
      { title: '实例名 / ID', key: 'instanceInfo', width: 220 },
      { title: '内网 IP', key: 'ip', width: 180 },
      { title: '规格', key: 'spec', width: 130 },
      { title: '操作系统', dataIndex: 'OSName', width: 160, ellipsis: true },
      { title: '云账号/厂商', key: 'vendor', width: 120 },
    ];

    const [registerModal, { closeModal }] = useModalInner(async (data) => {
      targetNode.value = data || {};
      selectedRowKeys.value = [];
      searchKeyword.value = '';
      pagination.current = 1;
      await fetchAvailableEcs();
    });

    const fetchAvailableEcs = async () => {
      if (!targetNode.value.id) return;
      loading.value = true;
      try {
        const res = await getResourceEcsUnbindList();
        rawList.value = res || [];
      } catch (err: any) {
        console.error('获取待关联主机失败', err);
      } finally {
        loading.value = false;
      }
    };

    const filteredData = computed(() => {
      const kw = searchKeyword.value.trim().toLowerCase();
      if (!kw) return rawList.value;

      return rawList.value.filter((item: any) => {
        const name = (item.title || item.instanceName || '').toLowerCase();
        const id = (item.InstanceId || item.instanceId || '').toLowerCase();
        const ips = (item.PrivateIpAddress || []).join(' ');
        const os = (item.OSName || '').toLowerCase();
        const vendor = (item.account_name || '').toLowerCase();

        return (
          name.includes(kw) ||
          id.includes(kw) ||
          ips.includes(kw) ||
          os.includes(kw) ||
          vendor.includes(kw)
        );
      });
    });

    const getIps = (record: any): string[] => {
      if (Array.isArray(record.PrivateIpAddress)) return record.PrivateIpAddress;
      if (record.PrivateIpAddress && typeof record.PrivateIpAddress === 'string') {
        return [record.PrivateIpAddress];
      }
      return [];
    };

    const formatSpec = (record: any): string => {
      const cpu = record.Cpu || record.cpu;
      const mem = record.Memory || record.memory;
      if (!cpu && !mem) return record.InstanceType || '-';
      const memGb = mem ? `${(mem / 1024).toFixed(0)}G` : '';
      return `${cpu ? `${cpu}核 ` : ''}${memGb}`;
    };

    const rowSelection = computed(() => ({
      selectedRowKeys: selectedRowKeys.value,
      onChange: (keys: (string | number)[]) => {
        selectedRowKeys.value = keys.map(String);
      },
    }));

    const customRow = (record: any) => ({
      onClick: (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target && target.closest('.ant-checkbox-wrapper')) {
          return;
        }
        const key = String(record.id);
        const idx = selectedRowKeys.value.indexOf(key);
        if (idx > -1) {
          selectedRowKeys.value.splice(idx, 1);
        } else {
          selectedRowKeys.value.push(key);
        }
      },
    });

    const handleSearch = () => {
      pagination.current = 1;
    };
    const handleResetSearch = () => {
      searchKeyword.value = '';
      pagination.current = 1;
    };

    const handleSubmit = async () => {
      if (selectedRowKeys.value.length === 0) {
        createMessage.warning('请至少选择一台主机进行关联');
        return;
      }

      submitting.value = true;
      try {
        await bindEcsToStreeNode({
          node_id: targetNode.value.id,
          resource_ids: selectedRowKeys.value,
        });
        createMessage.success(`成功关联 ${selectedRowKeys.value.length} 台主机到【${targetNode.value.title}】！`);
        closeModal();
        emit('success', { nodeId: targetNode.value.id });
      } catch (err: any) {
        console.error('绑定失败', err);
      } finally {
        submitting.value = false;
      }
    };

    return {
      registerModal,
      closeModal,
      targetNode,
      columns,
      filteredData,
      loading,
      submitting,
      searchKeyword,
      selectedRowKeys,
      pagination,
      rowSelection,
      customRow,
      getIps,
      formatSpec,
      handleSearch,
      handleResetSearch,
      handleSubmit,
    };
  },
});
</script>
