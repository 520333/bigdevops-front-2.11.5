<template>
  <BasicTable @register="registerTableRds">
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
import { defineComponent, watch, h } from 'vue';
import { BasicTable, useTable, BasicColumn } from '@/components/Table';
import { fetchResourceByNode } from '@/api/demo/system';
import { FormSchema } from '@/components/Form';
import { Tag, Tooltip } from 'ant-design-vue';
import { jsonToSheetXlsx } from '@/components/Excel';
import Icon from '@/components/Icon/Icon.vue';
import { useMessage } from '@/hooks/web/useMessage';

export default defineComponent({
  name: "RdsTable",
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
        componentProps: { placeholder: '名称 / ID / 连接地址' },
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
          ],
        },
      },
      {
        field: 'status',
        label: '状态',
        component: 'Select',
        colProps: { span: 6 },
        componentProps: {
          options: [
            { label: '运行中 (Running)', value: 'running' },
            { label: '可用 (Available)', value: 'available' },
          ],
        },
      },
      {
        field: 'account',
        label: '归属账号',
        component: 'Input',
        colProps: { span: 6 },
        componentProps: { placeholder: '输入账号名查询' },
      },
    ];

    const formatTime = (timeStr) => {
      if (!timeStr) return '-';
      return timeStr.replace('T', ' ').substring(0, 19);
    };

    // 表格列配置
    const columns: BasicColumn[] = [
      { title: '实例名称', dataIndex: 'name', width: 200, fixed: 'left' },
      { title: '实例ID', dataIndex: 'DBInstanceId', width: 220 },
      { title: '数据库引擎', dataIndex: 'engine', width: 120 },
      { title: '版本', dataIndex: 'EngineVersion', width: 100 },
      { title: '实例规格', dataIndex: 'DBInstanceClass', width: 150 },
      { 
        title: '连接地址', 
        dataIndex: 'host', 
        width: 250,
        customRender: ({ text, record }) => {
          if (!text) return '-';
          return `${text}:${record.port || 3306}`;
        }
      },
      { 
        title: '角色类型', 
        dataIndex: 'DBInstanceType', 
        width: 100,
        customRender: ({ text }) => {
          if (!text) return '-';
          const t = text.toLowerCase();
          const color = t === 'primary' ? 'blue' : (t === 'readonly' ? 'cyan' : 'default');
          return h(Tag, { color }, () => text);
        }
      },
      { 
        title: '状态', 
        dataIndex: 'DBInstanceStatus', // ✅ 核心修复：改为大写的 DBInstanceStatus
        width: 120,
        customRender: ({ text }) => {
          if (!text) return '-';
          // 统一转为小写处理容错
          const s = text.toLowerCase(); 
          // 兼容阿里云的 running 和 AWS 的 available
          const color = (s === 'running' || s === 'available') ? 'success' : 'processing';
          // 转换为友好的中文标签
          const label = s === 'running' ? '运行中' : (s === 'available' ? '可用' : text);
          
          return h(Tag, { color }, () => label);
        }
      },
      { title: '创建时间', dataIndex: 'CreationTime', width: 160, customRender: ({ text }) => formatTime(text) },
      { 
        title: '归属账号', 
        dataIndex: 'account_name', 
        width: 150,
        customRender: ({ text }) => {
          if (!text) return '-';
          const match = text.match(/^(.*?)\((.*?)\)$/);
          if (match) {
            return h(
              Tooltip,
              { title: `账号 ID: ${match[2]}`, placement: 'top' },
              () => h('span', { style: 'cursor: pointer; border-bottom: 1px dashed #999;' }, match[1])
            );
          }
          return text;
        }
      },
      {
        title: '厂商',
        dataIndex: 'Vendor',
        width: 90,
        customRender: ({ text }) => {
          if (text === 'aws') return 'AWS';
          if (text === 'aliyun') return '阿里云';
          return text || '-';
        }
      },
    ];

    const [registerTableRds, { reload, getDataSource }] = useTable({
      title: '关联数据库资源',
      api: fetchResourceByNode,
      useSearchForm: true,
      formConfig: { labelWidth: 80, schemas: searchFormSchema, autoSubmitOnEnter: true },
      beforeFetch: (params) => {
        params.resourceType = 'rds';
        params.nodeId = props.nodeId; 
        return params;
      },
      pagination: { pageSize: 5, showSizeChanger: true, pageSizeOptions: ['5','10', '50'] },
      columns: columns,
      scroll: { x: 'max-content' },
      showIndexColumn: true,
      rowKey: 'id',
    });

    watch(() => props.nodeId, () => reload({ page: 1 }));
    watch(() => props.refreshKey, () => reload());

    const handleExport = () => {
      const data = getDataSource();
      if (!data || data.length === 0) return createMessage.warning('当前没有可导出的数据');

      const exportData = data.map((item) => {
        let vendorName = item.Vendor === 'aws' ? 'AWS' : (item.Vendor === 'aliyun' ? '阿里云' : item.Vendor);
        return {
          '实例名称': item.name || '-',
          '实例ID': item.DBInstanceId || '-',
          '引擎': item.engine || '-',
          '版本': item.EngineVersion || '-',
          '规格': item.DBInstanceClass || '-',
          '连接地址': item.host ? `${item.host}:${item.port}` : '-',
          '状态': item.status || '-',
          '归属账号': item.account_name || '-',
          '厂商': vendorName || '-',
        };
      });

      jsonToSheetXlsx({
        data: exportData,
        filename: `RDS资源列表_${new Date().getTime()}.xlsx`,
        write2excelOpts: { bookType: 'xlsx' },
      });
      createMessage.success('导出成功');
    };

    return { registerTableRds, handleExport };
  },
})
</script>