<template>
  <PageWrapper title="工作台" content="欢迎回来，这里汇聚了全平台的交付流水线与效能大盘状态。">
    <Row :gutter="16">
      <Col :md="6" :sm="24" :xs="24" v-for="item in growCardList" :key="item.title" class="!mb-4">
        <Card size="small" :loading="loading" :title="item.title" class="h-full">
          <template #extra>
            <Icon :icon="item.icon" :color="item.color" size="20" />
          </template>
          <div class="py-4 px-2 flex justify-between items-center">
            <CountTo
              :startVal="0"
              :endVal="item.value"
              :suffix="item.suffix"
              class="text-3xl font-bold"
            />
          </div>
          <div class="px-2 flex justify-between text-secondary">
            <span>{{ item.footerText }}</span>
            <span>{{ item.footerValue }}</span>
          </div>
        </Card>
      </Col>
    </Row>

    <Row :gutter="16" class="!mb-4">
      <Col :md="16" :sm="24" :xs="24" class="!mb-4 md:!mb-0">
        <Card title="流水线构建趋势 (近7天)" :loading="loading">
          <div ref="lineChartRef" :style="{ height: '320px', width: '100%' }"></div>
        </Card>
      </Col>
      <Col :md="8" :sm="24" :xs="24">
        <Card title="DORA 效能健康度" :loading="loading">
          <div ref="radarChartRef" :style="{ height: '320px', width: '100%' }"></div>
        </Card>
      </Col>
    </Row>

    <Row :gutter="16">
      <Col :md="12" :sm="24" :xs="24" class="!mb-4 md:!mb-0">
        <Card title="最近发布动态" :loading="loading">
          <List item-layout="horizontal" :data-source="activityList">
            <template #renderItem="{ item }">
              <ListItem>
                <ListItemMeta :title="item.title" :description="item.time">
                  <template #avatar>
                    <Icon :icon="item.icon" :color="item.color" size="30" />
                  </template>
                </ListItemMeta>
                <div :class="item.status === '成功' ? 'text-green-500' : 'text-red-500'">
                  {{ item.status }}
                </div>
              </ListItem>
            </template>
          </List>
        </Card>
      </Col>
      <Col :md="12" :sm="24" :xs="24">
        <Card title="我的待办工单" :loading="loading">
          <List item-layout="horizontal" :data-source="taskList">
            <template #renderItem="{ item }">
              <ListItem>
                <ListItemMeta :title="item.title" :description="item.desc">
                  <template #avatar>
                    <Icon icon="ant-design:schedule-outlined" color="#1890ff" size="30" />
                  </template>
                </ListItemMeta>
                <a-button type="link">去处理</a-button>
              </ListItem>
            </template>
          </List>
        </Card>
      </Col>
    </Row>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { ref, onMounted, Ref } from 'vue';
  import { Row, Col, Card, List, ListItem, ListItemMeta } from 'ant-design-vue';
  import { PageWrapper } from '@/components/Page';
  import { CountTo } from '@/components/CountTo';
  import Icon from '@/components/Icon/Icon.vue';
  // Vben 内置的 Echarts Hook (根据你实际的文件结构调整路径，通常在 hooks/web 下)
  import { useECharts } from '@/hooks/web/useECharts';

  const loading = ref(true);

  // --- 模拟顶部卡片数据 ---
  const growCardList = ref([
    { title: '待办审批工单', icon: 'ant-design:file-done-outlined', value: 12, color: '#faad14', footerText: '今日新增', footerValue: '+3', suffix: '' },
    { title: '运行中流水线', icon: 'ant-design:rocket-outlined', value: 8, color: '#1890ff', footerText: '排队中', footerValue: '2', suffix: '' },
    { title: '今日发布成功率', icon: 'ant-design:check-circle-outlined', value: 98.5, color: '#52c41a', footerText: '总发布单', footerValue: '45', suffix: '%' },
    { title: '阻断级漏洞', icon: 'ant-design:bug-outlined', value: 3, color: '#ff4d4f', footerText: '相较上周', footerValue: '-2', suffix: '' },
  ]);

  // --- 初始化图表 ---
  const lineChartRef = ref<HTMLDivElement | null>(null);
  const radarChartRef = ref<HTMLDivElement | null>(null);
  const { setOptions: setLineOptions } = useECharts(lineChartRef as Ref<HTMLDivElement>);
  const { setOptions: setRadarOptions } = useECharts(radarChartRef as Ref<HTMLDivElement>);

  // --- 模拟底部列表数据 ---
  const activityList = ref([
    { title: '用户中心网关服务部署 Prod', time: '刚刚', icon: 'ant-design:cloud-upload-outlined', color: '#52c41a', status: '成功' },
    { title: '支付中台核心链路部署 Staging', time: '1小时前', icon: 'ant-design:warning-outlined', color: '#ff4d4f', status: '回滚' },
    { title: '订单微服务基线配置更新', time: '2小时前', icon: 'ant-design:sliders-outlined', color: '#1890ff', status: '成功' },
  ]);

  const taskList = ref([
    { title: 'PROD-20260716-001', desc: '申请发布: 营销活动服务微服务版本升级' },
    { title: 'SEC-20260716-012', desc: '处理漏洞: 发现 Fastjson 反序列化高危漏洞' },
    { title: 'ENV-20260715-008', desc: '配置变更: 增加 Redis 集群最大连接数' },
  ]);

  onMounted(() => {
    // 模拟接口请求延迟
    setTimeout(() => {
      loading.value = false;

      // 渲染流水线趋势折线图
      setLineOptions({
        tooltip: { trigger: 'axis' },
        legend: { data: ['构建次数', '发布次数'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
        yAxis: { type: 'value' },
        series: [
          { name: '构建次数', type: 'line', smooth: true, data: [120, 132, 101, 134, 90, 230, 210], itemStyle: { color: '#1890ff' } },
          { name: '发布次数', type: 'line', smooth: true, data: [20, 32, 11, 34, 9, 30, 20], itemStyle: { color: '#52c41a' } },
        ],
      });

      // 渲染 DORA 指标雷达图
      setRadarOptions({
        legend: { bottom: 0, data: ['团队平均水平', '行业标杆'] },
        radar: {
          indicator: [
            { name: '部署频率', max: 100 },
            { name: '交付周期', max: 100 },
            { name: '服务恢复(MTTR)', max: 100 },
            { name: '变更失败率', max: 100 },
            { name: '测试覆盖率', max: 100 },
          ],
        },
        series: [
          {
            type: 'radar',
            data: [
              { value: [70, 80, 95, 90, 85], name: '团队平均水平' },
              { value: [90, 90, 90, 90, 90], name: '行业标杆' },
            ],
          },
        ],
      });
    }, 800);
  });
</script>