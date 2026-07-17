<template>
  <div class="ecs-summary-wrapper w-full h-full flex flex-col">
    
    <!-- 顶部数据卡片 (直接使用计算属性) -->
    <div class="flex gap-4 mb-4">
      <div class="flex-1 bg-blue-50 p-4 rounded-md border border-blue-100">
        <div class="text-gray-500 text-sm mb-1">总 CPU (核)</div>
        <div class="text-2xl font-bold text-blue-600">{{ totalCpu }}</div>
      </div>
      <div class="flex-1 bg-green-50 p-4 rounded-md border border-green-100">
        <div class="text-gray-500 text-sm mb-1">总内存 (GB)</div>
        <div class="text-2xl font-bold text-green-600">{{ totalMemoryGB }}</div>
      </div>
      <div class="flex-1 bg-orange-50 p-4 rounded-md border border-orange-100">
        <div class="text-gray-500 text-sm mb-1">总磁盘 (GB)</div>
        <div class="text-2xl font-bold text-orange-600">{{ totalDiskGB }}</div>
      </div>
    </div>

    <!-- 组合图表容器 -->
    <div class="echarts-box flex-1 w-full relative">
      <div ref="chartRef" style="width: 100%; height: 500px;"></div>
    </div>
    
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import * as echarts from 'echarts';
// 🌟 删除了无用的 fetchResourceByNode 接口引入

const props = defineProps({
  node: {
    type: Object,
    default: () => ({})
  }
});

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
      { text: 'ECS厂商占比', left: '2%', top: '2%', textStyle: { color: '#333', fontSize: 15 } },
      { text: '操作系统分布 (TOP)', left: '55%', top: '2%', textStyle: { color: '#333', fontSize: 15 } },
      { text: '可用区分布', left: '2%', top: '53%', textStyle: { color: '#333', fontSize: 15 } },
    ],
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} 台' },
    grid: [{ left: '55%', top: '12%', width: '40%', height: '80%', containLabel: true }],
    xAxis: [{ type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#eee' } },axisLabel: { show: false } }],
    yAxis: [
      {
        type: 'category',
        data: osKeys,
        axisLabel: {
          formatter: (value: string) => value.length > 18 ? value.substring(0, 18) + '...' : value
        },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#999' } },
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
        label: { formatter: '{b}\n{c}台', color: '#666' },
      },
      {
        name: '可用区分布',
        type: 'pie',
        radius: ['22%', '38%'],
        center: ['22%', '78%'], 
        data: zoneData,
        label: { formatter: '{b}\n{c}台', color: '#666' },
      },
      {
        name: '操作系统',
        type: 'bar',
        barMaxWidth: 30,
        itemStyle: { borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: '#666' },
        data: osVals,
      }
    ]
  };

  myChart.setOption(option);
};

const resizeChart = () => myChart?.resize();

// 🌟 精简：现在只需要监听 node 变化，直接无脑重新画图即可！
// 因为所有数据（包括图表和顶部CPU统计）都已经是后端计算好直接传过来的了。
watch(() => props.node, () => {
  nextTick(() => {
    renderEcharts();
  });
}, { deep: true });

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