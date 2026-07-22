import { BasicColumn, FormSchema } from '@/components/Table';
import dayjs from 'dayjs';

export const columns: BasicColumn[] = [
  {
    title: 'YAML 模板名称',
    dataIndex: 'name',
    width: 220,
  },
  {
    title: '创建人',
    dataIndex: 'createUserName',
    width: 160,
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
    label: '模板名称',
    component: 'Input',
    required: true,
    componentProps: {
      placeholder: '请输入 YAML 模板名称',
    },
  },
  {
    field: 'content',
    label: 'YAML 原始内容',
    component: 'Input',
    slot: 'yamlContentSlot',
    required: true,
    itemProps: {
      htmlFor: 'codemirror_yaml_template_input',
    },
  },
];
