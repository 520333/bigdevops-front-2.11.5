<template>
  
  <div ref="chartRef" :style="{ height, width }">

  </div>
</template>
<script lang="ts">
  import { defineComponent, PropType, ref, Ref, onMounted } from 'vue';

  import { useECharts } from '@/hooks/web/useECharts';

  interface NodeData {
    groupVendor?: Array<{ name: string; value: number }>;
    [key: string]: any; // 允许有其他任意属性
  }
  export default defineComponent({
    props: {
      width: {
        type: String as PropType<string>,
        default: '100%',
      },
      height: {
        type: String as PropType<string>,
        // default: 'calc(100vh - 78px)',
        default: '300px',
      },
      node: {
        type: Object as PropType<NodeData>,
        default: () => ({}),
      },
    },
    setup(props) {
      const chartRef = ref<HTMLDivElement | null>(null);
      const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>);
      onMounted(() => {
        setOptions({
          backgroundColor: '#0f375f',
          title: [
            {
              text: 'ECS厂商占比',
              left: '2%',
              top: '1%',
              textStyle: {
                color: '#fff',
                fontSize: 14,
              },
            },
            {
              text: '操作系统',
              left: '40%',
              top: '1%',
              textStyle: {
                color: '#fff',
                fontSize: 14,
              },
            },
            {
              text: 'ECS区域占比',
              left: '2%',
              top: '50%',
              textStyle: {
                color: '#fff',
                fontSize: 14,
              },
            },
          ],
          grid: [{ left: '50%', top: '7%', width: '45%', height: '90%' }],
          tooltip: {
            formatter: '{b} ({c})',
          },
          xAxis: [
            {
              gridIndex: 0,
              axisTick: { show: false },
              axisLabel: { show: false },
              splitLine: { show: false },
              axisLine: { show: false },
            },
          ],
          yAxis: [
            {
              gridIndex: 0,
              interval: 0,
              data: props.node.groupByOSNameOrderKeys,
              axisTick: { show: false },
              axisLabel: { show: true },
              splitLine: { show: false },
              axisLine: { show: true, lineStyle: { color: '#6173a3' } },
            },
          ],
          series: [
            {
              name: 'ECS厂商占比',
              type: 'pie',
              radius: '30%',
              center: ['22%', '25%'],
              data: props.node.groupByVendor,
              labelLine: { show: false },
              label: {
                show: true,
                formatter: '{b}:{c}个 {d}%',
                color: '#B1B9D3',
              },
            },
            {
              name: 'ECS区域占比',
              type: 'pie',
              radius: '30%',
              center: ['22%', '75%'],
              labelLine: { show: false },
              data: props.node.groupByZoneId,
              label: {
                show: true,
                formatter: '{b} \n ({d}%)',
                color: '#B1B9D3',
              },
            },
            {
              name: '操作系统',
              type: 'bar',
              xAxisIndex: 0,
              yAxisIndex: 0,
              barWidth: '45%',
              itemStyle: { color: '#86c9f4' },
              label: { show: true, position: 'right', color: '#9EA7C4' },
              data: props.node.groupByOSNameOrderValues,
            },
          ],
          
        });
        
      });
      
      return { chartRef };
    },
  });
</script>
