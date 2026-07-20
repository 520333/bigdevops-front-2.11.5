import { BasicColumn, FormSchema } from '@/components/Table';
import { Tag } from 'ant-design-vue';
import { h } from 'vue';
import dayjs from 'dayjs';
import Icon from '@/components/Icon/Icon.vue';
export const columns: BasicColumn[] = [
  {
    title: '中文名称',
    dataIndex: 'title',
    width: 200,
    align: 'left',
    customRender: ({ record }) => {
      const isParent = record.type === '0';
      return h('div', { class: 'flex items-center' }, [
        h(Icon, {
          icon: isParent ? 'ant-design:folder-open-filled' : 'ant-design:link-outlined',
          style: {
            marginRight: '8px',
            color: isParent ? '#faad14' : '#8c8c8c',
            fontSize: isParent ? '16px' : '14px'
          },
        }),
        h('span', { style: { fontWeight: isParent ? 'bold' : 'normal' } }, record.title),
      ]);
    },
  },
  {
    title: 'id',
    dataIndex: 'id',
    width: 30,
  },
  {
    title: 'api路径',
    dataIndex: 'path',
    width: 180,
  },
  {
    title: 'http方法',
    dataIndex: 'method',
    width: 50,
    customRender: ({ record }) => {
      const method = record.method;
      const colorMap = {
        ALL: 'green',
        GET: 'green',
        POST: 'blue',
        PUT: 'orange',
        DELETE: 'red',
        PATCH: 'cyan',
        HEAD: 'purple',
        OPTIONS: 'purple',
        CONNECT: 'default',
        TRACE: 'default',
      };
      return h(Tag, { color: colorMap[method] || 'purple' }, () => method);
    },
  },
  {
    title: '上级id',
    dataIndex: 'pId',
    width: 30,
  },

  {
    title: '创建时间',
    dataIndex: 'CreatedAt',
    width: 100,
    format: (text) => {
      return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss.SSS') : '';
    },
  },
];

const isFather = (type: string) => type === '0';
const isChild = (type: string) => type === '1';

export const searchFormSchema: FormSchema[] = [
  {
    field: 'name',
    label: '菜单名称',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    componentProps: {
      options: [
        { label: '启用', value: '0' },
        { label: '停用', value: '1' },
      ],
    },
    colProps: { span: 8 },
  },
];

export const formSchema: FormSchema[] = [
  {
    field: 'type',
    label: 'api类型',
    defaultValue: '0',
    component: 'RadioButtonGroup',
    componentProps: {
      options: [
        { label: '父级', value: '0' },
        { label: '子级', value: '1' },
      ],
    },
    colProps: { span: 8 },
    required: true,
  },
  {
    field: 'title',
    label: '名称',
    rules: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    component: 'Input',
    required: true,
  },
  {
    field: 'path',
    label: 'api路径',
    rules: [{ required: true, message: '请输入api路径', trigger: 'blur' }],
    component: 'Input',
    required: true,
  },
  {
    field: 'pId',
    label: '上级菜单',
    component: 'TreeSelect',
    componentProps: {
      fieldNames: {
        label: 'title',
        value: 'id',
      },
      getPopupContainer: () => document.body,
    },
    ifShow: ({ values }) => !isFather(values.type),
    required: true,
  },
  {
    field: 'method',
    defaultValue: 'GET',
    component: 'Select',
    label: 'http方法',
    colProps: { span: 24 },
    componentProps: {
      options: [
        { label: 'ALL', value: 'ALL' },
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' },
        { label: 'PATCH', value: 'PATCH' },
        { label: 'HEAD', value: 'HEAD' },
        { label: 'OPTIONS', value: 'OPTIONS' },
        { label: 'CONNECT', value: 'CONNECT' },
        { label: 'TRACE', value: 'TRACE' },

      ],
    },
  },
  {
    field: 'id',
    label: 'id',
  },
];