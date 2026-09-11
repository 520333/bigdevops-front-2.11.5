<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="批量解绑当前节点的 ELB 资源" :width="960" :destroyOnClose="true"
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
        <a-input-search v-model:value="searchKeyword" placeholder="搜索 负载均衡名 / ID / IP / DNS" allow-clear
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
        <!-- 负载均衡名 & 负载均衡 ID 组合展示 -->
        <template v-if="column.key === 'lbInfo'">
          <div class="flex flex-col">
            <span class="font-medium text-gray-800 dark:text-gray-200">
              {{ record.loadBalancerName || record.title || '-' }}
            </span>
            <span class="text-xs text-gray-400 font-mono truncate max-w-[220px]" :title="record.loadBalancerId">
              {{ formatLbId(record.loadBalancerId) }}
            </span>
          </div>
        </template>

        <!-- 类型 (ALB/CLB/NLB) -->
        <template v-else-if="column.key === 'type'">
          <a-tag :color="getTypeColor(record.loadBalancerType)">
            {{ (record.loadBalancerType || '-').toUpperCase() }}
          </a-tag>
        </template>

        <!-- 网络类型 -->
        <template v-else-if="column.key === 'addressType'">
          <span class="text-xs text-gray-600 dark:text-gray-300">
            {{ formatAddressType(record.addressType) }}
          </span>
        </template>

        <!-- 公网 IP / DNS -->
        <template v-else-if="column.key === 'networkInfo'">
          <div class="flex flex-col">
            <template v-if="record.PublicIpAddresses && record.PublicIpAddresses.length">
              <a-tag v-for="ip in record.PublicIpAddresses" :key="ip" color="blue" class="font-mono text-xs w-fit">
                {{ ip }}
              </a-tag>
            </template>
            <span v-else-if="record.DNSName" class="text-xs text-gray-500 font-mono truncate max-w-[180px]" :title="record.DNSName">
              {{ record.DNSName }}
            </span>
            <span v-else class="text-xs text-gray-400">内网实例</span>
          </div>
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
          <span> 个待解绑 ELB</span>
          <a-button v-if="selectedRowKeys.length > 0" type="link" size="small"
            class="text-gray-400 hover:text-red-500 ml-2" @click="selectedRowKeys = []">
            清空已选
          </a-button>
        </div>

        <div class="flex gap-2">
          <a-button @click="closeModal">取消</a-button>
          <a-popconfirm
            v-if="selectedRowKeys.length > 0"
            title="确认将选中的 ELB 从当前节点解绑吗？"
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
import { unBindElbToStreeNode, fetchResourceByNode } from '@/api/demo/system';
import { useMessage } from '@/hooks/web/useMessage';

export default defineComponent({
  name: 'ElbUnbindModal',
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
      showTotal: (total: number) => `共 ${total} 个已绑定 ELB`,
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
      { title: '负载均衡名称 / ID', key: 'lbInfo', width: 240 },
      { title: '类型', key: 'type', width: 100 },
      { title: '网络类型', key: 'addressType', width: 120 },
      { title: 'IP / DNS', key: 'networkInfo', width: 200 },
      { title: '云账号/厂商', key: 'vendor', width: 130 },
    ];

    const [registerModal, { closeModal }] = useModalInner(async (data) => {
      targetNode.value = data || {};
      selectedRowKeys.value = [];
      searchKeyword.value = '';
      pagination.current = 1;
      await fetchBoundElb();
    });

    const fetchBoundElb = async () => {
      if (!targetNode.value.id) return;
      loading.value = true;
      try {
        if (targetNode.value.bind_elbs && targetNode.value.bind_elbs.length > 0) {
          rawList.value = targetNode.value.bind_elbs;
        }
        const res: any = await fetchResourceByNode({
          nodeId: targetNode.value.id,
          resourceType: 'elb',
          page: 1,
          pageSize: 1000,
        });
        if (res && res.items) {
          rawList.value = res.items;
        } else if (Array.isArray(res)) {
          rawList.value = res;
        }
      } catch (err: any) {
        console.error('获取已绑定 ELB 失败', err);
      } finally {
        loading.value = false;
      }
    };

    const filteredData = computed(() => {
      const kw = searchKeyword.value.trim().toLowerCase();
      if (!kw) return rawList.value;

      return rawList.value.filter((item: any) => {
        const name = (item.loadBalancerName || item.title || '').toLowerCase();
        const id = (item.loadBalancerId || item.id || '').toLowerCase();
        const ips = (item.PublicIpAddresses || []).join(' ');
        const dns = (item.DNSName || '').toLowerCase();
        const type = (item.loadBalancerType || '').toLowerCase();
        const vendor = (item.account_name || item.vendor || '').toLowerCase();

        return (
          name.includes(kw) ||
          id.includes(kw) ||
          ips.includes(kw) ||
          dns.includes(kw) ||
          type.includes(kw) ||
          vendor.includes(kw)
        );
      });
    });

    const formatLbId = (id: string) => {
      if (!id) return '-';
      if (id.startsWith('arn:aws:')) {
        const parts = id.split('/');
        return parts.length > 2 ? parts[parts.length - 1] : id;
      }
      return id;
    };

    const getTypeColor = (type: string) => {
      if (!type) return 'default';
      const t = type.toLowerCase();
      if (t === 'alb' || t === 'application') return 'blue';
      if (t === 'clb' || t === 'classic') return 'cyan';
      if (t === 'nlb' || t === 'network') return 'purple';
      return 'default';
    };

    const formatAddressType = (text: string) => {
      if (!text) return '-';
      if (text.includes('internet') || text === 'internet') return '公网 (Internet)';
      if (text.includes('intranet') || text === 'internal') return '内网 (Internal)';
      return text;
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
        createMessage.warning('请至少选择一个 ELB 进行解绑');
        return;
      }

      submitting.value = true;
      try {
        await unBindElbToStreeNode({
          node_id: targetNode.value.id,
          resource_ids: selectedRowKeys.value,
        });
        createMessage.success(`成功从【${targetNode.value.title}】解绑 ${selectedRowKeys.value.length} 个 ELB！`);
        closeModal();
        emit('success', { nodeId: targetNode.value.id });
      } catch (err: any) {
        console.error('解绑 ELB 失败', err);
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
      formatLbId,
      getTypeColor,
      formatAddressType,
      handleSearch,
      handleResetSearch,
      handleSubmit,
    };
  },
});
</script>
