import { BasicColumn, FormSchema } from '@/components/Table';
import { Tag } from 'ant-design-vue';
import { h } from 'vue';
import dayjs from 'dayjs';
export const columns: BasicColumn[] = [
  {
    title: '任务名称',
    dataIndex: 'name',
    width: 180,
  },
  {
    title: '目标集群',
    dataIndex: 'clusterName',
    width: 160,
    customRender: ({ record }) => {
      return h(Tag, { color: 'purple' }, () => record.clusterName || '-');
    },
  },
  {
    title: '关联模板名称',
    dataIndex: 'templateName',
    width: 180,
    customRender: ({ record }) => {
      return h(Tag, { color: 'blue' }, () => record.templateName || '-');
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 110,
    customRender: ({ record }) => {
      const status = (record.status || 'pending').toUpperCase();
      const color = status === 'APPLIED' ? 'green' : status === 'FAILED' ? 'red' : 'orange';
      const text = status === 'APPLIED' ? '已应用 (Applied)' : status === 'FAILED' ? '失败 (Failed)' : '待应用 (Pending)';
      return h(Tag, { color }, () => text);
    },
  },
  {
    title: '创建人',
    dataIndex: 'createUserName',
    width: 150,
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
    label: '任务名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入任务名称搜索',
    },
    colProps: { span: 8 },
  },
  {
    field: 'templateName',
    label: '模板名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入模板名称搜索',
    },
    colProps: { span: 8 },
  },
  {
    field: 'createUserName',
    label: '创建人',
    component: 'Input',
    componentProps: {
      placeholder: '请输入创建人姓名搜索',
    },
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
    field: 'name',
    label: '任务名称',
    component: 'Input',
    required: true,
    componentProps: {
      placeholder: '请输入发布任务名称',
    },
  },
  {
    field: 'clusterName',
    label: '目标集群',
    component: 'ApiSelect',
    required: true,
    componentProps: {
      showSearch: true,
      api: async () => {
        // Will be populated dynamically or via getClusterForSelect
        return [];
      },
      placeholder: '请选择目标 K8s 集群',
    },
  },
  {
    field: 'TemplateId',
    label: '绑定 YAML 模板',
    component: 'ApiSelect',
    required: true,
    componentProps: {
      showSearch: true,
      placeholder: '请选择 YAML 模板',
    },
  },
  {
    field: 'variablesFront',
    label: '模板变量配置',
    helpMessage: '环境变量替换语法: KEY=VALUE (例如: ${APP_NAME}=nginx-web)',
    slot: 'variablesSlot',
    itemProps: {
      htmlFor: 'variables_input',
    },
  },
];
