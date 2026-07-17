import { BasicColumn, FormSchema } from '@/components/Table';
import { getAllUserAndRoles } from '@/api/demo/system';
import dayjs from 'dayjs';

// ==================== 表格列配置 ====================
export const columns: BasicColumn[] = [
  {
    title: '表单ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '表单名称',
    dataIndex: 'name',
    width: 300,
    align: 'left',
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
    width: 180,
  },
];

// ==================== 顶部搜索表单配置 ====================
export const searchFormSchema: FormSchema[] = [
  {
    field: 'name',
    label: '表单名称',
    component: 'Input',
    colProps: { span: 8 },
    componentProps: {
      placeholder: '请输入表单名称进行查询',
    },
  },
  {
    field: 'createUserName',
    label: '创建人',
    component: 'ApiSelect',
    componentProps: {
      api: getAllUserAndRoles,
      labelField: 'label',
      valueField: 'value',
      showSearch: true,
      optionFilterProp: 'label',
      placeholder: '请选择创建人',
    },
    colProps: { span: 8 },
  }
];