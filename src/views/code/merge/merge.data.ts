import { BasicColumn, FormSchema } from '@/components/Table';
import { h } from 'vue';
import { Tag } from 'ant-design-vue';
import { getCodeGitServerList } from '@/api/code/server';
import { getCodeGitRepoList } from '@/api/code/repo';

export const columns: BasicColumn[] = [
  { title: '标题', dataIndex: 'title', width: 220, align: 'left' },
  { 
    title: '分支流向 (Source -> Target)', 
    key: 'branches', 
    width: 250,
  },
  { title: '提交人', dataIndex: 'author', width: 100 },
  { 
    title: '状态', 
    key: 'status', 
    width: 100,
  },
  { title: '更新时间', dataIndex: 'time', width: 150 },
  { title: '操作', key: 'action', width: 200 }
];

export const searchFormSchema: FormSchema[] = [
  {
    field: 'serverId',
    label: '所属Git实例',
    component: 'ApiSelect',
    colProps: { span: 6 },
    componentProps: ({ formModel, formActionType }) => {
      return {
        api: getCodeGitServerList,
        resultField: 'items',
        labelField: 'name',
        valueField: 'id',
        showSearch: true,
        onChange: (e: any) => {
          formModel.repoInfo = undefined; // reset repo
        },
      };
    },
  },
  {
    field: 'repoInfo',
    label: '所属仓库',
    component: 'ApiSelect',
    colProps: { span: 6 },
    componentProps: ({ formModel, formActionType }) => {
      return {
        api: getCodeGitRepoList,
        params: {
          serverId: formModel.serverId,
          pageSize: 1000,
        },
        resultField: 'items',
        labelField: 'name',
        valueField: 'repoInfoValue', 
        showSearch: true,
        onChange: (e: any) => {
          if (formActionType && formActionType.submit) {
            formActionType.submit();
          }
        },
        afterFetch: (res: any) => {
          if (res && Array.isArray(res.items)) {
            res.items = res.items.map((opt: any) => ({
              ...opt,
              repoInfoValue: JSON.stringify({ repoId: opt.id, fullName: opt.fullName })
            }));
          }
          return res;
        }
      };
    },
    ifShow: ({ values }) => !!values.serverId,
  },
  { 
    field: 'status', 
    label: '状态', 
    component: 'Select', 
    componentProps: ({ formActionType }) => ({ 
      options: [
        {label: '待处理', value: 'pending'}, 
        {label: '已合并', value: 'merged'},
        {label: '已关闭', value: 'closed'}
      ],
      onChange: () => {
        if (formActionType && formActionType.submit) {
          formActionType.submit();
        }
      }
    }), 
    colProps: { span: 6 } 
  },
];
