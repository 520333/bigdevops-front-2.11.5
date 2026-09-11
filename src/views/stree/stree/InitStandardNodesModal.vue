<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="一键初始化标准架构节点" :width="920" :canFullscreen="false"
    :defaultFullscreen="false" :bodyStyle="{ padding: '16px 20px', height: '520px', overflow: 'hidden' }"
    @ok="handleSubmit" :okButtonProps="{ loading: submitting }" okText="确认批量生成" cancelText="取消">
    <div class="h-full flex flex-col gap-3">
      <!-- 顶部配置栏 -->
      <div
        class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-zinc-800/60 rounded-md border border-gray-200/80 dark:border-zinc-700/60">
        <div class="flex items-center gap-2">
          <Icon icon="ant-design:folder-open-outlined" class="text-blue-500 text-base" />
          <span class="text-xs text-gray-500">父节点:</span>
          <span class="font-semibold text-gray-800 dark:text-gray-200 text-xs">{{ parentNode.title || '-' }}</span>
          <Tag color="blue" class="text-[11px] py-0 px-1 leading-normal">Level {{ parentNode.level }}</Tag>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">项目前缀:</span>
          <a-input v-model:value="projectPrefix" placeholder="如: binance" size="small" class="w-40 font-mono text-xs"
            @change="handlePrefixChange">
            <template #prefix>
              <Icon icon="ant-design:tag-outlined" class="text-gray-400 text-xs" />
            </template>
          </a-input>
        </div>
      </div>

      <!-- 核心左右分栏主体 -->
      <div class="flex-1 flex gap-3 min-h-0">
        <!-- 左侧：组件选择区 (52%) -->
        <div
          class="w-[52%] flex flex-col border border-gray-200/80 dark:border-zinc-700/60 rounded-md p-3 bg-white dark:bg-zinc-900 overflow-hidden">
          <!-- 快捷操作工具条 -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-1.5">
              <a-button size="small" type="primary" ghost class="text-xs px-2 h-6" @click="selectRecommended">
                <Icon icon="ant-design:star-outlined" /> 推荐常用 (5)
              </a-button>
              <a-button size="small" class="text-xs px-2 h-6" @click="selectAll">
                全选 (17)
              </a-button>
              <a-button size="small" class="text-xs px-2 h-6" @click="clearAll">
                清空
              </a-button>
            </div>
            <span class="text-[11px] text-gray-400">已选 {{ selectedKeys.length }}/{{ totalComponentCount }}</span>
          </div>

          <!-- 分类标签页 -->
          <a-tabs v-model:activeKey="activeCategoryKey" size="small"
            class="component-nav-tabs flex-1 flex flex-col min-h-0">
            <a-tab-pane v-for="cat in categoryTabs" :key="cat.key" :tab="cat.title">
              <div class="h-[320px] overflow-y-auto pr-1">
                <div class="grid grid-cols-2 gap-2 pt-1">
                  <div v-for="item in cat.items" :key="item.key" @click="toggleComponent(item.key)" :class="[
                    'p-2 rounded border text-xs cursor-pointer transition-all flex items-center justify-between select-none h-11',
                    selectedKeys.includes(item.key)
                      ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-medium'
                      : 'border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40 hover:border-blue-300 text-gray-700 dark:text-gray-300'
                  ]">
                    <div class="flex flex-col min-w-0 pr-1">
                      <span class="truncate leading-snug">{{ item.label }}</span>
                      <span class="text-[11px] font-mono text-gray-400 truncate">{{ item.suffix }}</span>
                    </div>
                    <Icon
                      :icon="selectedKeys.includes(item.key) ? 'ant-design:check-circle-filled' : 'ant-design:plus-circle-outlined'"
                      :class="selectedKeys.includes(item.key) ? 'text-blue-500 text-sm flex-shrink-0' : 'text-gray-300 text-sm flex-shrink-0'" />
                  </div>
                </div>
              </div>
            </a-tab-pane>
          </a-tabs>
        </div>

        <!-- 右侧：待生成清单与微调区 (48%) -->
        <div
          class="w-[48%] flex flex-col border border-gray-200/80 dark:border-zinc-700/60 rounded-md p-3 bg-white dark:bg-zinc-900 overflow-hidden">
          <div class="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100 dark:border-zinc-800">
            <span class="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1">
              <Icon icon="ant-design:unordered-list-outlined" class="text-blue-500" />
              待生成叶子节点清单 ({{ selectedComponentsList.length }})
            </span>
            <span class="text-[11px] text-gray-400">支持就地微调</span>
          </div>

          <div v-if="selectedComponentsList.length === 0"
            class="flex-1 flex flex-col items-center justify-center text-gray-400 text-xs">
            <Icon icon="ant-design:inbox-outlined" class="text-3xl text-gray-300 mb-1" />
            <span>请在左侧选择需要初始化的组件</span>
          </div>

          <div v-else class="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
            <div v-for="item in selectedComponentsList" :key="item.key"
              class="border border-gray-100 dark:border-zinc-800 rounded p-2 bg-gray-50/30 dark:bg-zinc-800/30 flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <Tag color="cyan" class="text-[11px] py-0 px-1 m-0">{{ item.label }}</Tag>
                <Icon icon="ant-design:close-outlined" class="text-gray-400 hover:text-red-500 cursor-pointer text-xs"
                  title="移除此项" @click="toggleComponent(item.key)" />
              </div>

              <div class="flex items-center gap-1.5">
                <span class="text-[11px] text-gray-400 w-10 text-right flex-shrink-0">标识:</span>
                <a-input v-model:value="item.currentTitle" size="small" class="font-mono text-xs flex-1" />
              </div>

              <div class="flex items-center gap-1.5">
                <span class="text-[11px] text-gray-400 w-10 text-right flex-shrink-0">描述:</span>
                <a-input v-model:value="item.currentDesc" size="small" class="text-xs flex-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BasicModal>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { BasicModal, useModalInner } from '@/components/Modal';
import { Tag, Input, Tabs } from 'ant-design-vue';
import Icon from '@/components/Icon/Icon.vue';
import { createStreeNode } from '@/api/demo/system';
import { useMessage } from '@/hooks/web/useMessage';

export interface ComponentItem {
  key: string;
  label: string;
  category: string;
  suffix: string;
  defaultDesc: string;
  recommended: boolean;
  currentTitle?: string;
  currentDesc?: string;
}

export default defineComponent({
  name: 'InitStandardNodesModal',
  components: {
    BasicModal,
    Tag,
    Icon,
    AInput: Input,
    ATabs: Tabs,
    ATabPane: Tabs.TabPane,
  },
  emits: ['success', 'register'],
  setup(_, { emit }) {
    const { createMessage } = useMessage();
    const parentNode = ref<any>({});
    const projectPrefix = ref('');
    const submitting = ref(false);
    const activeCategoryKey = ref('all');

    // 🌟 全量 17 种技术栈组件库
    const rawComponents: ComponentItem[] = [
      // 1. 应用与网关
      { key: 'web', label: 'Web 应用', category: 'app', suffix: '-web', defaultDesc: 'Web业务应用集群', recommended: true },
      { key: 'nginx', label: 'Nginx 网关', category: 'app', suffix: '-nginx', defaultDesc: 'Nginx反向代理与网关集群', recommended: true },
      { key: 'docker', label: '单机 Docker', category: 'app', suffix: '-docker', defaultDesc: '单机Docker容器服务', recommended: false },
      { key: 'k8s', label: 'Kubernetes', category: 'app', suffix: '-k8s', defaultDesc: 'K8s容器化应用集群', recommended: false },

      // 2. 数据库与缓存 (6种)
      { key: 'mysql', label: 'MySQL 数据库', category: 'db', suffix: '-mysql', defaultDesc: 'MySQL业务数据库集群', recommended: true },
      { key: 'redis', label: 'Redis 缓存', category: 'db', suffix: '-redis', defaultDesc: 'Redis高性能缓存集群', recommended: true },
      { key: 'postgresql', label: 'PostgreSQL', category: 'db', suffix: '-pg', defaultDesc: 'PostgreSQL数据库集群', recommended: false },
      { key: 'oracle', label: 'Oracle 数据库', category: 'db', suffix: '-oracle', defaultDesc: 'Oracle商业数据库集群', recommended: false },
      { key: 'mongo', label: 'MongoDB', category: 'db', suffix: '-mongo', defaultDesc: 'MongoDB文档数据库集群', recommended: false },
      { key: 'elasticsearch', label: 'Elasticsearch', category: 'db', suffix: '-es', defaultDesc: 'ES检索与日志集群', recommended: false },

      // 3. 消息与调度
      { key: 'kafka', label: 'Kafka 消息队列', category: 'mq_job', suffix: '-kafka', defaultDesc: 'Kafka高吞吐消息队列', recommended: false },
      { key: 'rabbitmq', label: 'RabbitMQ', category: 'mq_job', suffix: '-rabbitmq', defaultDesc: 'RabbitMQ消息中间件集群', recommended: false },
      { key: 'rocketmq', label: 'RocketMQ', category: 'mq_job', suffix: '-rocketmq', defaultDesc: 'RocketMQ金融级消息集群', recommended: false },
      { key: 'xxljob', label: 'XXL-Job 调度', category: 'mq_job', suffix: '-xxljob', defaultDesc: 'XXL-Job分布式任务调度集群', recommended: false },

      // 4. 存储与治理
      { key: 'nacos', label: 'Nacos 配置中心', category: 'infra', suffix: '-nacos', defaultDesc: 'Nacos注册与配置中心', recommended: true },
      { key: 'consul', label: 'Consul 治理', category: 'infra', suffix: '-consul', defaultDesc: 'Consul服务发现与健康检查', recommended: false },
      { key: 'minio', label: 'MinIO 对象存储', category: 'infra', suffix: '-minio', defaultDesc: 'MinIO分布式对象存储集群', recommended: false },
    ];

    const componentList = ref<ComponentItem[]>([]);
    const selectedKeys = ref<string[]>([]);

    const categoryTabs = computed(() => [
      { key: 'all', title: '全部 (17)', items: componentList.value },
      { key: 'db', title: '数据缓存 (6)', items: componentList.value.filter((c) => c.category === 'db') },
      { key: 'app', title: '应用网关 (4)', items: componentList.value.filter((c) => c.category === 'app') },
      { key: 'mq_job', title: '消息调度 (4)', items: componentList.value.filter((c) => c.category === 'mq_job') },
      { key: 'infra', title: '存储治理 (3)', items: componentList.value.filter((c) => c.category === 'infra') },
    ]);

    const totalComponentCount = computed(() => rawComponents.length);

    const selectedComponentsList = computed(() => {
      return componentList.value.filter((c) => selectedKeys.value.includes(c.key));
    });

    const refreshTitlesAndDescs = () => {
      const p = projectPrefix.value.trim() || 'app';
      componentList.value.forEach((item) => {
        item.currentTitle = `${p}${item.suffix}`;
        item.currentDesc = `${p} 的 ${item.defaultDesc}`;
      });
    };

    const handlePrefixChange = () => {
      refreshTitlesAndDescs();
    };

    const toggleComponent = (key: string) => {
      const idx = selectedKeys.value.indexOf(key);
      if (idx > -1) {
        selectedKeys.value.splice(idx, 1);
      } else {
        selectedKeys.value.push(key);
      }
    };

    const selectRecommended = () => {
      selectedKeys.value = componentList.value.filter((c) => c.recommended).map((c) => c.key);
    };

    const selectAll = () => {
      selectedKeys.value = componentList.value.map((c) => c.key);
    };

    const clearAll = () => {
      selectedKeys.value = [];
    };

    const [registerModal, { closeModal }] = useModalInner((data) => {
      parentNode.value = data || {};
      activeCategoryKey.value = 'all';

      // 提取前缀，例如 "binance项目" -> "binance"
      let defaultPrefix = (parentNode.value.title || '').trim();
      defaultPrefix = defaultPrefix.replace(/(项目|系统|服务|中心)$/g, '');
      if (!defaultPrefix) defaultPrefix = 'app';
      projectPrefix.value = defaultPrefix;

      componentList.value = JSON.parse(JSON.stringify(rawComponents));
      refreshTitlesAndDescs();
      selectRecommended();
    });

    const handleSubmit = async () => {
      if (selectedKeys.value.length === 0) {
        createMessage.warning('请至少选择一个要初始化的组件');
        return;
      }

      if (!projectPrefix.value.trim()) {
        createMessage.warning('请输入项目前缀');
        return;
      }

      submitting.value = true;
      const targetItems = selectedComponentsList.value;
      let successCount = 0;
      const failedItems: string[] = [];

      try {
        const nextLevel = Number(parentNode.value.level || 1) + 1;
        const pid = Number(parentNode.value.id);
        const opsAdmins = parentNode.value.ops_admin_users || [];

        for (const item of targetItems) {
          try {
            await createStreeNode({
              title: item.currentTitle,
              desc: item.currentDesc,
              level: nextLevel,
              pId: pid,
              isLeaf: true,
              ops_admin_users: opsAdmins,
            });
            successCount++;
          } catch (e: any) {
            failedItems.push(item.currentTitle || item.label);
          }
        }

        if (successCount > 0) {
          if (failedItems.length === 0) {
            createMessage.success(`成功为【${parentNode.value.title}】初始化 ${successCount} 个标准架构节点！`);
          } else {
            createMessage.warning(`成功初始化 ${successCount} 个节点，${failedItems.length} 个节点失败(可能已存在同名节点)`);
          }
          closeModal();
          emit('success', { parentId: parentNode.value.id });
        } else {
          createMessage.error(`初始化失败，所选节点可能已全部存在同名记录`);
        }
      } finally {
        submitting.value = false;
      }
    };

    return {
      registerModal,
      parentNode,
      projectPrefix,
      submitting,
      activeCategoryKey,
      categoryTabs,
      selectedKeys,
      totalComponentCount,
      selectedComponentsList,
      handlePrefixChange,
      toggleComponent,
      selectRecommended,
      selectAll,
      clearAll,
      handleSubmit,
    };
  },
});
</script>

<style scoped>
:deep(.component-nav-tabs .ant-tabs-nav) {
  margin-bottom: 8px !important;
}

:deep(.component-nav-tabs .ant-tabs-tab) {
  padding: 4px 8px !important;
  font-size: 12px !important;
}
</style>
