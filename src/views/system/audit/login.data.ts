import { BasicColumn, FormSchema } from '@/components/Table';

// ================== 登录日志表格列定义 ==================
export const loginColumns: BasicColumn[] = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '登录账号',
    dataIndex: 'userName',
    width: 140,
    customRender: ({ record }) => {
      if (record.realName) {
        return `${record.userName} (${record.realName})`;
      }
      return record.userName || '-';
    },
  },
  {
    title: '登录方式',
    dataIndex: 'loginType',
    width: 110,
  },
  {
    title: '登录IP',
    dataIndex: 'ip',
    width: 130,
  },
  {
    title: '操作系统',
    dataIndex: 'os',
    width: 120,
  },
  {
    title: '浏览器',
    dataIndex: 'browser',
    width: 130,
  },
  {
    title: '登录状态',
    dataIndex: 'status',
    width: 100,
  },
  {
    title: '操作信息',
    dataIndex: 'message',
    width: 200,
    ellipsis: true,
  },
  {
    title: '登录时间',
    dataIndex: 'createdTime',
    width: 160,
  },
];

// ================== 登录日志搜索表单配置 ==================
export const loginSearchFormSchema: FormSchema[] = [
  {
    field: 'userName',
    label: '登录账号',
    component: 'Input',
    colProps: { span: 6 },
    componentProps: {
      placeholder: '请输入账号或姓名',
    },
  },
  {
    field: 'loginType',
    label: '登录方式',
    component: 'Select',
    colProps: { span: 6 },
    componentProps: {
      placeholder: '请选择登录方式',
      options: [
        { label: '密码登录', value: '密码登录' },
        { label: 'OIDC单点', value: 'OIDC单点' },
        { label: '钉钉扫码', value: '钉钉扫码' },
        { label: '退出登录', value: '退出登录' },
        { label: '强退下线', value: '强退下线' },
      ],
    },
  },
  {
    field: 'status',
    label: '登录状态',
    component: 'Select',
    colProps: { span: 6 },
    componentProps: {
      placeholder: '请选择状态',
      options: [
        { label: '成功 (1)', value: 1 },
        { label: '失败 (0)', value: 0 },
      ],
    },
  },
  {
    field: 'dateRange',
    label: '登录时间',
    component: 'RangePicker',
    colProps: { span: 6 },
    componentProps: {
      format: 'YYYY-MM-DD',
      valueFormat: 'YYYY-MM-DD',
      placeholder: ['开始日期', '结束日期'],
    },
  },
];
