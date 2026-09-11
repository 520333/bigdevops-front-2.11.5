<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="批量解绑当前节点的 RDS 资源" :width="960" :destroyOnClose="true"
    :confirmLoading="submitting" @ok="handleSubmit" okText="确认解绑" :okButtonProps="{ type: 'primary', danger: true }"
    cancelText="取消">
    <!-- 头部提示 & 快捷搜索栏 -->
    <div class="mb-3 flex flex-wrap justify-between items-center gap-3">
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-500 dark:text-gray-400">
          目标节点：<strong class="text-blue-600 dark:text-blue-400 text-sm">{{ targetNode.title }}</strong>
        </span>
        <a-tag v-if="targetNode.level" color="blue" class="text-xs">Level {{ targetNode.level }}</a-tag>
      </div>

      <div class="flex items-center gap-2">
        <a-input-search v-model:value="searchKeyword" placeholder="搜索 实例名 / ID / 引擎 / 地址" allow-clear
          style="width: 280px" @search="handleSearch" />
        <a-button type="default" @click="handleResetSearch" preIcon="ant-design:reload-outlined">
          重置
        </a-button>
      </div>
    </div>

    <!-- 资产选择表格 (免去右箭头穿梭，直接复选框勾选解绑) -->
    <a-table :columns="columns" :data-source="filteredData" :row-selection="rowSelection"
      :row-key="(record: any) => String(record.id)" :loading="loading" :pagination="pagination" :scroll="{ y: 400 }"
      size="middle" :custom-row="customRow" class="border border-gray-100 dark:border-zinc-800 rounded">
      <template #bodyCell="{ column, record }">
        <!-- 实例名 & 实例 ID -->
        <template v-if="column.key === 'rdsInfo'">
          <div class="flex flex-col">
            <span class="font-medium text-gray-800 dark:text-gray-200">
              {{ record.name || record.title || '-' }}
            </span>
            <span class="text-xs text-gray-400 font-mono truncate max-w-[200px]" :title="record.DBInstanceId">
              {{ record.DBInstanceId || record.instanceId || '-' }}
            </span>
          </div>
        </template>

        <!-- 引擎与版本 -->
        <template v-else-if="column.key === 'engine'">
          <div class="flex items-center gap-1">
            <a-tag :color="getEngineColor(record.engine)">
              {{ (record.engine || 'MySQL').toUpperCase() }}
            </a-tag>
            <span class="text-xs text-gray-400 font-mono">{{ record.EngineVersion || '' }}</span>
          </div>
        </template>

        <!-- 连接地址 -->
        <template v-else-if="column.key === 'endpoint'">
          <span class="text-xs text-gray-600 dark:text-gray-300 font-mono truncate max-w-[220px] inline-block" :title="formatEndpoint(record)">
            {{ formatEndpoint(record) }}
          </span>
        </template>

        <!-- 规格 -->
        <template v-else-if="column.key === 'spec'">
          <span class="text-xs text-gray-500 font-mono">
            {{ record.DBInstanceClass || record.spec || '-' }}
          </span>
        </template>

        <!-- 厂商/账号 -->
        <template v-else-if="column.key === 'vendor'">
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ record.account_name || record.vendor || '-' }}
          </span>
        </template>
      </template>
    </a-table>

    <!-- 底部状态指示 -->
    <template #footer>
      <div class="flex justify-between items-center w-full">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          <span>已选中 </span>
          <strong class="text-red-500 font-semibold">{{ selectedRowKeys.length }}</strong>
          <span> 个待解绑 RDS</span>
          <a-button v-if="selectedRowKeys.length > 0" type="link" size="small"
            class="text-gray-400 hover:text-red-500 ml-2" @click="selectedRowKeys = []">
            清空已选
          </a-button>
        </div>

        <div class="flex gap-2">
          <a-button @click="closeModal">取消</a-button>
          <a-popconfirm
            v-if="selectedRowKeys.length > 0"
            title="确认将选中的 RDS 从当前节点解绑吗？"
            ok-text="确认解绑"
            cancel-text="取消"
            :ok-button-props="{ type: 'primary', danger: true }"
            @confirm="handleSubmit"
          >
            <a-button type="primary" danger :loading="submitting">
              确认解绑 ({{ selectedRowKeys.length }})
            </a-button>
          </a-popconfirm>
          <a-button v-else type="primary" danger :disabled="true">
            确认解绑
          </a-button>
        </div>
      </div>
    </template>
  </BasicModal>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed } from 'vue';
import { BasicModal, useModalInner } from '@/components/Modal';
import { Table, Tag, Input, Button, Popconfirm } from 'ant-design-vue';
import { unBindRdsToStreeNode, fetchResourceByNode } from '@/api/demo/system';
import { useMessage } from '@/hooks/web/useMessage';

export default defineComponent({
  name: 'RdsUnbindModal',
  components: {
    BasicModal,
    ATable: Table,
    ATag: Tag,
    AInputSearch: Input.Search,
    AButton: Button,
    APopconfirm: Popconfirm,
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
      showTotal: (total: number) => `共 ${total} 个已绑定 RDS`,
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
      { title: '实例名称 / ID', key: 'rdsInfo', width: 220 },
      { title: '引擎类型', key: 'engine', width: 140 },
      { title: '连接地址', key: 'endpoint', width: 220 },
      { title: '规格', key: 'spec', width: 150 },
      { title: '云账号/厂商', key: 'vendor', width: 130 },
    ];

    const [registerModal, { closeModal }] = useModalInner(async (data) => {
      targetNode.value = data || {};
      selectedRowKeys.value = [];
      searchKeyword.value = '';
      pagination.current = 1;
      await fetchBoundRds();
    });

    const fetchBoundRds = async () => {
      if (!targetNode.value.id) return;
      loading.value = true;
      try {
        if (targetNode.value.bind_rdss && targetNode.value.bind_rdss.length > 0) {
          rawList.value = targetNode.value.bind_rdss;
        }
        const res: any = await fetchResourceByNode({
          nodeId: targetNode.value.id,
          resourceType: 'rds',
          page: 1,
          pageSize: 1000,
        });
        if (res && res.items) {
          rawList.value = res.items;
        } else if (Array.isArray(res)) {
          rawList.value = res;
        }
      } catch (err: any) {
        console.error('获取已绑定 RDS 失败', err);
      } finally {
        loading.value = false;
      }
    };

    const filteredData = computed(() => {
      const kw = searchKeyword.value.trim().toLowerCase();
      if (!kw) return rawList.value;

      return rawList.value.filter((item: any) => {
        const name = (item.name || item.title || '').toLowerCase();
        const id = (item.DBInstanceId || item.id || '').toLowerCase();
        const engine = (item.engine || '').toLowerCase();
        const host = (item.host || '').toLowerCase();
        const vendor = (item.account_name || item.vendor || '').toLowerCase();

        return (
          name.includes(kw) ||
          id.includes(kw) ||
          engine.includes(kw) ||
          host.includes(kw) ||
          vendor.includes(kw)
        );
      });
    });

    const getEngineColor = (engine: string) => {
      if (!engine) return 'default';
      const e = engine.toLowerCase();
      if (e.includes('mysql')) return 'blue';
      if (e.includes('postgres') || e.includes('pg')) return 'geekblue';
      if (e.includes('redis')) return 'red';
      if (e.includes('mongo')) return 'green';
      return 'cyan';
    };

    const formatEndpoint = (record: any) => {
      if (!record.host) return '-';
      return `${record.host}:${record.port || 3306}`;
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
        if (target && (target.closest('.ant-checkbox-wrapper') || target.closest('.ant-popover'))) {
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
        createMessage.warning('请至少选择一个 RDS 进行解绑');
        return;
      }

      submitting.value = true;
      try {
        await unBindRdsToStreeNode({
          node_id: targetNode.value.id,
          resource_ids: selectedRowKeys.value,
        });
        createMessage.success(`成功从【${targetNode.value.title}】解绑 ${selectedRowKeys.value.length} 个 RDS！`);
        closeModal();
        emit('success', { nodeId: targetNode.value.id });
      } catch (err: any) {
        console.error('解绑 RDS 失败', err);
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
      getEngineColor,
      formatEndpoint,
      handleSearch,
      handleResetSearch,
      handleSubmit,
    };
  },
});
</script>
