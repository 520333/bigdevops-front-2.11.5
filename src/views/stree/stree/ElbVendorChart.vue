<template>
  <div class="elb-summary-wrapper w-full h-full flex flex-col">
    
    <div class="flex gap-4 mb-4">
      <div class="flex-1 bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-md border border-purple-100 dark:border-purple-900/30">
        <div class="text-gray-500 dark:text-gray-400 text-sm mb-1">ELB 总数 (个)</div>
        <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ totalElbNum }}</div>
      </div>
      <div class="flex-1 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-md border border-indigo-100 dark:border-indigo-900/30">
        <div class="text-gray-500 dark:text-gray-400 text-sm mb-1">带宽包上限</div>
        <div class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{{ totalBandWidth }}</div>
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
const totalElbNum = computed(() => props.node?.elbNum || 0);
const totalBandWidth = computed(() => props.node?.elbBandWidthTotal || 0);

const chartRef = ref<HTMLElement | null>(null);
let myChart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

const renderEcharts = () => {
  if (!chartRef.value || !props.node) return;
  if (!myChart) myChart = echarts.init(chartRef.value);

  const vendorMap: Record<string, string> = { aliyun: '阿里云', aws: 'AWS', tencent: '腾讯云', huawei: '华为云' };
  const vendorData = (props.node.groupByVendorElb || []).map((item: any) => ({
    name: vendorMap[item.name] || item.name || '未知',
    value: item.value || 0
  }));

  // 2. 负载均衡类型 (ALB, NLB, CLB) 分布
  const typeKeys = [...(props.node.groupByLoadBalancerTypeKeys || [])].reverse();
  const typeVals = [...(props.node.groupByLoadBalancerTypeValues || [])].reverse();

  // 空状态兜底
  if (vendorData.length === 0) vendorData.push({ name: '暂无数据', value: 0 });
  if (typeKeys.length === 0) {
    typeKeys.push('暂无');
    typeVals.push(0);
  }

  myChart.clear();

  const option = {
    title: [
      { text: 'ELB 厂商占比', left: '10%', top: '2%', textStyle: { color: titleColor.value, fontSize: 15 } },
      { text: '负载均衡类型分布', left: '60%', top: '2%', textStyle: { color: titleColor.value, fontSize: 15 } },
    ],
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} 个' },
    // 右侧柱状图的布局
    grid: [{ left: '60%', top: '15%', width: '35%', height: '70%', containLabel: true }],
    xAxis: [{ type: 'value', splitLine: { lineStyle: { type: 'dashed', color: splitLineColor.value } }, axisLabel: { show: false } }],
    yAxis: [
      {
        type: 'category',
        data: typeKeys,
        axisLabel: {
          color: labelColor.value,
          // 格式化类型名称
          formatter: (value: string) => value.toUpperCase()
        },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: axisLineColor.value } },
      }
    ],
    color: ['#722ed1', '#1890ff', '#13c2c2', '#eb2f96', '#faad14'],
    series: [
      {
        name: '厂商占比',
        type: 'pie',
        radius: ['35%', '55%'], // 因为这里只有两个图表，饼图可以画大一点
        center: ['22%', '50%'], 
        data: vendorData,
        label: { formatter: '{b}\n{c}个', color: labelColor.value },
      },
      {
        name: '实例类型',
        type: 'bar',
        barMaxWidth: 40,
        itemStyle: { 
          borderRadius: [0, 4, 4, 0],
          // 给柱状图加点颜色区分
          color: function(params: any) {
            const colorList = ['#1890ff', '#722ed1', '#13c2c2'];
            return colorList[params.dataIndex % colorList.length];
          }
        },
        label: { show: true, position: 'right', color: labelColor.value },
        data: typeVals,
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