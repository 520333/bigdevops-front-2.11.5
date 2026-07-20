import { BasicColumn, FormSchema } from '@/components/Table';
import { Tag, Tooltip } from 'ant-design-vue';
import { h } from 'vue';
import dayjs from 'dayjs';


export const columns: BasicColumn[] = [
  {
    title: '英文名称',
    dataIndex: 'name',
    width: 150,
  },
  {
    title: '集群中文名',
    dataIndex: 'nameZh',
    width: 150,
  },
  {
    title: '部署环境',
    dataIndex: 'env',
    width: 100,
  },
  {
    title: 'ApiServer 地址',
    dataIndex: 'apiServerAddr',
    width: 200,
  },
  {
    title: '集群版本',
    dataIndex: 'version',
    width: 100,
  },
  {
    title: '集群状态',
    dataIndex: 'lastProbSuccess',
    width: 100,
    customRender: ({ record }) => {
      const success = record.lastProbSuccess;
      const color = success ? 'green' : 'red';
      const text = success ? '正常' : '异常';
      const errMsg = record.LastProbErrMsg;
      const tagEl = h(Tag, { color: color }, () => text);
      if (!success && errMsg) {
        return h(Tooltip, { title: errMsg }, () => tagEl);
      }
      return tagEl;
    },
  },
  {
    title: '超时时间(秒)',
    dataIndex: 'actionTimeoutSeconds',
    width: 120,
  },
  {
    title: '创建人',
    dataIndex: 'createUserName',
    width: 120,
  },
  {
    title: '创建时间',
    dataIndex: 'CreatedAt',
    format: (text) => {
      return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '';
    },
    width: 160,
  },
];

export const searchFormSchema: FormSchema[] = [
  {
    field: 'name',
    label: '集群名',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    field: 'createUserName',
    label: '创建人',
    component: 'Input',
    colProps: { span: 8 },
  },
];

export const formSchema: FormSchema[] = [
  {
    field: 'id',
    label: 'ID',
    component: 'Input',
    show: false,
  },
  {
    field: 'nameZh',
    label: '集群名称(中)',
    component: 'Input',
    required: true,
    colProps: { span: 12 },
  },
  {
    field: 'name',
    label: 'Kubeconfig名称',
    component: 'Input',
    required: true,
    helpMessage: '例如: config-dev',
    colProps: { span: 12 },
  },
  {
    field: 'env',
    label: '所属环境',
    component: 'Select',
    required: true,
    componentProps: {
      options: [
        { label: '开发环境(dev)', value: 'dev' },
        { label: '测试环境(test)', value: 'test' },
        { label: '预发环境(pre)', value: 'pre' },
        { label: '生产环境(prod)', value: 'prod' },
      ],
    },
    colProps: { span: 12 },
  },
  {
    field: 'actionTimeoutSeconds',
    label: '操作超时(秒)',
    component: 'InputNumber',
    defaultValue: 5,
    required: true,
    componentProps: {
      style: { width: '100%' },
    },
    colProps: { span: 12 },
  },
  {
    field: 'kubeConfigContent',
    label: 'KubeConfig 内容',
    slot: 'kubeconfigSlot',
    required: true,
    itemProps: {
      htmlFor: 'codemirror_kubeconfig_input',
    },
  },
];
