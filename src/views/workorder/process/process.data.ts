import { BasicColumn, FormSchema } from '@/components/Table';
import { getAllUserAndRoles } from '@/api/demo/system';
import { h } from 'vue';
import { Tag } from 'ant-design-vue';
import dayjs from 'dayjs';

export const columns: BasicColumn[] = [
  { title: '流程ID', dataIndex: 'id', width: 80 },
  { title: '流程名称', dataIndex: 'name', width: 250 },
  { title: '创建人', dataIndex: 'createUserName', width: 120 },
  {
    title: '审批链路',
    dataIndex: 'flowNodes',
    width: 350,
    customRender: ({ record }) => {
      if (!record.flowNodes || record.flowNodes.length === 0) return h('span', { class: 'text-gray-400' }, '暂无链路');

      const USER_COLOR = 'blue';
      const GROUP_COLOR = 'orange';

      return h('div', { class: 'flex items-center flex-wrap gap-1' }, record.flowNodes.map((node: any, index: number) => {
        const isGroup = node.defineUserOrGroup.includes('组@');
        const name = isGroup ? node.defineUserOrGroup.split('组@')[1] : node.defineUserOrGroup;
        const label = isGroup ? `[组] ${name}` : name;
        
        const colorMap: any = { '起始节点': 'cyan', '审批节点': 'blue', '执行节点': 'purple', '结束节点': 'red' };
        
        const tag = h(Tag, { 
          color: isGroup ? GROUP_COLOR : USER_COLOR,
          style: 'border-radius: 4px; padding: 0 8px; font-size: 12px; height: 22px; line-height: 20px; font-weight: 500;'
        }, () => label);

        const arrow = index < record.flowNodes.length - 1 
          ? h('span', { style: 'color: #ccc; margin: 0 4px; font-weight: bold;' }, '→') 
          : null;

        return [tag, arrow];
      }).flat());
    },
  },
  {
    title: '创建时间',
    dataIndex: 'CreatedAt',
    format: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '',
    width: 160,
  },
];

export const searchFormSchema: FormSchema[] = [
  { field: 'name', label: '流程名称', component: 'Input', colProps: { span: 8 } },
  {
    field: 'createUserName',
    label: '创建人',
    component: 'ApiSelect',
    componentProps: {
      api: getAllUserAndRoles,
      labelField: 'label',
      valueField: 'value',
      showSearch: true,
      optionFilterProp: 'label',
    },
    colProps: { span: 8 },
  },
];

export const flowNodeTypeOptions = [
  { value: '起始节点', label: '起始节点' },
  { value: '审批节点', label: '审批节点' },
  { value: '执行节点', label: '执行节点' },
  { value: '结束节点', label: '结束节点' }
];

export const formSchema: FormSchema[] = [
  { field: 'name', label: '流程名称', required: true, component: 'Input' },
  { field: 'flowNodes', label: ' ', slot: 'flowNodes', component: 'Input', itemProps: { labelCol: { span: 0 }, wrapperCol: { span: 24 } } },
];