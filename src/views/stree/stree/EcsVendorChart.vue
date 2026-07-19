<template>
  <div class="ecs-summary-wrapper w-full h-full flex flex-col">
    
    <!-- 顶部数据卡片 (直接使用计算属性) -->
    <div class="flex gap-4 mb-4">
      <div class="flex-1 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-md border border-blue-100 dark:border-blue-900/30">
        <div class="text-gray-500 dark:text-gray-400 text-sm mb-1">总 CPU (核)</div>
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ totalCpu }}</div>
      </div>
      <div class="flex-1 bg-green-50/50 dark:bg-green-950/20 p-4 rounded-md border border-green-100 dark:border-green-900/30">
        <div class="text-gray-500 dark:text-gray-400 text-sm mb-1">总内存 (GB)</div>
        <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ totalMemoryGB }}</div>
      </div>
      <div class="flex-1 bg-orange-50/50 dark:bg-orange-950/20 p-4 rounded-md border border-orange-100 dark:border-orange-900/30">
        <div class="text-gray-500 dark:text-gray-400 text-sm mb-1">总磁盘 (GB)</div>
        <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ totalDiskGB }}</div>
      </div>
    </div>

    <!-- 组合图表容器 -->
    <div class="echarts-box flex-1 w-full relative">
      <div ref="chartRef" style="width: 100%; height: 300px;"></div>
    </div>
    
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import * as echarts from 'echarts';
import { useAppStore } from '@/store/modules/app';

const props = defineProps({
  node: {
    type: Object,
    default: () => ({})
  }
});

const appStore = useAppStore();
const isDark = computed(() => appStore.getDarkMode === 'dark');

const titleColor = computed(() => isDark.value ? '#c9d1d9' : '#333');
const labelColor = computed(() => isDark.value ? '#8b949e' : '#666');
const splitLineColor = computed(() => isDark.value ? '#30363d' : '#eee');
const axisLineColor = computed(() => isDark.value ? '#30363d' : '#999');

// 🌟 核心优化：直接使用 computed 从后端的 node 数据中提取统计值，快如闪电！
const totalCpu = computed(() => props.node?.ecsCpuTotal || 0);
const totalDiskGB = computed(() => props.node?.ecsDiskTotal || 0);
const totalMemoryGB = computed(() => props.node?.ecsMemoryTotal || 0);

const chartRef = ref<HTMLElement | null>(null);
let myChart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

// 格式化后端传来的图表数据并渲染
const renderEcharts = () => {
  if (!chartRef.value || !props.node) return;
  if (!myChart) myChart = echarts.init(chartRef.value);

  const vendorMap: Record<string, string> = { aliyun: '阿里云', aws: 'AWS', tencent: '腾讯云', huawei: '华为云' };
  const vendorData = (props.node.groupByVendor || []).map((item: any) => ({
    name: vendorMap[item.name] || item.name || '未知',
    value: item.value || 0
  }));

  const zoneData = (props.node.groupByZoneId || []).map((item: any) => ({
    name: item.name || '未知',
    value: item.value || 0
  }));

  const osKeys = [...(props.node.groupByOSNameOrderKeys || [])].reverse();
  const osVals = [...(props.node.groupByOSNameOrderValues || [])].reverse();

  if (vendorData.length === 0) vendorData.push({ name: '暂无数据', value: 0 });
  if (zoneData.length === 0) zoneData.push({ name: '暂无数据', value: 0 });

  myChart.clear();

  const option = {
    title: [
      { text: 'ECS厂商占比', left: '2%', top: '2%', textStyle: { color: titleColor.value, fontSize: 15 } },
      { text: '操作系统分布 (TOP)', left: '55%', top: '2%', textStyle: { color: titleColor.value, fontSize: 15 } },
      { text: '可用区分布', left: '2%', top: '53%', textStyle: { color: titleColor.value, fontSize: 15 } },
    ],
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} 台' },
    grid: [{ left: '55%', top: '12%', width: '40%', height: '80%', containLabel: true }],
    xAxis: [{ type: 'value', splitLine: { lineStyle: { type: 'dashed', color: splitLineColor.value } }, axisLabel: { show: false } }],
    yAxis: [
      {
        type: 'category',
        data: osKeys,
        axisLabel: {
          color: labelColor.value,
          formatter: (value: string) => value.length > 18 ? value.substring(0, 18) + '...' : value
        },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: axisLineColor.value } },
      }
    ],
    color: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#eb2f96'],
    series: [
      {
        name: '厂商占比',
        type: 'pie',
        radius: ['22%', '38%'],
        center: ['22%', '28%'], 
        data: vendorData,
        label: { formatter: '{b}\n{c}台', color: labelColor.value },
      },
      {
        name: '可用区分布',
        type: 'pie',
        radius: ['22%', '38%'],
        center: ['22%', '78%'], 
        data: zoneData,
        label: { formatter: '{b}\n{c}台', color: labelColor.value },
      },
      {
        name: '操作系统',
        type: 'bar',
        barMaxWidth: 30,
        itemStyle: { borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: labelColor.value },
        data: osVals,
      }
    ]
  };

  myChart.setOption(option);
};

const resizeChart = () => myChart?.resize();

watch(() => props.node, () => {
  nextTick(() => {
    renderEcharts();
  });
}, { deep: true });

watch(isDark, () => {
  renderEcharts();
});

onMounted(async () => {
  await nextTick();
  renderEcharts();

  window.addEventListener('resize', resizeChart);
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => resizeChart());
    resizeObserver.observe(chartRef.value);
  }
});
onUnmounted(() => {
  window.removeEventListener('resize', resizeChart);
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
  myChart?.dispose();
});
</script>