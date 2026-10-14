<template>
  <PageWrapper :title="pageTitle" :content="pageSubtitle">
    <template #extra>
      <a-button type="primary" ghost preIcon="ant-design:redo-outlined" :loading="loading" @click="fetchData">
        刷新数据
      </a-button>
    </template>

    <!-- 1. 顶部 4 大指标卡片 (支持点击跳转至对应模块) -->
    <Row :gutter="16">
      <Col :md="6" :sm="12" :xs="24" v-for="item in cards" :key="item.title" class="!mb-4">
        <Card
          size="small"
          :loading="loading"
          :title="item.title"
          class="h-full hover:shadow-md transition-shadow duration-300 cursor-pointer"
          @click="handleNavigate(item.route)"
        >
          <template #extra>
            <Icon :icon="item.icon" :color="item.color" size="22" />
          </template>
          <div class="py-4 px-2 flex justify-between items-center">
            <CountTo
              :startVal="0"
              :endVal="Number(item.value) || 0"
              :suffix="item.suffix || ''"
              class="text-3xl font-bold"
            />
          </div>
          <div class="px-2 flex justify-between text-secondary text-xs">
            <span>{{ item.footerText }}</span>
            <span
              class="font-medium text-gray-700 dark:text-gray-300 transition-colors"
              :class="{ 'hover:text-blue-500 cursor-pointer underline': item.footerRoute }"
              @click.stop="item.footerRoute ? handleNavigate(item.footerRoute) : handleNavigate(item.route)"
            >
              {{ item.footerValue }}
            </span>
          </div>
        </Card>
      </Col>
    </Row>

    <!-- 2. 普通用户专属：研发常用高频快捷操作区 -->
    <Row :gutter="16" class="!mb-4" v-if="!isAdmin">
      <Col :span="24">
        <Card title="常用快捷操作" size="small" :loading="loading">
          <Row :gutter="16">
            <Col :md="6" :sm="12" :xs="24" v-for="act in quickActions" :key="act.title" class="!mb-2 md:!mb-0">
              <div
                class="p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-gray-800 transition-all cursor-pointer flex items-center gap-3"
                @click="handleNavigate(act.route)"
              >
                <div class="p-2 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Icon :icon="act.icon" :color="act.color" size="24" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold truncate text-gray-800 dark:text-gray-100">{{ act.title }}</div>
                  <div class="text-xs text-gray-400 truncate">{{ act.desc }}</div>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>

    <!-- 3. 管理员专属大盘：近 7 天流水线趋势折线图 + 环境资产分布饼图 -->
    <Row :gutter="16" class="!mb-4" v-if="isAdmin">
      <Col :md="16" :sm="24" :xs="24" class="!mb-4 md:!mb-0">
        <Card title="全平台流水线构建趋势 (近7天)" :loading="loading">
          <div ref="lineChartRef" :style="{ height: '320px', width: '100%' }"></div>
        </Card>
      </Col>
      <Col :md="8" :sm="24" :xs="24">
        <Card title="服务基线环境分布" :loading="loading">
          <div ref="pieChartRef" :style="{ height: '320px', width: '100%' }"></div>
        </Card>
      </Col>
    </Row>

    <!-- 4. 底部动态区：我的工单工作台 + 最近发布动态 -->
    <Row :gutter="16">
      <!-- 工单中心 (带 Tab: 待我审批 / 我发起的) -->
      <Col :md="14" :sm="24" :xs="24" class="!mb-4 md:!mb-0">
        <Card :loading="loading" :bodyStyle="{ paddingTop: '8px' }">
          <Tabs v-model:activeKey="activeOrderTab">
            <TabPane key="todo" :tab="`待我审批 (${myPendingTasks.length})`">
              <List item-layout="horizontal" :data-source="myPendingTasks">
                <template #renderItem="{ item }">
                  <ListItem class="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 px-2 rounded transition-colors">
                    <ListItemMeta :title="item.title" :description="item.desc">
                      <template #avatar>
                        <Icon icon="ant-design:schedule-outlined" color="#faad14" size="26" class="mt-1" />
                      </template>
                    </ListItemMeta>
                    <div class="flex items-center gap-2">
                      <Tag color="orange">{{ item.status }}</Tag>
                      <a-button type="link" size="small" @click="handleNavigate(item.route)">去处理</a-button>
                    </div>
                  </ListItem>
                </template>
                <template #empty>
                  <Empty description="暂无待审批工单，一切井然有序" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
                </template>
              </List>
            </TabPane>

            <TabPane key="mine" :tab="`我发起的 (${myAppliedOrders.length})`">
              <List item-layout="horizontal" :data-source="myAppliedOrders">
                <template #renderItem="{ item }">
                  <ListItem class="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 px-2 rounded transition-colors">
                    <ListItemMeta :title="item.title" :description="item.desc">
                      <template #avatar>
                        <Icon icon="ant-design:audit-outlined" color="#1890ff" size="26" class="mt-1" />
                      </template>
                    </ListItemMeta>
                    <div class="flex items-center gap-2">
                      <Tag :color="getOrderStatusColor(item.status)">{{ item.status }}</Tag>
                      <a-button type="link" size="small" @click="handleNavigate(item.route)">详情</a-button>
                    </div>
                  </ListItem>
                </template>
                <template #empty>
                  <Empty description="暂无发起的工单" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
                </template>
              </List>
            </TabPane>
          </Tabs>
        </Card>
      </Col>

      <!-- 最近发布动态 -->
      <Col :md="10" :sm="24" :xs="24">
        <Card title="服务基线近期构建发布" :loading="loading">
          <List item-layout="horizontal" :data-source="recentActivities">
            <template #renderItem="{ item }">
              <ListItem class="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 px-2 rounded transition-colors">
                <ListItemMeta :title="item.title" :description="item.time">
                  <template #avatar>
                    <Icon :icon="item.icon" :color="item.color" size="24" class="mt-1" />
                  </template>
                </ListItemMeta>
                <Tag :color="item.status === '成功' ? 'green' : item.status === '失败' ? 'red' : 'blue'">
                  {{ item.status }}
                </Tag>
              </ListItem>
            </template>
            <template #empty>
              <Empty description="暂无近期构建发布记录" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
            </template>
          </List>
        </Card>
      </Col>
    </Row>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed, Ref } from 'vue';
  import { Row, Col, Card, List, ListItem, ListItemMeta, Tabs, TabPane, Tag, Empty, Button as AButton } from 'ant-design-vue';
  import { PageWrapper } from '@/components/Page';
  import { CountTo } from '@/components/CountTo';
  import Icon from '@/components/Icon/Icon.vue';
  import { useECharts } from '@/hooks/web/useECharts';
  import { useGo } from '@/hooks/web/usePage';
  import { useUserStore } from '@/store/modules/user';
  import {
    getDashboardOverviewData,
    DashboardCardItem,
    DashboardTaskItem,
    DashboardActivityItem,
    DashboardQuickAction,
  } from '@/api/dashboard';

  const go = useGo();
  const userStore = useUserStore();

  const loading = ref(true);
  const isAdmin = ref(false);
  const activeOrderTab = ref('todo');

  const cards = ref<DashboardCardItem[]>([]);
  const myPendingTasks = ref<DashboardTaskItem[]>([]);
  const myAppliedOrders = ref<DashboardTaskItem[]>([]);
  const recentActivities = ref<DashboardActivityItem[]>([]);
  const quickActions = ref<DashboardQuickAction[]>([]);

  const lineChartRef = ref<HTMLDivElement | null>(null);
  const pieChartRef = ref<HTMLDivElement | null>(null);
  const { setOptions: setLineOptions } = useECharts(lineChartRef as Ref<HTMLDivElement>);
  const { setOptions: setPieOptions } = useECharts(pieChartRef as Ref<HTMLDivElement>);

  const currentUser = computed(() => userStore.getUserInfo?.realName || userStore.getUserInfo?.username || '工程师');
  const pageTitle = computed(() => `工作台 - 欢迎回来，${currentUser.value}`);
  const pageSubtitle = computed(() =>
    isAdmin.value
      ? '全平台运维与效能总览：实时跟踪资产水位、告警风险与流水线作业。'
      : '专属交付工作台：聚焦处理您的待办审批、跟进发版进度与常用操作。',
  );

  function handleNavigate(route?: string) {
    if (!route) return;
    let targetRoute = route;
    // 兼容映射：将工作台可能收到的 /workorder/instance 映射至系统真实路由 /workOrder/search
    if (targetRoute.toLowerCase().includes('/workorder/instance')) {
      if (targetRoute.includes('tab=approval')) {
        targetRoute = '/workOrder/search?queryModel=Approval';
      } else if (targetRoute.includes('tab=mine')) {
        targetRoute = '/workOrder/search?queryModel=mine';
      } else if (targetRoute.includes('tab=all')) {
        targetRoute = '/workOrder/ticket';
      } else {
        targetRoute = '/workOrder/search';
      }
    }
    // 兼容映射：将工作台可能收到的 /resource/ecs 映射至系统真实路由 /serviceTree/streeAsync
    if (targetRoute.includes('/resource/ecs') || targetRoute === '/resource') {
      targetRoute = '/serviceTree/streeAsync';
    }
    go(targetRoute);
  }

  function getOrderStatusColor(status: string) {
    if (status === '已通过' || status === '已完成') return 'green';
    if (status === '审批中') return 'orange';
    if (status === '已驳回' || status === '已终止') return 'red';
    return 'default';
  }

  async function fetchData() {
    loading.value = true;
    try {
      const res = await getDashboardOverviewData();
      if (res) {
        isAdmin.value = !!res.isAdmin;
        cards.value = res.cards || [];
        myPendingTasks.value = res.myPendingTasks || [];
        myAppliedOrders.value = res.myAppliedOrders || [];
        recentActivities.value = res.recentActivities || [];
        quickActions.value = res.quickActions || [];

        // 仅管理员渲染宏观趋势图
        if (res.isAdmin && res.trendChart) {
          setTimeout(() => {
            setLineOptions({
              tooltip: { trigger: 'axis' },
              legend: { data: ['构建触发', '成功交付'] },
              grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
              xAxis: {
                type: 'category',
                boundaryGap: false,
                data: res.trendChart.dates || [],
              },
              yAxis: { type: 'value', minInterval: 1 },
              series: [
                {
                  name: '构建触发',
                  type: 'line',
                  smooth: true,
                  data: res.trendChart.buildCounts || [],
                  itemStyle: { color: '#1890ff' },
                  areaStyle: {
                    color: {
                      type: 'linear',
                      x: 0,
                      y: 0,
                      x2: 0,
                      y2: 1,
                      colorStops: [
                        { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                        { offset: 1, color: 'rgba(24, 144, 255, 0.01)' },
                      ],
                    },
                  },
                },
                {
                  name: '成功交付',
                  type: 'line',
                  smooth: true,
                  data: res.trendChart.successCounts || [],
                  itemStyle: { color: '#52c41a' },
                },
              ],
            });

            if (res.envDistribution && res.envDistribution.length > 0) {
              setPieOptions({
                tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
                legend: { bottom: '5%', left: 'center' },
                series: [
                  {
                    name: '环境服务占比',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                      borderRadius: 8,
                      borderColor: '#fff',
                      borderWidth: 2,
                    },
                    label: { show: false, position: 'center' },
                    emphasis: {
                      label: { show: true, fontSize: '14', fontWeight: 'bold' },
                    },
                    data: res.envDistribution,
                  },
                ],
              });
            }
          }, 100);
        }
      }
    } catch (err) {
      console.error('获取工作台数据失败:', err);
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    fetchData();
  });
</script>