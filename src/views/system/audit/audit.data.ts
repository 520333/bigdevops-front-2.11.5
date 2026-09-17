import { BasicColumn, FormSchema } from '@/components/Table';
import { DescItem } from '@/components/Description';

// ================== 表格列定义 ==================
export const columns: BasicColumn[] = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '操作人',
    dataIndex: 'userName',
    width: 130,
    customRender: ({ record }) => {
      if (record.realName) {
        return `${record.userName} (${record.realName})`;
      }
      return record.userName || '-';
    },
  },
  {
    title: '业务模块',
    dataIndex: 'module',
    width: 120,
  },
  {
    title: '操作动作',
    dataIndex: 'action',
    width: 100,
  },
  {
    title: '请求方法',
    dataIndex: 'method',
    width: 90,
  },
  {
    title: '接口路径',
    dataIndex: 'path',
    width: 240,
    ellipsis: true,
  },
  {
    title: '操作IP',
    dataIndex: 'ip',
    width: 130,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 90,
  },
  {
    title: '耗时',
    dataIndex: 'latency',
    width: 90,
    customRender: ({ text }) => (text !== undefined && text !== null ? `${text} ms` : '-'),
  },
  {
    title: '操作时间',
    dataIndex: 'createdTime',
    width: 160,
  },
];

// ================== 顶部搜索配置 ==================
export const searchFormSchema: FormSchema[] = [
  {
    field: 'userName',
    label: '操作人',
    component: 'Input',
    colProps: { span: 6 },
    componentProps: {
      placeholder: '请输入操作人账号',
    },
  },
  {
    field: 'module',
    label: '业务模块',
    component: 'Select',
    colProps: { span: 6 },
    componentProps: {
      placeholder: '请选择业务模块',
      options: [
        { label: '用户认证', value: '用户认证' },
        { label: '用户管理', value: '用户管理' },
        { label: '角色管理', value: '角色管理' },
        { label: '菜单管理', value: '菜单管理' },
        { label: '接口授权', value: '接口授权' },
        { label: '系统设置', value: '系统设置' },
        { label: 'CMDB服务树', value: 'CMDB服务树' },
        { label: '采集任务', value: '采集任务' },
        { label: '采集池管理', value: '采集池管理' },
        { label: '告警规则', value: '告警规则' },
        { label: '告警发送组', value: '告警发送组' },
        { label: '告警事件', value: '告警事件' },
        { label: '值班排班', value: '值班排班' },
        { label: '工单服务', value: '工单服务' },
        { label: '容器集群', value: '容器集群' },
        { label: '持续交付', value: '持续交付' },
        { label: '任务执行', value: '任务执行' },
      ],
    },
  },
  {
    field: 'status',
    label: '执行状态',
    component: 'Select',
    colProps: { span: 6 },
    componentProps: {
      placeholder: '请选择状态',
      options: [
        { label: '200 (成功)', value: 200 },
        { label: '400 (请求参数错误)', value: 400 },
        { label: '401 (未授权/过期)', value: 401 },
        { label: '403 (权限拒绝)', value: 403 },
        { label: '500 (服务异常)', value: 500 },
      ],
    },
  },
  {
    field: 'dateRange',
    label: '操作时间',
    component: 'RangePicker',
    colProps: { span: 6 },
    componentProps: {
      format: 'YYYY-MM-DD',
      valueFormat: 'YYYY-MM-DD',
      placeholder: ['开始日期', '结束日期'],
    },
  },
];

// ================== 详情抽屉字段描述 ==================
export const detailSchema: DescItem[] = [
  {
    field: 'id',
    label: '日志ID',
  },
  {
    field: 'userName',
    label: '操作人账号',
  },
  {
    field: 'realName',
    label: '操作人姓名',
  },
  {
    field: 'ip',
    label: '操作者IP',
  },
  {
    field: 'module',
    label: '所属业务模块',
  },
  {
    field: 'action',
    label: '操作动作类型',
  },
  {
    field: 'method',
    label: 'HTTP方法',
  },
  {
    field: 'path',
    label: '请求路径',
  },
  {
    field: 'status',
    label: 'HTTP状态码',
  },
  {
    field: 'latency',
    label: '执行耗时',
    render: (val) => (val !== undefined && val !== null ? `${val} ms` : '-'),
  },
  {
    field: 'createdTime',
    label: '操作记录时间',
  },
];
