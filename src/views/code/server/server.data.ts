import { BasicColumn, FormSchema } from '@/components/Table';
import dayjs from 'dayjs';
// ================== 列表列配置 ==================
export const columns: BasicColumn[] = [
  { title: '实例名称', dataIndex: 'name', width: 200, align: 'left' },
  { title: '类型', dataIndex: 'platform', width: 100 },
  { title: 'API 服务地址', dataIndex: 'endpoint', width: 280, align: 'left' },
  { title: '连通状态', dataIndex: 'status', width: 130 },
  {
    title: '创建时间',
    dataIndex: 'CreatedAt',
    format: (text) => {
      return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '';
    },
    width: 160,
  },
  { title: '创建人', dataIndex: 'createUserName', width: 130, },
];

// ================== 顶部搜索配置 ==================
export const searchFormSchema: FormSchema[] = [
  { field: 'name', label: '实例名称', component: 'Input', colProps: { span: 6 } },
  { field: 'platform', label: '实例类型', component: 'Select', componentProps: { options: [{ label: 'GitLab', value: 'gitlab' }, { label: 'Gitea', value: 'gitea' }] }, colProps: { span: 6 } },
  { field: 'endpoint', label: '服务器地址', component: 'Input', colProps: { span: 6 } },
];

// ================== 告警屏蔽弹窗表单配置 ==================
export const formSchema: FormSchema[] = [
  {
    field: 'name',
    label: '实例名称',
    component: 'Input',
    required: true,
    componentProps: { placeholder: '例如：集团 GitLab / 团队 Gitea' }
  },
  {
    field: 'platform',
    label: '实例类型',
    component: 'Select',
    required: true,
    defaultValue: 'gitlab',
    componentProps: {
      options: [
        { label: 'GitLab Enterprise / Community', value: 'gitlab' },
        { label: 'Gitea (Self-hosted Git)', value: 'gitea' },
      ],
    },
  },
  {
    field: 'endpoint',
    label: 'API 服务地址',
    component: 'Input',
    required: true,
    componentProps: { placeholder: '例如：https://gitlab.example.com 或 http://192.168.1.100:3000' },
    helpMessage: '必须是可以通过平台后台网络直接访问的 HTTP/HTTPS 根路径，无需追加 /api/v4 等后缀。'
  },
  {
    field: 'token',
    label: 'Access Token',
    component: 'InputPassword',
    required: true,
    componentProps: { placeholder: '请输入具有 API 读写权限的个人访问令牌' },
    helpMessage: 'GitLab 请勾选 "api" 权限；Gitea 请在个人设置->应用令牌中生成，勾选 "write:repository" 权限。'
  },
  {
    field: 'description',
    label: '描述备注',
    component: 'InputTextArea',
    componentProps: { rows: 3 }
  },
  // {
  //   field: 'id',
  //   label: 'id',
  //   component: 'Input',
  //   ifShow: false
  // }
]