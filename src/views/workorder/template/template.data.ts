import { BasicColumn, FormSchema } from '@/components/Table';
import dayjs from 'dayjs';
// 引入关联下拉框需要的接口
import { getFormDesignList, getProcessList } from '@/api/demo/system';

// ================== 列表列配置 ==================
export const columns: BasicColumn[] = [
  {
    title: '模板ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '工单模板名称',
    dataIndex: 'name',
    width: 250,
    align: 'left',
  },
  {
    title: '关联表单设计',
    dataIndex: 'formDesignName',
    width: 200,
  },
  {
    title: '关联审批流程',
    dataIndex: 'processName',
    width: 200,
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
    label: '模板名称',
    component: 'Input',
    colProps: { span: 8 },
    componentProps: { placeholder: '请输入模板名称' }
  },
  {
    field: 'createUserName',
    label: '创建人',
    component: 'Input',
    colProps: { span: 8 },
    componentProps: { placeholder: '请输入创建人' }
  }
];

// ================== 新增/编辑弹窗表单配置 ==================
export const formSchema: FormSchema[] = [
  {
    field: 'name',
    label: '模板名称',
    required: true,
    component: 'Input',
    componentProps: {
      placeholder: '请输入工单模板名称（如：ECS申请模板）'
    }
  },
  {
    field: 'FormDesignID',
    label: '关联表单',
    required: true,
    component: 'ApiSelect',
    componentProps: {
      api: getFormDesignList,
      labelField: 'name',
      valueField: 'id',
      resultField: 'items', // 我们之前改造 formDesign 返回了 items
      showSearch: true,
      placeholder: '请下拉选择关联的表单设计'
    },
  },
  {
    field: 'ProcessID',
    label: '关联审批流',
    required: true,
    component: 'ApiSelect',
    componentProps: {
      api: getProcessList,
      labelField: 'name',
      valueField: 'id',
      // 如果 process 返回的也是带 items 分页，填 items；如果是直接返回数组，填空或去掉本行
      resultField: 'items',
      showSearch: true,
      placeholder: '请下拉选择绑定的工作审批流'
    },
  },
];