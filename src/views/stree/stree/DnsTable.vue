<template>
  <BasicTable @register="registerTableDns">
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
  name: "DnsTable",
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
        componentProps: { placeholder: '输入域名或解析值查询' },
      },
      {
        field: 'vendor',
        label: '厂商',
        component: 'Select',
        colProps: { span: 6 },
        componentProps: {
          options: [
            { label: 'GoDaddy', value: 'godaddy' },
            { label: 'Dynadot', value: 'dynadot' },
          ],
        },
      },
      {
        field: 'type',
        label: '记录类型',
        component: 'Select',
        colProps: { span: 6 },
        componentProps: {
          options: [
            { label: 'A记录', value: 'A' },
            { label: 'CNAME', value: 'CNAME' },
            { label: 'TXT', value: 'TXT' },
          ],
        },
      },
    ];

    const formatTime = (timeStr) => {
      if (!timeStr) return '-';
      return timeStr.replace('T', ' ').substring(0, 19);
    };

    const columns: BasicColumn[] = [
      { 
        title: '完整域名', 
        dataIndex: 'domain', 
        width: 220, 
        fixed: 'left',
        customRender: ({ record }) => {
          const fullDomain = record.name === '@' ? record.domain : `${record.name}.${record.domain}`;
          return h('span', { class: 'font-medium' }, fullDomain);
        }
      },
      { 
        title: '记录类型', 
        dataIndex: 'type', 
        width: 100,
        customRender: ({ text }) => {
          let color = 'default';
          if (text === 'A') color = 'blue';
          if (text === 'CNAME') color = 'purple';
          if (text === 'TXT') color = 'green';
          return h(Tag, { color }, () => text);
        }
      },
      { 
        title: '解析值', 
        dataIndex: 'value', 
        width: 250,
        customRender: ({ text }) => {
          return h(
            Tooltip,
            { title: text, placement: 'top' },
            () => h('span', { class: 'truncate w-full inline-block' }, text)
          );
        }
      },
      { 
        title: 'TTL', 
        dataIndex: 'ttl', 
        width: 80,
      },
      { 
        title: '关联资产', 
        dataIndex: 'associated_instance_id', 
        width: 250,
        customRender: ({ record }) => {
          const id = record.associated_instance_id || record.ecs_instance_id;
          if (!id) return h('span', { class: 'text-gray-400' }, '未关联');
          
          const isElb = id.includes('arn:aws') || id.includes('loadbalancer');
          const typeLabel = isElb ? '[ELB]' : '[ECS]';
          const color = isElb ? '#722ed1' : '#1890ff';

          // 截取显示
          const parts = id.split('/');
          const shortId = parts.length > 2 ? parts[parts.length - 1] : id;

          return h(Tooltip, { title: id, placement: 'top' }, () => 
            h('span', [
              h('span', { style: `color: ${color}; margin-right: 4px; font-weight: 500;` }, typeLabel),
              h('span', { style: 'cursor: pointer; border-bottom: 1px dashed #999;' }, shortId)
            ])
          );
        }
      },
      {
        title: '同步时间',
        dataIndex: 'UpdatedAt',
        width: 160,
        customRender: ({ text }) => formatTime(text)
      },
      {
        title: '厂商',
        dataIndex: 'vendor',
        width: 100,
        customRender: ({ text }) => {
          if (text === 'godaddy') return 'GoDaddy';
          if (text === 'dynadot') return 'Dynadot';
          return text || '-';
        }
      },
    ];

    const [registerTableDns, { reload, getDataSource }] = useTable({
      title: '关联域名解析列表',
      api: fetchResourceByNode,
      useSearchForm: true,
      formConfig: {
        labelWidth: 80,
        schemas: searchFormSchema,
        autoSubmitOnEnter: true,
      },
      beforeFetch: (params) => {
        params.resourceType = 'dns'; // 🌟 告诉后端查 dns 表
        params.nodeId = props.nodeId; 
        return params;
      },
      pagination: {
        pageSize: 10, 
        showSizeChanger: true, 
        pageSizeOptions: ['10', '50', '100', '500'],
      },
      columns: columns,
      scroll: { x: 'max-content' },
      showTableSetting: true,
      tableSetting: { fullScreen: true },
      showIndexColumn: true,
      rowKey: 'id',
    });

    watch(() => props.nodeId, () => reload({ page: 1 }));
    watch(() => props.refreshKey, () => reload());

    const handleExport = () => {
      const data = getDataSource();
      if (!data || data.length === 0) return createMessage.warning('当前没有可导出的数据');

      const exportData = data.map((item) => ({
        '完整域名': item.name === '@' ? item.domain : `${item.name}.${item.domain}`,
        '记录类型': item.type,
        '解析值': item.value,
        'TTL': item.ttl,
        '关联资产': item.associated_instance_id || item.ecs_instance_id || '未关联',
        '厂商': item.vendor,
        '同步时间': formatTime(item.UpdatedAt),
      }));

      jsonToSheetXlsx({
        data: exportData,
        filename: `DNS解析列表_${new Date().getTime()}.xlsx`,
        write2excelOpts: { bookType: 'xlsx' },
      });
      createMessage.success('导出成功');
    };

    return { registerTableDns, handleExport };
  },
})
</script>