<template>
  <div class="p-4 bg-[#f0f2f5] dark:bg-[#121212] min-h-screen">
    <!-- 面包屑导航 -->
    <div class="mb-3 text-xs text-gray-400 flex items-center gap-1.5">
      <span>持续交付</span>
      <span>/</span>
      <span>发布单管理</span>
      <span>/</span>
      <span class="text-gray-600 dark:text-gray-300 font-medium">发布单详情</span>
    </div>

    <!-- 主卡片容器 -->
    <div class="bg-white dark:bg-[#1e1e1e] rounded shadow-sm border border-gray-100 dark:border-zinc-800 p-6">
      <!-- 1. 顶部标题与操作按钮 -->
      <div class="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
        <div class="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-wide">
          {{ planData.title }}
        </div>
        <div class="flex items-center gap-2">
          <Button type="primary" ghost class="!border-blue-400 !text-blue-500 hover:!bg-blue-50" @click="handleReview">
            发起评审
          </Button>
          <Button type="primary" class="!bg-blue-600 !border-blue-600" @click="handleTagging">
            打标
          </Button>
          <Dropdown>
            <template #overlay>
              <Menu>
                <Menu.Item key="1" @click="handleSaveDraft">保存草稿</Menu.Item>
                <Menu.Item key="2" @click="handleExport">导出发布单</Menu.Item>
                <Menu.Item key="3" danger @click="handleCancelRelease">废弃/终止</Menu.Item>
              </Menu>
            </template>
            <Button type="primary" class="!bg-blue-600 !border-blue-600">
              更多
              <DownOutlined />
            </Button>
          </Dropdown>
        </div>
      </div>

      <!-- 2. 基础信息区域 (两列/三列精简排版，还原真实平台) -->
      <div class="py-4 border-b border-gray-100 dark:border-zinc-800 text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
        <div class="font-bold text-gray-800 dark:text-gray-200 text-sm mb-3">
          基础信息
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2.5 gap-x-8">
          <div class="flex items-center">
            <span class="text-gray-400 w-24">计划发布日期</span>
            <span class="text-gray-800 dark:text-gray-200 font-medium">{{ planData.planDate }}</span>
          </div>
          <div class="flex items-center">
            <span class="text-gray-400 w-20">发布类型</span>
            <span class="text-gray-800 dark:text-gray-200 font-medium">{{ planData.releaseType }}</span>
          </div>
          <div class="flex items-center">
            <span class="text-gray-400 w-20">发布环境</span>
            <span class="text-gray-800 dark:text-gray-200 font-medium">{{ planData.env }}</span>
          </div>
          <div class="flex items-center">
            <span class="text-gray-400 w-24">创建时间</span>
            <span class="text-gray-800 dark:text-gray-200 font-medium">{{ planData.createTime }}</span>
          </div>
          <div class="flex items-center">
            <span class="text-gray-400 w-20">创建者</span>
            <span class="text-gray-800 dark:text-gray-200 font-medium">{{ planData.creator }}</span>
          </div>
          <div class="flex items-center">
            <span class="text-gray-400 w-20">当前状态</span>
            <span class="px-2 py-0.5 text-xs rounded bg-[#fff7e6] text-[#fa8c16] border border-[#ffd591] font-medium">
              {{ planData.status }}
            </span>
          </div>
        </div>
      </div>

      <!-- 3. Tab 选项卡 (line 风格，紧贴原型) -->
      <div class="pt-2">
        <Tabs v-model:activeKey="activeTabKey" type="line" class="custom-release-tabs">
          <!-- 1. 发布方案描述 -->
          <TabPane key="plan" tab="发布方案描述">
            <TabReleasePlan v-model="planData" />
          </TabPane>

          <!-- 2. 需求/BUG列表 -->
          <TabPane key="demands" tab="需求/BUG列表">
            <TabDemandBug v-model="demandBugList" />
          </TabPane>

          <!-- 3. 应用清单 (带红点或激活指示) -->
          <TabPane key="apps">
            <template #tab>
              <span class="relative font-medium">
                应用清单
                <span class="inline-block w-1.5 h-1.5 rounded-full bg-red-500 absolute -top-0.5 -right-2"></span>
              </span>
            </template>
            <TabAppList v-model="appList" />
          </TabPane>

          <!-- 4. NACOS列表 -->
          <TabPane key="nacos">
            <template #tab>
              <span class="relative">
                NACOS列表
                <span class="text-red-500 font-bold ml-0.5">*</span>
              </span>
            </template>
            <TabNacosList v-model="nacosList" />
          </TabPane>

          <!-- 5. SQL列表 -->
          <TabPane key="sql" tab="SQL列表">
            <TabSqlList v-model="sqlList" />
          </TabPane>

          <!-- 6. ES列表 -->
          <TabPane key="es" tab="ES列表">
            <div class="py-12 text-center text-gray-400 text-sm">
              <Empty description="暂无关联的 Elasticsearch 索引变更" />
            </div>
          </TabPane>

          <!-- 7. MQ列表 -->
          <TabPane key="mq" tab="MQ列表">
            <div class="py-12 text-center text-gray-400 text-sm">
              <Empty description="暂无关联的 RocketMQ / Kafka Topic 队列变更" />
            </div>
          </TabPane>

          <!-- 8. 测试报告 -->
          <TabPane key="test" tab="测试报告">
            <div class="py-8 px-4 space-y-4">
              <div class="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded">
                <div class="font-bold text-green-700 dark:text-green-300">测试结论：准予预生产与生产发版</div>
                <div class="text-xs text-green-600 dark:text-green-400 mt-1">
                  自动化用例 188 项全部通过，覆盖率 91.4%，核心惩戒黑名单拦截压测 15,000 QPS RT &lt; 20ms。
                </div>
              </div>
            </div>
          </TabPane>

          <!-- 9. 附件 -->
          <TabPane key="attachment" tab="附件">
            <div class="py-12 text-center text-gray-400 text-sm">
              <Empty description="暂无关联附件材料" />
            </div>
          </TabPane>

          <!-- 10. 变更记录 -->
          <TabPane key="history" tab="变更记录">
            <div class="py-6 px-4">
              <Timeline>
                <Timeline.Item color="green">
                  <p class="text-xs text-gray-500">2025-03-06 09:37:55 - 市研-陈迎</p>
                  <p class="text-sm font-medium">创建发布单【预生产惩戒黑名单查询改造】并关联 user-mr-data 迭代应用</p>
                </Timeline.Item>
                <Timeline.Item color="blue">
                  <p class="text-xs text-gray-500">2025-03-06 10:15:20 - 自动化流水线</p>
                  <p class="text-sm font-medium">完成测试完成基线 tag 打包: user-mr-data-20250304090001</p>
                </Timeline.Item>
              </Timeline>
            </div>
          </TabPane>

          <!-- 11. 评审单详情 -->
          <TabPane key="review" tab="评审单详情">
            <div class="py-12 text-center text-gray-400 text-sm">
              <Empty description="暂无评审单详情或待评审人签字" />
            </div>
          </TabPane>
        </Tabs>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, reactive } from 'vue';
  import {
    Tabs,
    TabPane,
    Button,
    Dropdown,
    Menu,
    Timeline,
    Empty,
    Modal,
    message,
  } from 'ant-design-vue';
  import {
    DownOutlined,
  } from '@ant-design/icons-vue';
  import TabReleasePlan from './components/TabReleasePlan.vue';
  import TabDemandBug from './components/TabDemandBug.vue';
  import TabAppList from './components/TabAppList.vue';
  import TabNacosList from './components/TabNacosList.vue';
  import TabSqlList from './components/TabSqlList.vue';
  import {
    initialReleasePlan,
    initialDemandBugs,
    initialApps,
    initialNacosConfigs,
    initialSqlWorkflows,
  } from './release.data';
  import type { ReleasePlan, DemandBugItem, ReleaseAppItem, NacosConfigItem, SqlWorkflowItem } from './types';

  defineOptions({ name: 'ReleaseWorkOrder' });

  // 默认直接定位在用户截图中的【应用清单】Tab
  const activeTabKey = ref('apps');

  const planData = reactive<ReleasePlan>({ ...initialReleasePlan });
  const demandBugList = reactive<DemandBugItem[]>([...initialDemandBugs]);
  const appList = reactive<ReleaseAppItem[]>([...initialApps]);
  const nacosList = reactive<NacosConfigItem[]>([...initialNacosConfigs]);
  const sqlList = reactive<SqlWorkflowItem[]>([...initialSqlWorkflows]);

  const handleReview = () => {
    Modal.confirm({
      title: '发起发布单评审',
      content: '系统将向架构组、DBA及业务负责人发送发版评审通知，是否确认发起？',
      onOk: () => {
        message.success('已成功发起发版评审！');
      },
    });
  };

  const handleTagging = () => {
    message.info('正在为当前迭代关联的代码分支生成发布 Release Tag...');
    setTimeout(() => {
      message.success('代码基线与 Release Tag 打标完成！');
    }, 1000);
  };

  const handleSaveDraft = () => {
    message.success('发布工单已保存！');
  };

  const handleExport = () => {
    message.success('发布单概要及清单已导出！');
  };

  const handleCancelRelease = () => {
    Modal.confirm({
      title: '确认废弃或终止发布单？',
      content: '操作后该发布单将进入终止状态，不可撤销。',
      okType: 'danger',
      onOk: () => {
        planData.status = '已终止';
        message.warning('该发布单已被终止！');
      },
    });
  };
</script>

<style scoped>
  :deep(.custom-release-tabs .ant-tabs-nav) {
    margin-bottom: 12px;
  }
  :deep(.custom-release-tabs .ant-tabs-tab) {
    padding: 12px 16px;
    font-size: 13.5px;
  }
  :deep(.custom-release-tabs .ant-tabs-ink-bar) {
    background-color: #1890ff;
    height: 3px;
  }
</style>
