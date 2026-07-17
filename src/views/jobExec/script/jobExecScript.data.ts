import { BasicColumn, FormSchema } from '@/components/Table';
import dayjs from 'dayjs';
// 引入关联下拉框需要的接口
import { getJobExecScriptList, getProcessList } from '@/api/demo/system';
import { colProps } from 'ant-design-vue/lib/grid/Col';

// ================== 列表列配置 ==================
export const columns: BasicColumn[] = [
  {
    title: '脚本ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '脚本名称',
    dataIndex: 'name',
    width: 250,
    align: 'left',
  },
  {
    title: '脚本类型',
    dataIndex: 'lang',
    width: 120,
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
    width: 160,
  },
];


// ================== 顶部搜索配置 ==================
export const searchFormSchema: FormSchema[] = [
  {
    field: 'name',
    label: '脚本名称',
    component: 'Input',
    colProps: { span: 8 },
    componentProps: { placeholder: '请输入脚本名称' }
  },
  {
    field: 'lang',
    label: '脚本类型',
    component: 'Select',
    defaultValue: '',
    colProps: { span: 8 },
    componentProps: { 
      options: [
        { label: 'shell', value: 'shell' }, 
        { label: 'python', value: 'python' },
        { label: 'ansible', value: 'ansible' },
        { label: 'json', value: 'json' }
      ] 
    }
  },

];


// ================== 新增/编辑弹窗表单配置 ==================
export const formSchema: FormSchema[] = [
  {
    field: 'name',
    label: '脚本名称',
    required: true,
    component: 'Input',
    componentProps: {
      placeholder: '请输入脚本名称'
    }
  },
  {
    field: 'lang',
    label: '脚本类型',
    component: 'Select',
    defaultValue: 'shell',
    colProps: { span: 8 },
    componentProps: { 
      options: [
        { label: 'shell', value: 'shell' }, 
        { label: 'python', value: 'python' },
        { label: 'ansible', value: 'ansible' },
        { label: 'json', value: 'json' }

      ] 
    }
  },
];