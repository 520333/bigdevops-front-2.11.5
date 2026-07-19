import { BasicColumn, FormSchema } from '@/components/Table';
import { getCodeGitServerList } from '@/api/code/server';

export const searchFormSchema: FormSchema[] = [
  {
    field: 'serverId',
    label: '所属Git实例',
    component: 'ApiSelect',
    required: true,
    colProps: { span: 8 },
    componentProps: ({ formActionType }) => {
      return {
        api: getCodeGitServerList,
        labelField: 'name',
        valueField: 'id',
        resultField: 'items',
        showSearch: true,
        optionFilterProp: 'label',
        onChange: () => {
          if (formActionType && formActionType.submit) {
            formActionType.submit();
          }
        },
      };
    },
  },
  { field: 'username', label: '用户名', component: 'Input', colProps: { span: 4 } },
  { field: 'name', label: '姓名', component: 'Input', colProps: { span: 4 } },
  { field: 'email', label: '邮箱', component: 'Input', colProps: { span: 4 } },
  { 
    field: 'state', 
    label: '状态', 
    component: 'Select', 
    componentProps: {
      options: [
        { label: '正常', value: 'active' },
        { label: '禁用', value: 'blocked' },
        { label: '封禁', value: 'banned' },
      ],
    },
    colProps: { span: 4 } 
  },
];

export const columns: BasicColumn[] = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '用户名', dataIndex: 'username', width: 150 },
  { title: '姓名', dataIndex: 'name', width: 150 },
  { title: '邮箱', dataIndex: 'email', width: 200 },
  {
    title: '状态', 
    dataIndex: 'state', 
    width: 100,
    customRender: ({ text }) => {
      if (text === 'active') {
        return '正常';
      }
      if (text === 'blocked' || text === 'inactive') {
        return '已禁用';
      }
      if (text === 'banned') {
        return '已封禁';
      }
      return text;
    },
  },
];

export const formSchema: FormSchema[] = [
  {
    field: 'serverId',
    label: '所属Git实例',
    component: 'ApiSelect',
    required: true,
    componentProps: {
      api: getCodeGitServerList,
      labelField: 'name',
      valueField: 'id',
      resultField: 'items',
      showSearch: true,
      optionFilterProp: 'label',
    },
  },
  {
    field: 'username',
    label: '用户名',
    component: 'Input',
    required: true,
    dynamicDisabled: ({ values }) => !!values.isUpdate, // Username usually can't be changed after creation easily, or just visually disable
  },
  {
    field: 'name',
    label: '姓名',
    component: 'Input',
    required: true,
  },
  {
    field: 'email',
    label: '邮箱',
    component: 'Input',
    required: true,
  },
  {
    field: 'state',
    label: '状态',
    component: 'RadioButtonGroup',
    defaultValue: 'active',
    componentProps: {
      options: [
        { label: '正常', value: 'active' },
        { label: '禁用', value: 'blocked' },
        { label: '封禁', value: 'banned' },
      ],
    },
    ifShow: ({ values }) => !!values.isUpdate,
  },
  {
    field: 'isUpdate',
    label: '',
    component: 'Switch',
    ifShow: false,
  },
  {
    field: 'password',
    label: '密码',
    component: 'InputPassword',
    helpMessage: '创建时必填，更新时不填表示不修改密码',
    required: ({ values }) => !values.isUpdate,
  },
];
