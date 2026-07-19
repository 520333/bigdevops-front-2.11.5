import { BasicColumn, FormSchema } from '@/components/Table';

export const columns: BasicColumn[] = [
  {
    title: '发布单号',
    dataIndex: 'deployNo',
    width: 150,
  },
  {
    title: '关联工单',
    dataIndex: 'orderNo',
    width: 150,
  },
  {
    title: '应用名称',
    dataIndex: 'appName',
    width: 150,
  },
  {
    title: '部署环境',
    dataIndex: 'envName',
    width: 120,
  },
  {
    title: '发布版本',
    dataIndex: 'version',
    width: 150,
  },
  {
    title: '发布状态',
    dataIndex: 'statusText',
    width: 120,
  },
  {
    title: '发布进度',
    dataIndex: 'progress',
    width: 250,
  },
  {
    title: '耗时',
    dataIndex: 'duration',
    width: 100,
  },
  {
    title: '执行人',
    dataIndex: 'operator',
    width: 120,
  },
  {
    title: '发布时间',
    dataIndex: 'createdAt',
    width: 180,
  },
];

export const searchFormSchema: FormSchema[] = [
  {
    field: 'appName',
    label: '应用名称',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    field: 'envKey',
    label: '部署环境',
    component: 'Select',
    componentProps: {
      options: [
        { label: '开发环境', value: 'dev' },
        { label: '测试环境', value: 'test' },
        { label: '预生产环境', value: 'pre' },
        { label: '生产环境', value: 'prod' },
      ],
    },
    colProps: { span: 8 },
  },
];

export const accountFormSchema: FormSchema[] = [
  {
    field: 'appName',
    label: '应用名称',
    component: 'Input',
    required: true,
  },
  {
    field: 'orderNo',
    label: '关联工单',
    component: 'Input',
    required: true,
  },
  {
    field: 'envKey',
    label: '部署环境',
    component: 'Select',
    required: true,
    componentProps: {
      options: [
        { label: '开发环境', value: 'dev' },
        { label: '测试环境', value: 'test' },
        { label: '预生产环境', value: 'pre' },
        { label: '生产环境', value: 'prod' },
      ],
    },
  },
  {
    field: 'version',
    label: '发布版本',
    component: 'Input',
    required: true,
  },
];
