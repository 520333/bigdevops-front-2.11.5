<template>
  <div class="rds-summary-wrapper w-full h-full flex flex-col mt-4">
    
    <div class="flex gap-4 mb-4">
      <div class="flex-1 bg-green-50/50 dark:bg-green-950/20 p-4 rounded-md border border-green-100 dark:border-green-900/30">
        <div class="text-gray-500 dark:text-gray-400 text-sm mb-1">RDS 总数 (个)</div>
        <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ totalRdsNum }}</div>
      </div>
      <div class="flex-1 bg-teal-50/50 dark:bg-teal-950/20 p-4 rounded-md border border-teal-100 dark:border-teal-900/30">
        <div class="text-gray-500 dark:text-gray-400 text-sm mb-1">数据库引擎种类</div>
        <div class="text-2xl font-bold text-teal-600 dark:text-teal-400">{{ engineTypeCount }}</div>
      </div>
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

// 计算属性提取后端数据
const totalRdsNum = computed(() => props.node?.rdsNum || 0);
const engineTypeCount = computed(() => (props.node?.groupByRdsEngineKeys || []).length);

const chartRef = ref<HTMLElement | null>(null);
let myChart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

const renderEcharts = () => {
  if (!chartRef.value || !props.node) return;
  if (!myChart) myChart = echarts.init(chartRef.value);

  // 1. 厂商分布数据
  const vendorMap: Record<string, string> = { aliyun: '阿里云', aws: 'AWS', tencent: '腾讯云', huawei: '华为云' };
  const vendorData = (props.node.groupByVendorRds || []).map((item: any) => ({
    name: vendorMap[item.name] || item.name || '未知',
    value: item.value || 0
  }));

  // 2. 数据库引擎类型 (mysql, postgresql 等) 分布
  const engineKeys = [...(props.node.groupByRdsEngineKeys || [])].reverse();
  const engineVals = [...(props.node.groupByRdsEngineValues || [])].reverse();

  // 空状态兜底
  if (vendorData.length === 0) vendorData.push({ name: '暂无数据', value: 0 });
  if (engineKeys.length === 0) {
    engineKeys.push('暂无');
    engineVals.push(0);
  }

  myChart.clear();

  const option = {
    title: [
      { text: 'RDS 厂商占比', left: '10%', top: '2%', textStyle: { color: titleColor.value, fontSize: 15 } },
      { text: '数据库引擎分布', left: '60%', top: '2%', textStyle: { color: titleColor.value, fontSize: 15 } },
    ],
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} 个' },
    // 右侧柱状图的布局
    grid: [{ left: '60%', top: '15%', width: '35%', height: '70%', containLabel: true }],
    xAxis: [{ type: 'value', splitLine: { lineStyle: { type: 'dashed', color: splitLineColor.value } }, axisLabel: { show: false } }],
    yAxis: [
      {
        type: 'category',
        data: engineKeys,
        axisLabel: {
          color: labelColor.value,
          formatter: (value: string) => value.toUpperCase()
        },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: axisLineColor.value } },
      }
    ],
    color: ['#52c41a', '#1890ff', '#fadb14', '#eb2f96', '#722ed1'],
    series: [
      {
        name: '厂商占比',
        type: 'pie',
        radius: ['35%', '55%'], 
        center: ['22%', '50%'], 
        data: vendorData,
        label: { formatter: '{b}\n{c}个', color: labelColor.value },
      },
      {
        name: '引擎类型',
        type: 'bar',
        barMaxWidth: 40,
        itemStyle: { 
          borderRadius: [0, 4, 4, 0],
          color: function(params: any) {
            const colorList = ['#52c41a', '#13c2c2', '#1890ff'];
            return colorList[params.dataIndex % colorList.length];
          }
        },
        label: { show: true, position: 'right', color: labelColor.value },
        data: engineVals,
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