import { getAccountList } from '@/api/demo/system';
// import { BasicColumn } from '@/components/Table/src/types/table';
import { FormSchema } from '@/components/Table';
export const formSchema: FormSchema[] = [
  {
    field: 'title',
    label: '名称',
    colProps: { span: 24 },
    rules: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    component: 'Input',
    required: true,
    componentProps: {
      placeholder: '请输入名称',
    },
  },
  {
    field: 'desc',
    label: '描述',
    colProps: { span: 24 },
    rules: [{ required: true, message: '请输入描述', trigger: 'blur' }],
    component: 'Input',
    required: true,
    componentProps: {
      placeholder: '请输入描述',
    },
  },
  {
    field: 'isLeaf',
    label: '是否为叶子节点',
    component: 'Switch',
    defaultValue: false,
    componentProps: {
      checkedChildren: '是',
      unCheckedChildren: '否',
    },
    helpMessage: '只有叶子节点才可以绑定资源(树PGA模型)'
  },
  {
    field: 'ops_admin_users',
    label: '运维负责人',
    component: 'ApiSelect',
    componentProps: {
      api: getAccountList,
      mode: 'multiple',
      resultField: 'result',
      labelField: 'realName',
      valueField: 'userName',
      placeholder: '请选择运维负责人',
    },
  },
];

export const modalFormSchema: FormSchema[] = [
  {
    field: 'title',
    label: '树节点标识',
    rules: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    component: 'Input',
    required: true,
    dynamicDisabled: ({ values }) => {
      return !!values.id;
    },
    componentProps: {
      placeholder: '请输入树节点标识',
    },
  },
  {
    field: 'desc',
    label: '部门或项目描述',
    rules: [{ required: true, message: '请输入描述', trigger: 'blur' }],
    component: 'Input',
    required: true,
    componentProps: {
      placeholder: '请输入描述',
    },
  },
  // {
  //   field: 'id',
  //   label: 'ID',
  //   component: 'Input',
  //   ifShow: false,
  // },
  {
    field: 'level',
    label: 'level',
    component: 'Input',
    ifShow: false,
  },
  {
    field: 'pId',
    label: 'pId',
    component: 'Input',
    ifShow: false,
  },
  {
    field: 'ops_admin_users',
    label: '运维负责人',
    component: 'ApiSelect',
    componentProps: {
      api: getAccountList,
      mode: 'multiple',
      resultField: 'result',
      labelField: 'realName',
      valueField: 'userName',
      placeholder: '请选择运维负责人',
    },
  },
];