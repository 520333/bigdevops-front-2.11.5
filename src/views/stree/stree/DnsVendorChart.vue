<template>
  <div class="dns-summary-wrapper w-full h-full flex flex-col">
    <div class="flex gap-4 mb-4">
      <div class="flex-1 bg-cyan-50/50 dark:bg-cyan-950/20 p-4 rounded-md border border-cyan-100 dark:border-cyan-900/30">
        <div class="text-gray-500 dark:text-gray-400 text-sm mb-1">DNS 记录总数 (条)</div>
        <div class="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{{ totalDnsNum }}</div>
      </div>
      <div class="flex-1"></div>
    </div>
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
  node: { type: Object, default: () => ({}) }
});

const appStore = useAppStore();
const isDark = computed(() => appStore.getDarkMode === 'dark');

const titleColor = computed(() => isDark.value ? '#c9d1d9' : '#333');
const labelColor = computed(() => isDark.value ? '#8b949e' : '#666');
const splitLineColor = computed(() => isDark.value ? '#30363d' : '#eee');
const axisLineColor = computed(() => isDark.value ? '#30363d' : '#999');

const totalDnsNum = computed(() => props.node?.dnsNum || 0);

const chartRef = ref<HTMLElement | null>(null);
let myChart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

const renderEcharts = () => {
  if (!chartRef.value || !props.node) return;
  if (!myChart) myChart = echarts.init(chartRef.value);

  // 1. 厂商分布数据
  const vendorMap: Record<string, string> = { godaddy: 'GoDaddy', dynadot: 'Dynadot' };
  const vendorData = (props.node.groupByVendorDns || []).map((item: any) => ({
    name: vendorMap[item.name] || item.name || '未知',
    value: item.value || 0
  }));

  // 2. 记录类型分布
  const typeKeys = [...(props.node.groupByDnsTypeKeys || [])].reverse();
  const typeVals = [...(props.node.groupByDnsTypeValues || [])].reverse();

  if (vendorData.length === 0) vendorData.push({ name: '暂无数据', value: 0 });
  if (typeKeys.length === 0) { typeKeys.push('暂无'); typeVals.push(0); }

  myChart.clear();

  const option = {
    title: [
      { text: 'DNS 提供商占比', left: '10%', top: '2%', textStyle: { color: titleColor.value, fontSize: 15 } },
      { text: '解析记录类型分布', left: '60%', top: '2%', textStyle: { color: titleColor.value, fontSize: 15 } },
    ],
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} 条' },
    grid: [{ left: '60%', top: '15%', width: '35%', height: '70%', containLabel: true }],
    xAxis: [{ type: 'value', splitLine: { lineStyle: { type: 'dashed', color: splitLineColor.value } }, axisLabel: { show: false } }],
    yAxis: [
      {
        type: 'category',
        data: typeKeys,
        axisLabel: {
          color: labelColor.value
        },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: axisLineColor.value } },
      }
    ],
    color: ['#13c2c2', '#eb2f96', '#faad14', '#1890ff'],
    series: [
      {
        name: '提供商占比',
        type: 'pie',
        radius: ['35%', '55%'],
        center: ['22%', '50%'], 
        data: vendorData,
        label: { formatter: '{b}\n{c}条', color: labelColor.value },
      },
      {
        name: '记录类型',
        type: 'bar',
        barMaxWidth: 30,
        itemStyle: { 
          borderRadius: [0, 4, 4, 0],
          color: (params: any) => ['#13c2c2', '#eb2f96', '#faad14'][params.dataIndex % 3]
        },
        label: { show: true, position: 'right', color: labelColor.value },
        data: typeVals,
      }
    ]
  };
  myChart.setOption(option);
};

const resizeChart = () => myChart?.resize();

watch(() => props.node, () => nextTick(() => renderEcharts()), { deep: true });

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