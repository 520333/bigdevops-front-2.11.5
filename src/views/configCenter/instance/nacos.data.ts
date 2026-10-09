import { BasicColumn, FormSchema } from '@/components/Table';
import { h } from 'vue';
import { Tag, Badge } from 'ant-design-vue';

export const envColorMap: Record<string, string> = {
  dev: 'green',
  test: 'blue',
  uat: 'purple',
  pre: 'orange',
  prod: 'red',
};

export const envNameMap: Record<string, string> = {
  dev: '开发环境 (dev)',
  test: '测试环境 (test)',
  uat: '预发环境 (uat)',
  pre: '预生产环境 (pre)',
  prod: '生产环境 (prod)',
};

export const columns: BasicColumn[] = [
  // {
  //   title: 'ID',
  //   dataIndex: 'id',
  //   width: 60,
  //   align: 'center',
  // },
  {
    title: '实例名称',
    dataIndex: 'name',
    width: 170,
  },
  {
    title: '部署环境',
    dataIndex: 'envKey',
    width: 120,
    align: 'center',
    customRender: ({ text }) => {
      return h(Tag, { color: envColorMap[text] || 'default' }, () => text || '-');
    },
  },
  {
    title: '服务地址',
    dataIndex: 'serverAddr',
    width: 200,
    align: 'center',
    customRender: ({ record }) => {
      const port = record.port || 8848;
      const addr = record.serverAddr;
      return h(
        'a',
        {
          href: `http://${addr}:${port}/nacos`,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-blue-600 dark:text-blue-400 font-mono hover:underline',
        },
        `${addr}:${port}`,
      );
    },
  },
  {
    title: '默认命名空间',
    dataIndex: 'namespaceId',
    width: 140,
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 110,
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
    title: '最后探测时间',
    dataIndex: 'lastTestAt',
    width: 170,
    align: 'center',
    customRender: ({ text }) => {
      return h('span', { class: 'font-mono text-xs text-gray-500' }, text || '-');
    },
  },
  {
    title: '备注说明',
    dataIndex: 'remark',
    ellipsis: true,
  },
];

export const searchFormSchema: FormSchema[] = [
  {
    field: 'keyword',
    label: '搜索实例',
    component: 'Input',
    colProps: { span: 8 },
    componentProps: {
      placeholder: '请输入实例名称或服务器地址',
      allowClear: true,
    },
  },
  {
    field: 'envKey',
    label: '所属环境',
    component: 'Select',
    colProps: { span: 6 },
    componentProps: {
      placeholder: '请选择环境',
      allowClear: true,
      options: [
        { label: '开发环境 (dev)', value: 'dev' },
        { label: '测试环境 (test)', value: 'test' },
        { label: '预发环境 (uat)', value: 'uat' },
        { label: '预生产环境 (pre)', value: 'pre' },
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
      placeholder: '例如：生产主 Nacos 集群',
    },
  },
  {
    field: 'envKey',
    label: '所属环境',
    component: 'Select',
    required: true,
    defaultValue: 'dev',
    componentProps: {
      options: [
        { label: '开发环境 (dev)', value: 'dev' },
        { label: '测试环境 (test)', value: 'test' },
        { label: '预发环境 (uat)', value: 'uat' },
        { label: '预生产环境 (pre)', value: 'pre' },
        { label: '生产环境 (prod)', value: 'prod' },
      ],
    },
  },
  {
    field: 'serverAddr',
    label: '服务地址',
    component: 'Input',
    required: true,
    componentProps: {
      placeholder: '例如：192.168.1.100 或 nacos.domain.com',
    },
  },
  {
    field: 'port',
    label: '服务端口',
    component: 'InputNumber',
    required: true,
    defaultValue: 8848,
    componentProps: {
      min: 1,
      max: 65535,
      placeholder: '8848',
      style: { width: '100%' },
    },
  },
  {
    field: 'namespaceId',
    label: '默认命名空间',
    component: 'Input',
    componentProps: {
      placeholder: '如 dev-ns，留空则默认使用 public',
    },
  },
  {
    field: 'username',
    label: '访问账号',
    component: 'Input',
    componentProps: {
      placeholder: '如已开启鉴权请填账号，默认 nacos',
    },
  },
  {
    field: 'password',
    label: '访问密码',
    component: 'InputPassword',
    helpMessage: '编辑时如无需修改密码，保持默认或留空即可',
    componentProps: {
      placeholder: '已开启鉴权请填密码，编辑留空则保持原密码',
    },
  },
  {
    field: 'remark',
    label: '备注说明',
    component: 'InputTextArea',
    componentProps: {
      rows: 3,
      placeholder: '请输入集群用途或说明信息',
    },
  },
];
