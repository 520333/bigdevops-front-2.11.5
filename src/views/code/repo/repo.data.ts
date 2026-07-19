import { BasicColumn, FormSchema } from '@/components/Table';
import { h } from 'vue';
import { Tag, Badge } from 'ant-design-vue';
import { getCodeGitServerList } from '@/api/code/server';
import { getGitNamespaces } from '@/api/code/repo'


export const columns: BasicColumn[] = [

  {
    title: '仓库名称',
    dataIndex: 'name',
    width: 150,
  },
  {
    title: '仓库全称',
    dataIndex: 'fullName',
    width: 200,
    align: 'left',
  },
  {
    title: '可见性',
    dataIndex: 'visibility',
    width: 100,
    customRender: ({ record }) => {
      const visibility = record.visibility || 'private';

      let color = 'error';
      let text = '私有';

      if (visibility === 'public') {
        color = 'success';
        text = '公开';
      } else if (visibility === 'internal') {
        color = 'processing';
        text = '内部';
      }

      return h(Tag, { color: color }, () => text);
    },
  },
  {
    title: '默认分支',
    dataIndex: 'defaultBranch',
    width: 100,
  },

  {
    title: 'HTTP克隆地址',
    dataIndex: 'cloneUrlHttp',
    width: 250,
    align: 'left',
  },
  {
    title: 'Git实例',
    dataIndex: 'serverName',
    width: 150,
    auth: 'GET:/api/code/getCodeGitServerList'
  },
  {
    title: '创建人',
    dataIndex: 'createUserName',
    width: 120,
  },
  {
    title: '拥有者(Owner)',
    dataIndex: 'ownerName',
    width: 120,
  },
  {
    title: '拥有者/空间',
    dataIndex: 'namespacePath',
    width: 150,
  },
];


export const searchFormSchema: FormSchema[] = [
  {
    field: 'name',
    label: '仓库名称',
    component: 'Input',
    colProps: { span: 6 },
  },
  {
    field: 'visibility',
    label: '可见性',
    component: 'Select',
    componentProps: {
      showSearch: true,
      options: [
        { label: '公开', value: 'public' },
        { label: '内部', value: 'internal' },
        { label: '私有', value: 'private' },
      ],
    },
    colProps: { span: 8 },
  },
  {
    field: 'namespace',
    label: '群组',
    component: 'Input',
    colProps: { span: 6 },
  },
  {
    field: 'serverId',
    label: '所属Git实例',
    component: 'ApiSelect',
    colProps: { span: 6 },
    componentProps: ({ formActionType }) => {
      return {
        api: getCodeGitServerList,
        resultField: 'items',
        labelField: 'name',
        valueField: 'id',
        showSearch: true,
        onChange: () => {
          if (formActionType && formActionType.submit) {
            formActionType.submit();
          }
        },
      };
    },
  },

];


export const formSchema: FormSchema[] = [
  {
    field: 'serverId',
    label: '所属Git实例',
    component: 'ApiSelect',
    required: true,
    componentProps: ({ formModel }) => {
      return {
        api: getCodeGitServerList,
        labelField: 'name',
        valueField: 'id',
        resultField: 'items',
        showSearch: true,
        optionFilterProp: 'label',
        onChange: () => {
          formModel.namespace = undefined;
        }
      }
    },
  },


  {
    field: 'namespace',
    label: '所属命名空间',
    // ✨ 将 component 改成自定义插槽
    slot: 'customNamespaceSlot',
    required: true,
    // 同样，只有选了服务才显示
    ifShow: ({ values }) => !!values.serverId,
  },
  {
    field: 'name',
    label: '仓库名称',
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
        { label: '公开', value: 'public' },
        { label: '内部', value: 'internal' },
        { label: '私有', value: 'private' },
      ],
    },
  },
  {
    field: 'description',
    label: '描述',
    component: 'InputTextArea',
  },

];