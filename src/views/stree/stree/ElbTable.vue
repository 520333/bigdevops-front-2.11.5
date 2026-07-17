<template>
  <BasicTable @register="registerTableElb">
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
import { Tag, Tooltip } from 'ant-design-vue';
import { jsonToSheetXlsx } from '@/components/Excel';
import Icon from '@/components/Icon/Icon.vue';
import { h } from 'vue';
import { useMessage } from '@/hooks/web/useMessage';

export default defineComponent({
  name: "ElbTable",
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
    
    // 搜索表单配置
    const searchFormSchema: FormSchema[] = [
      {
        field: 'keyword',
        label: '关键字',
        component: 'Input',
        colProps: { span: 6 },
        componentProps: {
          placeholder: '名称 / ID / IP / DNS',
        },
      },
      {
        field: 'vendor',
        label: '厂商',
        component: 'Select',
        colProps: { span: 6 },
        componentProps: {
          options: [
            { label: '阿里云', value: 'aliyun' },
            { label: 'AWS', value: 'aws' },
            { label: '腾讯云', value: 'tencent' },
            { label: '华为云', value: 'huawei' },
          ],
        },
      },
      {
        field: 'type',
        label: '类型',
        component: 'Select',
        colProps: { span: 6 },
        componentProps: {
          options: [
            { label: 'ALB', value: 'alb' },
            { label: 'CLB', value: 'clb' },
            { label: 'NLB', value: 'nlb' },
          ],
        },
      },
      {
        field: 'account', // 必须与后端接收的 key 一致
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

    // 表格列配置
    const columns: BasicColumn[] = [
      { title: '负载均衡名称', dataIndex: 'loadBalancerName', width: 200, fixed: 'left' },
      { 
        title: '负载均衡ID', 
        dataIndex: 'loadBalancerId', // 🌟 修复
        width: 250,
        customRender: ({ text }) => {
          if (!text) return '-';
          if (text.startsWith('arn:aws:')) {
            const parts = text.split('/');
            const shortId = parts.length > 2 ? parts[parts.length - 1] : text;
            return h(
              Tooltip,
              { title: text, placement: 'top' },
              () => h('span', { style: 'cursor: pointer; border-bottom: 1px dashed #999;' }, shortId)
            );
          }
          return text;
        }
      },
      { 
        title: '类型', 
        dataIndex: 'loadBalancerType', // 🌟 修复
        width: 100,
        customRender: ({ text }) => {
          if (!text) return '-';
          let color = 'default';
          const type = text.toLowerCase();
          if (type === 'alb' || type === 'application') color = 'blue';
          if (type === 'clb' || type === 'classic') color = 'cyan';
          if (type === 'nlb' || type === 'network') color = 'purple';
          return h(Tag, { color }, () => text.toUpperCase());
        }
      },
      { 
        title: '网络类型', 
        dataIndex: 'addressType', // 🌟 修复
        width: 120,
        customRender: ({ text }) => {
          if (!text) return '-';
          if (text.includes('internet') || text === 'internet') return '公网 (Internet)';
          if (text.includes('intranet') || text === 'internal') return '内网 (Internal)';
          return text;
        }
      },
      { 
        title: '公网IP', 
        dataIndex: 'PublicIpAddresses', // JSON中是大写，保持不变
        width: 140, 
        customRender: ({ text }) => text?.[0] || '-' 
      },
      { 
        title: 'DNS 名称', 
        dataIndex: 'DNSName', // JSON中是大写，保持不变
        width: 220,
        customRender: ({ text }) => {
          if (!text) return '-';
          return h(
            Tooltip,
            { title: text, placement: 'top' },
            () => h('span', { class: 'truncate w-full inline-block' }, text)
          );
        }
      },
      { title: '所属 VPC', dataIndex: 'VpcId', width: 180 }, // JSON中是大写
      { 
        title: '状态', 
        dataIndex: 'status', // 🌟 修复
        width: 100,
        customRender: ({ text }) => {
          if (!text) return '-';
          const status = text.toLowerCase(); 
          const color = (status === 'active' || status === 'active_normal') ? 'success' : 'processing';
          return h(Tag, { color }, () => text);
        }
      },
      { 
        title: '创建时间', 
        dataIndex: 'CreationTime', 
        width: 160,
        customRender: ({ text }) => formatTime(text)
      },
      { 
        title: '归属账号', 
        dataIndex: 'account_name', 
        width: 150,
        customRender: ({ text }) => {
          if (!text) return '-';
          const match = text.match(/^(.*?)\((.*?)\)$/);
          if (match) {
            const name = match[1]; 
            const id = match[2]; 
            return h(
              Tooltip,
              { title: `账号 ID: ${id}`, placement: 'top' },
              () => h('span', { style: 'cursor: pointer; border-bottom: 1px dashed #999;' }, name)
            );
          }
          return text;
        }
      },
      {
        title: '厂商',
        dataIndex: 'Vendor',
        width: 90,
        filters: [
          { text: 'AWS', value: 'aws' },
          { text: '阿里云', value: 'aliyun' },
          { text: '腾讯云', value: 'tencent' },
          { text: '华为云', value: 'huawei' },
        ],
        onFilter: (value, record) => record.Vendor === value,
        customRender: ({ text }) => {
          if (text === 'aws') return 'AWS';
          if (text === 'aliyun') return '阿里云';
          if (text === 'tencent') return '腾讯云';
          if (text === 'huawei') return '华为云';
          return text || '-';
        }
      },
    ];

    const [registerTableElb, { reload, getDataSource }] = useTable({
      title: '关联负载均衡资源',
      api: fetchResourceByNode,
      useSearchForm: true,
      formConfig: {
        labelWidth: 80,
        schemas: searchFormSchema,
        autoSubmitOnEnter: true,
      },
      
      // 🌟 动态拦截参数，告诉后端这次查的是 elb
      beforeFetch: (params) => {
        params.resourceType = 'elb';
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

    // 🌟 监听 nodeId 的变化（点不同树节点）
    watch(
      () => props.nodeId,
      () => {
        reload({ page: 1 }); 
      }
    );

    // 🌟 监听 refreshKey 的变化（同节点绑定/解绑）
    watch(
      () => props.refreshKey,
      () => {
        reload(); 
      }
    );

    const handleExport = () => {
      const data = getDataSource();
      if (!data || data.length === 0) {
        createMessage.warning('当前没有可导出的数据');
        return;
      }

      const exportData = data.map((item) => {
        let vendorName = item.Vendor;
        if (vendorName === 'aws') vendorName = 'AWS';
        else if (vendorName === 'aliyun') vendorName = '阿里云';
        else if (vendorName === 'tencent') vendorName = '腾讯云';
        else if (vendorName === 'huawei') vendorName = '华为云';

        let accountStr = item.account_name || '-';
        if (accountStr !== '-') {
          const match = accountStr.match(/^(.*?)\((.*?)\)$/);
          if (match) {
            accountStr = `${match[1]} (ID: ${match[2]})`;
          }
        }

        let addressTypeStr = item.addressType || '-';
        if (addressTypeStr.includes('internet') || addressTypeStr === 'internet') addressTypeStr = '公网';
        else if (addressTypeStr.includes('intranet') || addressTypeStr === 'internal') addressTypeStr = '内网';

        return {
          '负载均衡名称': item.loadBalancerName || '-',   // 🌟 修复
          '负载均衡ID': item.loadBalancerId || '-',       // 🌟 修复
          '类型': item.loadBalancerType?.toUpperCase() || '-', // 🌟 修复
          '网络类型': addressTypeStr,
          '公网IP': item.PublicIpAddresses?.[0] || '-',
          'DNS名称': item.DNSName || '-',
          '所属VPC': item.VpcId || '-',
          '状态': item.status || '-',                     // 🌟 修复
          '创建时间': formatTime(item.CreationTime),
          '归属账号': accountStr,
          '厂商': vendorName || '-',
        };
      });

      jsonToSheetXlsx({
        data: exportData,
        filename: `ELB资源列表_${new Date().getTime()}.xlsx`,
        write2excelOpts: {
          bookType: 'xlsx',
        },
      });
      createMessage.success('导出成功');
    };

    return {
      registerTableElb,
      handleExport
    };
  },
})
</script>