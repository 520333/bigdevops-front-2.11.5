<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="批量解绑当前节点的 DNS 资源" :width="960" :destroyOnClose="true"
    :confirmLoading="submitting" @ok="handleSubmit" okText="确认解绑" :okButtonProps="{ type: 'primary', danger: true }"
    cancelText="取消">
    <!-- 头部提示 & 类型快捷切换 & 搜索栏 -->
    <div class="mb-3 flex flex-wrap justify-between items-center gap-3">
      <div class="flex items-center gap-3 flex-wrap">
        <span class="text-xs text-gray-500 dark:text-gray-400">
          目标节点：<strong class="text-blue-600 dark:text-blue-400 text-sm">{{ targetNode.title }}</strong>
        </span>
        <a-tag v-if="targetNode.level" color="blue" class="text-xs">Level {{ targetNode.level }}</a-tag>

        <!-- 记录类型快捷查看 -->
        <a-radio-group v-model:value="selectedType" button-style="solid" size="small" @change="handleTypeChange">
          <a-radio-button value="ALL">
            全部 <span class="text-xs opacity-75">({{ typeStats.ALL || 0 }})</span>
          </a-radio-button>
          <a-radio-button v-for="t in dynamicTypes" :key="t" :value="t">
            {{ t }} 记录 <span class="text-xs opacity-75">({{ typeStats[t] || 0 }})</span>
          </a-radio-button>
        </a-radio-group>
      </div>

      <div class="flex items-center gap-2">
        <a-input-search v-model:value="searchKeyword" placeholder="搜索 域名 / 解析值" allow-clear
          style="width: 220px" @search="handleSearch" />
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
        <!-- 完整域名 -->
        <template v-if="column.key === 'fullDomain'">
          <span class="font-medium text-gray-800 dark:text-gray-200">
            {{ getFullDomain(record) }}
          </span>
        </template>

        <!-- 记录类型 -->
        <template v-else-if="column.key === 'type'">
          <a-tag :color="getTypeColor(record.type)">
            {{ (record.type || 'A').toUpperCase() }}
          </a-tag>
        </template>

        <!-- 解析值 -->
        <template v-else-if="column.key === 'value'">
          <span class="text-xs text-gray-600 dark:text-gray-300 font-mono truncate max-w-[260px] inline-block" :title="record.value">
            {{ record.value || '-' }}
          </span>
        </template>

        <!-- 根域名 -->
        <template v-else-if="column.key === 'domain'">
          <span class="text-xs text-gray-500">
            {{ record.domain || '-' }}
          </span>
        </template>

        <!-- 厂商 -->
        <template v-else-if="column.key === 'vendor'">
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ record.vendor || '-' }}
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
          <span> 条待解绑域名</span>
          <a-button v-if="selectedRowKeys.length > 0" type="link" size="small"
            class="text-gray-400 hover:text-red-500 ml-2" @click="selectedRowKeys = []">
            清空已选
          </a-button>
        </div>

        <div class="flex gap-2">
          <a-button @click="closeModal">取消</a-button>
          <a-popconfirm
            v-if="selectedRowKeys.length > 0"
            title="确认将选中的域名解析从当前节点解绑吗？"
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
import { Table, Tag, Input, Button, Popconfirm, Radio } from 'ant-design-vue';
import { unBindDnsToStreeNode, fetchResourceByNode } from '@/api/demo/system';
import { useMessage } from '@/hooks/web/useMessage';

export default defineComponent({
  name: 'DnsUnbindModal',
  components: {
    BasicModal,
    ATable: Table,
    ATag: Tag,
    AInputSearch: Input.Search,
    AButton: Button,
    APopconfirm: Popconfirm,
    ARadioGroup: Radio.Group,
    ARadioButton: Radio.Button,
  },
  emits: ['success', 'register'],
  setup(_, { emit }) {
    const { createMessage } = useMessage();
    const loading = ref(false);
    const submitting = ref(false);
    const targetNode = ref<any>({});
    const rawList = ref<any[]>([]);
    const searchKeyword = ref('');
    const selectedType = ref('ALL');
    const selectedRowKeys = ref<string[]>([]);

    const pagination = reactive({
      current: 1,
      pageSize: 8,
      showSizeChanger: true,
      pageSizeOptions: ['8', '10', '20', '50', '100'],
      showTotal: (total: number) => `共 ${total} 条已绑定域名`,
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
      { title: '完整域名', key: 'fullDomain', width: 240 },
      { title: '记录类型', key: 'type', width: 100 },
      { title: '解析记录值', key: 'value', width: 260 },
      { title: '所属主域名', key: 'domain', width: 160 },
      { title: 'DNS厂商', key: 'vendor', width: 110 },
    ];

    const [registerModal, { closeModal }] = useModalInner(async (data) => {
      targetNode.value = data || {};
      selectedRowKeys.value = [];
      searchKeyword.value = '';
      selectedType.value = 'ALL';
      pagination.current = 1;
      await fetchBoundDns();
    });

    const fetchBoundDns = async () => {
      if (!targetNode.value.id) return;
      loading.value = true;
      try {
        if (targetNode.value.bind_dnss && targetNode.value.bind_dnss.length > 0) {
          rawList.value = targetNode.value.bind_dnss;
        }
        const res: any = await fetchResourceByNode({
          nodeId: targetNode.value.id,
          resourceType: 'dns',
          page: 1,
          pageSize: 1000,
        });
        if (res && res.items) {
          rawList.value = res.items;
        } else if (Array.isArray(res)) {
          rawList.value = res;
        }
      } catch (err: any) {
        console.error('获取已绑定 DNS 失败', err);
      } finally {
        loading.value = false;
      }
    };

    const getFullDomain = (record: any) => {
      if (record.fullDomain) return record.fullDomain;
      return (record.name === '@' || !record.name) ? record.domain : `${record.name}.${record.domain}`;
    };

    // 动态统计各类型数量
    const typeStats = computed(() => {
      const counts: Record<string, number> = { ALL: rawList.value.length };
      rawList.value.forEach((item: any) => {
        const t = (item.type || 'A').toUpperCase();
        counts[t] = (counts[t] || 0) + 1;
      });
      return counts;
    });

    // 动态提取存在的记录类型
    const dynamicTypes = computed(() => {
      const set = new Set<string>();
      rawList.value.forEach((item: any) => {
        if (item.type) set.add(item.type.toUpperCase());
      });
      const order = ['A', 'CNAME', 'TXT', 'AAAA', 'MX', 'NS'];
      const result: string[] = [];
      order.forEach((t) => {
        if (set.has(t)) {
          result.push(t);
          set.delete(t);
        }
      });
      Array.from(set).sort().forEach((t) => result.push(t));
      return result;
    });

    const filteredData = computed(() => {
      let list = rawList.value;

      // 1. 类型筛选
      if (selectedType.value !== 'ALL') {
        list = list.filter((item: any) => {
          return (item.type || '').toUpperCase() === selectedType.value;
        });
      }

      // 2. 关键字搜索
      const kw = searchKeyword.value.trim().toLowerCase();
      if (!kw) return list;

      return list.filter((item: any) => {
        const full = getFullDomain(item).toLowerCase();
        const name = (item.name || '').toLowerCase();
        const domain = (item.domain || '').toLowerCase();
        const value = (item.value || '').toLowerCase();
        const type = (item.type || '').toLowerCase();
        const vendor = (item.vendor || '').toLowerCase();

        return (
          full.includes(kw) ||
          name.includes(kw) ||
          domain.includes(kw) ||
          value.includes(kw) ||
          type.includes(kw) ||
          vendor.includes(kw)
        );
      });
    });

    const handleTypeChange = () => {
      pagination.current = 1;
    };

    const getTypeColor = (type: string) => {
      switch (type?.toUpperCase()) {
        case 'A': return 'blue';
        case 'AAAA': return 'geekblue';
        case 'CNAME': return 'purple';
        case 'TXT': return 'green';
        case 'NS': return 'orange';
        case 'MX': return 'gold';
        default: return 'default';
      }
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
      selectedType.value = 'ALL';
      pagination.current = 1;
    };

    const handleSubmit = async () => {
      if (selectedRowKeys.value.length === 0) {
        createMessage.warning('请至少选择一条域名解析进行解绑');
        return;
      }

      submitting.value = true;
      try {
        await unBindDnsToStreeNode({
          node_id: targetNode.value.id,
          resource_ids: selectedRowKeys.value,
        });
        createMessage.success(`成功从【${targetNode.value.title}】解绑 ${selectedRowKeys.value.length} 条域名！`);
        closeModal();
        emit('success', { nodeId: targetNode.value.id });
      } catch (err: any) {
        console.error('解绑 DNS 失败', err);
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
      selectedType,
      dynamicTypes,
      typeStats,
      handleTypeChange,
      selectedRowKeys,
      pagination,
      rowSelection,
      customRow,
      getFullDomain,
      getTypeColor,
      handleSearch,
      handleResetSearch,
      handleSubmit,
    };
  },
});
</script>
