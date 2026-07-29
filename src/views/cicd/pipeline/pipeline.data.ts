import { BasicColumn, FormSchema } from '@/components/Table';
import { h } from 'vue';
import { Tag } from 'ant-design-vue';

export const columns: BasicColumn[] = [
  {
    title: '模版名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
    align: 'left',
    customRender: ({ record }) => {
      return h('span', { class: 'font-bold text-gray-800 dark:text-gray-100 font-mono text-sm' }, record.name || '-');
    },
  },
  {
    title: '适用语言栈',
    dataIndex: 'lang',
    key: 'lang',
    width: 140,
    align: 'center',
    customRender: ({ text }) => {
      const lang = text || 'Vue/TS';
      const color =
        lang === 'Java' ? 'orange' : lang === 'Vue/TS' ? 'green' : lang === 'Go' ? 'blue' : lang === 'Python' ? 'purple' : 'cyan';
      return h(Tag, { color, class: 'font-semibold rounded px-2' }, () => lang);
    },
  },
  {
    title: '构建节点',
    dataIndex: 'agentNode',
    key: 'agentNode',
    width: 130,
    align: 'center',
    customRender: ({ text }) => {
      const node = text || 'master';
      return h(Tag, { color: 'processing', class: 'font-mono text-xs rounded' }, () => `node: ${node}`);
    },
  },
  {
    title: '描述说明',
    dataIndex: 'description',
    key: 'description',
    align: 'left',
    ellipsis: true,
    customRender: ({ text }) => {
      return text ? h('span', { class: 'text-gray-600 dark:text-gray-300 text-xs' }, text) : h('span', { class: 'text-gray-400 text-xs italic' }, '暂无描述');
    },
  },
  {
    title: '创建时间',
    dataIndex: 'CreatedAt',
    key: 'CreatedAt',
    width: 180,
    align: 'center',
    customRender: ({ text }) => {
      if (!text) return h('span', { class: 'text-gray-400 text-xs' }, '-');
      const date = new Date(text);
      return h('span', { class: 'text-xs text-gray-500 font-mono' }, date.toLocaleString());
    },
  },
];

export const searchFormSchema: FormSchema[] = [
  {
    field: 'lang',
    label: '语言栈',
    component: 'Select',
    colProps: { span: 6 },
    componentProps: {
      placeholder: '筛选适用语言',
      allowClear: true,
      options: [
        { label: '全部语言', value: '' },
        { label: 'Java', value: 'Java' },
        { label: 'Vue/TS', value: 'Vue/TS' },
        { label: 'Go', value: 'Go' },
        { label: 'Python', value: 'Python' },
        { label: 'Shell', value: 'Shell' },
      ],
    },
  },
  {
    field: 'keyword',
    label: '关键字',
    component: 'Input',
    colProps: { span: 8 },
    componentProps: {
      placeholder: '搜索模版名称/描述说明',
      allowClear: true,
    },
  },
];

export const formSchema: FormSchema[] = [
  {
    field: 'name',
    label: '模版名称',
    component: 'Input',
    required: true,
    colProps: { span: 12 },
    componentProps: {
      placeholder: '例如: Standard-Vue-TS-Build-Pipeline',
    },
  },
  {
    field: 'lang',
    label: '适用语言栈',
    component: 'Select',
    required: true,
    defaultValue: 'Vue/TS',
    colProps: { span: 6 },
    componentProps: {
      options: [
        { label: 'Vue/TS', value: 'Vue/TS' },
        { label: 'Java', value: 'Java' },
        { label: 'Go', value: 'Go' },
        { label: 'Python', value: 'Python' },
        { label: 'Shell', value: 'Shell' },
      ],
    },
  },
  {
    field: 'agentNode',
    label: '构建节点 (Agent)',
    component: 'Input',
    defaultValue: 'master',
    colProps: { span: 6 },
    componentProps: {
      placeholder: 'master / k8s-slave',
    },
  },
  {
    field: 'description',
    label: '描述说明',
    component: 'InputTextArea',
    colProps: { span: 24 },
    componentProps: {
      rows: 2,
      placeholder: '简述该流水线模版的适用场景、依赖插件与编译流程说明',
    },
  },
  {
    field: 'pipelineScript',
    label: '',
    component: 'Input',
    colProps: { span: 24 },
    slot: 'pipelineScriptSlot',
  },
];
