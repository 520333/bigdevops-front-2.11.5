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
  { field: 'name', label: '名称', component: 'Input', colProps: { span: 5 } },
  { 
    field: 'kind', 
    label: '类型', 
    component: 'Select', 
    componentProps: {
      options: [
        { label: '个人(User)', value: 'user' },
        { label: '组织(Group/Org)', value: 'group' }, // 实际上 GitLab 是 group，Gitea 是 org
      ],
    },
    colProps: { span: 5 } 
  },
];

export const columns: BasicColumn[] = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '名称', dataIndex: 'name', width: 200 },
  { title: '路径(Path)', dataIndex: 'path', width: 200 },
  { 
    title: '类型', 
    dataIndex: 'kind', 
    width: 100,
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
    field: 'name',
    label: '名称',
    component: 'Input',
    required: true,
  },
  {
    field: 'path',
    label: '路径 (Path)',
    component: 'Input',
    required: true,
  },
  {
    field: 'visibility',
    label: '可见性',
    component: 'Select',
    defaultValue: 'private',
    componentProps: {
      options: [
        { label: '公开 (Public)', value: 'public' },
        { label: '内部 (Internal)', value: 'internal' },
        { label: '私有 (Private)', value: 'private' },
      ],
    },
  },
];
