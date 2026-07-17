import { getAccountList } from '@/api/demo/system';
// import { BasicColumn } from '@/components/Table/src/types/table';
import { FormSchema } from '@/components/Table';
export const formSchema: FormSchema[] = [
  {
    field: 'title',
    label: '名称',
    labelWidth: 200,
    colProps: { span: 24 },
    rules: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    component: 'Input',
    required: true,
  },
  {
    field: 'desc',
    label: '描述',
    labelWidth: 200,
    colProps: { span: 24 },
    rules: [{ required: true, message: '请输入描述', trigger: 'blur' }],
    component: 'Input',
    required: true,
  },
  {
    field: 'isLeaf',
    label: '是否为叶子节点',
    labelWidth: 200,
    component: 'RadioButtonGroup',
    defaultValue: false,
    componentProps: {
      options: [
        { label: '是', value: true },
        { label: '否', value: false },
      ],
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
  },
  {
    field: 'desc',
    label: '部门或项目描述',
    rules: [{ required: true, message: '请输入描述', trigger: 'blur' }],
    component: 'Input',
    required: true,
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

    },

  },
];


// export function getBasicColumnsEcsTable(): BasicColumn[] {
//   return [
//     {
//       title: 'ID',
//       dataIndex: 'id',
//       fixed: 'left',
//       width: 200,
//     },
//     {
//       title: '姓名',
//       dataIndex: 'name',
//       width: 150,
//       filters: [
//         { text: 'Male', value: 'male' },
//         { text: 'Female', value: 'female' },
//       ],
//     },
//     {
//       title: '地址',
//       dataIndex: 'address',
//     },
//     {
//       title: '编号',
//       dataIndex: 'no',
//       width: 150,
//       sorter: true,
//       defaultHidden: true,
//     },
//     {
//       title: '开始时间',
//       width: 150,
//       sorter: true,
//       dataIndex: 'beginTime',
//     },
//     {
//       title: '结束时间',
//       width: 150,
//       sorter: true,
//       dataIndex: 'endTime',
//     },
//   ];
// }


// export const getAdvanceSchema = (itemNumber = 6): FormSchema[] => {
//   const arr: any = [];
//   for (let index = 0; index < itemNumber; index++) {
//     arr.push({
//       field: `field${index}`,
//       label: `字段${index}`,
//       component: 'Input',
//       colProps: {
//         xl: 12,
//         xxl: 8,
//       },
//     });
//   }
//   return arr;
// };
// export function getFormConfigEcsTable(): Partial<FormProps> {
//   return {
//     labelWidth: 100,
//     schemas: [
//       ...getAdvanceSchema(1),
//       {
//         field: `field11`,
//         label: `Slot示例`,
//         component: 'Select',
//         slot: 'custom',
//         colProps: {
//           xl: 12,
//           xxl: 8,
//         },
//       },
//     ],
//   };
// }
// export const searchFormSchemaEcs: FormSchema[] = [
//   {
//     field: 'userName',
//     label: '用户名',
//     component: 'Input',
//     colProps: { span: 8 },
//   },

//   {
//     field: 'realName',
//     label: '昵称',
//     component: 'Input',
//     colProps: { span: 8 },
//   },
// ];