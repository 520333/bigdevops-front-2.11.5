import { BasicColumn, FormSchema } from '@/components/Table';
import { h } from 'vue';
import { Tag } from 'ant-design-vue';

export const columns: BasicColumn[] = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 70,
    align: 'center',
  },
  {
    title: '实例名称',
    dataIndex: 'name',
    width: 160,
    customRender: ({ text }) => {
      return h('span', { class: 'font-semibold text-gray-800 dark:text-gray-200' }, text || '-');
    },
  },
  {
    title: 'URL 地址',
    dataIndex: 'url',
    width: 350,
    customRender: ({ text }) => {
      return h(
        'a',
        {
          href: text,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-blue-600 dark:text-blue-400 font-mono hover:underline',
        },
        text || '-',
      );
    },
  },
  {
    title: '用户名',
    dataIndex: 'username',
    width: 140,
    align: 'center',
  },
  {
    title: '环境',
    dataIndex: 'env',
    width: 110,
    align: 'center',
    customRender: ({ text }) => {
      const colorMap: Record<string, string> = {
        prod: 'success',
        stage: 'warning',
        test: 'processing',
      };
      return h(Tag, { color: colorMap[text] || 'default' }, () => text || '-');
    },
  },
  {
    title: '状态',
    dataIndex: 'lastProbSuccess',
    width: 140,
    align: 'center',
    customRender: ({ record }) => {
      const isOnline = Boolean(record.lastProbSuccess);
      return h(
        Tag,
        { color: isOnline ? 'success' : 'error' },
        () => (isOnline ? '在线' : '离线'),
      );
    },
  },
  {
    title: '错误日志',
    dataIndex: 'lastProbErrMsg',
    ellipsis: true,
    customRender: ({ text }) => {
      return text
        ? h('span', { class: 'text-red-500 font-mono text-xs' }, text)
        : h('span', { class: 'text-gray-400 text-xs' }, '无');
    },
  },
];

export const searchFormSchema: FormSchema[] = [
  {
    field: 'name',
    label: '实例名称',
    component: 'Input',
    colProps: { span: 8 },
    componentProps: {
      placeholder: '请输入实例名称搜索',
      allowClear: true,
    },
  },
  {
    field: 'env',
    label: '部署环境',
    component: 'Select',
    colProps: { span: 6 },
    componentProps: {
      placeholder: '请选择环境',
      allowClear: true,
      options: [
        { label: '测试环境 (test)', value: 'test' },
        { label: '预发环境 (stage)', value: 'stage' },
        { label: '生产环境 (prod)', value: 'prod' },
      ],
    },
  },
];

export const formSchema: FormSchema[] = [
  {
    field: 'name',
    label: '实例名称',
    component: 'Input',
    required: true,
    componentProps: {
      placeholder: '请输入 Jenkins 实例名称 (如: 生产主集群)',
    },
  },
  {
    field: 'url',
    label: 'Jenkins URL',
    component: 'Input',
    required: true,
    componentProps: {
      placeholder: '例如: http://jenkins.example.com:8080',
    },
  },
  {
    field: 'username',
    label: '用户名',
    component: 'Input',
    required: true,
    componentProps: {
      placeholder: '请输入 Jenkins 登录账号',
    },
  },
  {
    field: 'apiToken',
    label: 'API Token / 密码',
    component: 'InputPassword',
    required: true,
    helpMessage: '编辑时如无需修改密码/Token，保持默认掩码即可',
    componentProps: {
      placeholder: '请输入 Jenkins API Token 或访问密码',
    },
  },
  {
    field: 'env',
    label: '环境',
    component: 'Select',
    defaultValue: 'test',
    required: true,
    componentProps: {
      options: [
        { label: '测试环境 (test)', value: 'test' },
        { label: '预发环境 (stage)', value: 'stage' },
        { label: '生产环境 (prod)', value: 'prod' },
      ],
    },
  },
];
