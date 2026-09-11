<template>
  <BasicTable @register="registerTableEcs">
    <template #toolbar>
      <Tooltip title="导出当前表格到 Excel">
        <Icon 
          icon="ant-design:download-outlined" 
          class="text-gray-500 hover:text-blue-500 cursor-pointer text-lg" 
          @click="handleExport" 
        />
      </Tooltip>
    </template>
  </BasicTable>
</template>

<script lang="ts">
import { defineComponent, watch } from 'vue';
import { BasicTable, useTable, BasicColumn } from '@/components/Table';
import { fetchResourceByNode } from '@/api/demo/system';
import { FormSchema } from '@/components/Form';
import { Tag, Tooltip, Space } from 'ant-design-vue';
import { jsonToSheetXlsx } from '@/components/Excel';
import Icon from '@/components/Icon/Icon.vue';
import { h } from 'vue';
import { useMessage } from '@/hooks/web/useMessage';
export default defineComponent({
  name: "EcsTable",
  components: { BasicTable, Tooltip, Icon },
  props: {
    nodeId: {
      type: [Number, String],
      required: true,
    },
    refreshKey: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    const { createMessage } = useMessage();
    const searchFormSchema: FormSchema[] = [
      {
        field: 'keyword',
        label: '关键字',
        component: 'Input',
        colProps: { span: 6 },
        componentProps: {
          placeholder: '实例名 / 实例ID / IP',
        },
      },
      {
        field: 'status',
        label: '状态',
        component: 'Select',
        colProps: { span: 6 },
        componentProps: {
          options: [
            { label: '运行中', value: 'running' },
            { label: '已停止', value: 'stopped' },
            { label: '启动中', value: 'starting' },
          ],
        },
      },
      {
        field: 'vendor',
        label: '厂商',
        component: 'Select',
        colProps: { span: 6 },
        componentProps: {
          options: [
            { label: '自建', value: 'self' },
            { label: '阿里云', value: 'aliyun' },
            { label: 'AWS', value: 'aws' },
            { label: '腾讯云', value: 'tencent' },
            { label: '华为云', value: 'huawei' },
          ],
        },
      },
      {
        field: 'account',
        label: '归属账号',
        component: 'Input',
        colProps: { span: 6 },
        componentProps: {
          placeholder: '输入账号名或ID查询',
        },
      },
    ];

    const formatTime = (timeStr) => {
      if (!timeStr) return '-';
      return timeStr.replace('T', ' ').substring(0, 19);
    };

    const columns: BasicColumn[] = [
      { title: '实例名', dataIndex: 'title', width: 150, fixed: 'left' },
      { title: '实例ID', dataIndex: 'InstanceId', width: 200 },
      { title: '实例规格', dataIndex: 'InstanceType', width: 100 },
      { 
        title: 'CPU', 
        dataIndex: 'Cpu', 
        width: 70, 
        customRender: ({ text }) => text ? `${text} 核` : '-' 
      },
      { 
        title: '内存', 
        dataIndex: 'Memory', 
        width: 80,
        customRender: ({ text }) => text ? `${(text / 1024).toFixed(0)} GB` : '-' 
      },
      { 
        title: '磁盘',
        dataIndex: 'DiskIds',
        width: 50,
        customRender: ({ text }) => {
          // 判空容错处理
          if (!text || !Array.isArray(text) || text.length === 0) return '-';

          // 遍历磁盘数组（因为一台机器可能有多个盘）
          const diskElements = text.map((diskStr) => {
            // 使用正则提取括号内的内容。例如："vol-0a097(100G)" -> "100G"
            const match = diskStr.match(/\((.*?)\)/);
            const size = match ? match[1] : diskStr; // 如果没匹配到括号，兜底原样显示

            // 渲染 Tooltip 组件
            return h(
              Tooltip,
              { title: diskStr, placement: 'top' }, // 鼠标悬浮时显示的完整文本
              () => h(
                'span', 
                // 加一个虚线下划线和手型指针，暗示用户这里可以 hover
                { style: 'cursor: pointer; border-bottom: 1px dashed #999;' }, 
                size
              )
            );
          });

          // 如果有多个磁盘，用 Space 组件给它们加上间距自动换行
          return h(Space, { size: 8, wrap: true }, () => diskElements);
        }
      },
      { title: '操作系统', dataIndex: 'OSName', width: 150 },
      { title: '可用区', dataIndex: 'ZoneId', width: 140 },
      { title: '私网IP', dataIndex: 'PrivateIpAddress', width: 130, customRender: ({ text }) => text?.[0] || '-' },
      { title: '公网IP', dataIndex: 'PublicIpAddresses', width: 130, customRender: ({ text }) => text?.[0] || '-' },
      { 
        title: '状态', 
        dataIndex: 'Status', 
        width: 100,
        customRender: ({ text }) => {
          if (!text) return '-';
          // 🌟 统一转为小写，兼容 Aliyun 的 "Running" 和 AWS 的 "running"
          const status = text.toLowerCase(); 
          const color = status === 'running' ? 'success' : (status === 'stopped' ? 'error' : 'processing');
          const label = status === 'running' ? '运行中' : (status === 'stopped' ? '已停止' : text);
          return h(Tag, { color }, () => label);
        }
      },

      { 
        title: '启动时间', 
        dataIndex: 'CreationTime', 
        width: 160,
        customRender: ({ text }) => formatTime(text)
      },
      { 
        title: '到期时间', 
        dataIndex: 'ExpiredTime', 
        width: 160,
        // 🌟 处理 AWS 可能没有过期时间的情况
        customRender: ({ text }) => formatTime(text)
      },
      { 
        title: '归属账号', 
        dataIndex: 'account_name', // 确保对应后端返回的字段名
        width: 150,
        customRender: ({ text }) => {
          if (!text) return '-';

          // 🌟 使用正则拆分：匹配括号前的内容 (name) 和 括号内的内容 (id)
          // 格式：花花卡(123213123)
          const match = text.match(/^(.*?)\((.*?)\)$/);

          if (match) {
            const name = match[1]; // 花花卡
            const id = match[2];   // 123213123

            return h(
              Tooltip,
              { title: `账号 ID: ${id}`, placement: 'top' }, // 悬浮提示完整 ID
              () => h(
                'span', 
                { style: 'cursor: pointer; border-bottom: 1px dashed #999;' }, 
                name // 默认只显示中文名称
              )
            );
          }

          // 如果不符合 "名称(ID)" 格式，则直接原样显示
          return text;
        }
      },
      {
        title: '厂商',
        dataIndex: 'Vendor',
        width: 90,
        filters: [
          { text: '自建', value: 'self' },
          { text: 'AWS', value: 'aws' },
          { text: '阿里云', value: 'aliyun' },
          { text: '腾讯云', value: 'tencent' },
          { text: '华为云', value: 'huawei' },
        ],
        onFilter: (value, record) => record.Vendor === value,
        customRender: ({ text }) => {
          if (text === 'self' || text === 'idc') return '自建';
          if (text === 'aws') return 'AWS';
          if (text === 'aliyun') return '阿里云';
          if (text === 'tencent') return '腾讯云';
          if (text === 'huawei') return '华为云';
          return text || '-';
        }
      },
    ];

    const [registerTableEcs, { getForm, reload, getDataSource }] = useTable({
      title: '关联资源列表',
      api: fetchResourceByNode,
      useSearchForm: true,
      formConfig: {
        labelWidth: 80,
        schemas: searchFormSchema,
        autoSubmitOnEnter: true,
      },
      
      // 🌟 1. 删除了原本静态的 searchInfo，改用 beforeFetch 动态拦截参数
      beforeFetch: (params) => {
        // 每次发请求前，都会把最新的 nodeId 塞进参数里
        params.resourceType = 'ecs';
        params.nodeId = props.nodeId; 
        return params;
      },

      pagination: {
        pageSize: 5, 
        showSizeChanger: true, 
        pageSizeOptions: ['5','10', '50', '100', '500'],
      },
      columns: columns,
      scroll: { x: 'max-content' },
      showTableSetting: true,
      tableSetting: { fullScreen: true },
      showIndexColumn: true,
      rowKey: 'id',
    });

    // 🌟 2. 监听 nodeId 的变化（点不同树节点）
    watch(
      () => props.nodeId,
      () => {
        // 直接无脑 reload 即可，beforeFetch 会自动带上最新的 nodeId
        reload({ page: 1 }); // 切换节点时，默认重置到第一页
      }
    );

    // 🌟 3. 监听 refreshKey 的变化（同节点绑定/解绑）
    watch(
      () => props.refreshKey,
      () => {
        reload(); // 原地刷新，保留当前页码
      }
    );

    // function getFormValues() {
    //   console.log('当前搜索参数：', getForm().getFieldsValue());
    // }

    const handleExport = () => {
      // 获取当前表格展示的数据
      const data = getDataSource();
      if (!data || data.length === 0) {
        createMessage.warning('当前没有可导出的数据');
        return;
      }

      // 格式化数据，使 Excel 中的展示与前端页面保持一致
      const exportData = data.map((item) => {
        // 厂商映射逻辑
        let vendorName = item.Vendor;
        if (vendorName === 'self' || vendorName === 'idc') vendorName = '自建';
        else if (vendorName === 'aws') vendorName = 'AWS';
        else if (vendorName === 'aliyun') vendorName = '阿里云';
        else if (vendorName === 'tencent') vendorName = '腾讯云';
        else if (vendorName === 'huawei') vendorName = '华为云';

        // 账号名称提取逻辑 (类似 customRender 里的拆分)
        let accountStr = item.account_name || '-';
        if (accountStr !== '-') {
          const match = accountStr.match(/^(.*?)\((.*?)\)$/);
          if (match) {
            accountStr = `${match[1]} (ID: ${match[2]})`;
          }
        }

        // 组装要导出的 JSON 对象 (Key 就是 Excel 的表头)
        return {
          '实例名': item.title || '-',
          '实例ID': item.InstanceId || '-',
          '实例规格': item.InstanceType || '-',
          'CPU': item.Cpu ? `${item.Cpu} 核` : '-',
          '内存': item.Memory ? `${(item.Memory / 1024).toFixed(0)} GB` : '-',
          '操作系统': item.OSName || '-',
          '可用区': item.ZoneId || '-',
          '私网IP': item.PrivateIpAddress?.[0] || '-',
          '公网IP': item.PublicIpAddresses?.[0] || '-',
          '状态': item.Status || '-',
          '启动时间': formatTime(item.CreationTime),
          '到期时间': formatTime(item.ExpiredTime),
          '归属账号': accountStr,
          '厂商': vendorName || '-',
        };
      });

      // 调用 Vben 的工具函数导出
      jsonToSheetXlsx({
        data: exportData,
        filename: `ECS资源列表_${new Date().getTime()}.xlsx`,
        write2excelOpts: {
          bookType: 'xlsx',
        },
      });
      createMessage.success('导出成功');
    };
    return {
      registerTableEcs,
      // getFormValues,
      handleExport
    };
  },
})
</script>