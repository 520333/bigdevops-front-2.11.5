import dayjs from 'dayjs';
import { getAllRoleList, isAccountExist, setAccountStatus } from '@/api/demo/system';
import { BasicColumn, FormSchema } from '@/components/Table';
import { h } from 'vue';
import { Switch } from 'ant-design-vue';
import { useMessage } from '@/hooks/web/useMessage';

export const columns: BasicColumn[] = [

  {
    title: '用户名',
    dataIndex: 'userName',
    width: 200,
  },

  {
    title: '昵称',
    dataIndex: 'realName',
    width: 160,
  },
  {
    title: '手机号',
    dataIndex: 'mobile',
    width: 150,
  },
  {
    title: '飞书userId',
    dataIndex: 'feiShuUserId',
    width: 160,
  },
  {
    title: '角色列表',
    dataIndex: 'roles',
    width: 200,
  },
  {
    title: '备注',
    dataIndex: 'desc',
    width: 200
  },
  {
    title: '状态',
    dataIndex: 'enable',
    width: 120,
    customRender: ({ record }) => {
      if (!Reflect.has(record, 'pendingStatus')) {
        record.pendingStatus = false;
      }
      return h(Switch, {
        checked: record.enable === 1,

        checkedChildren: '启用',
        unCheckedChildren: '禁用',

        loading: record.pendingStatus,
        onChange(checked: boolean) {
          record.pendingStatus = true;

          // 💡 修改 4：根据开关状态获取新的 enable 值 (1=开启，2=禁用)
          const newEnable = checked ? 1 : 2;
          const { createMessage } = useMessage();

          // 💡 修改 5：这里调用你更新采集任务状态的 API
          setAccountStatus(record.id, newEnable)
            .then(() => {
              // 💡 修改 6：更新本地数据，使页面状态刷新
              record.enable = newEnable;
              createMessage.success(`状态修改成功`);
            })
            .catch(() => {
              createMessage.error('状态修改失败');
            })
            .finally(() => {
              record.pendingStatus = false;
            });
        },
      });
    },
    auth: 'POST:/api/system/setAccountStatus'
  },
  {
    title: '创建时间',
    dataIndex: 'CreatedAt',
    width: 180,
    format: (text) => {
      return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss.SSS') : '';
    },
  },

];

export const searchFormSchema: FormSchema[] = [
  {
    field: 'userName',
    label: '用户名',
    component: 'Input',
    colProps: { span: 8 },
  },

  {
    field: 'realName',
    label: '昵称',
    component: 'Input',
    colProps: { span: 8 },
  },
];

export const accountFormSchema: FormSchema[] = [
  {
    field: 'userName',
    label: '用户名',
    component: 'Input',
    helpMessage: ['用户名不允许重复'],
    componentProps: {
      autocomplete: 'username',
    },
    rules: [
      {
        required: true,
        message: '请输入用户名',
      },

      {
        trigger: 'blur',
        validator(_, value) {
          return new Promise((resolve, reject) => {
            isAccountExist(value)
              .then(() => resolve())
              .catch((err) => reject(err.message || '验证失败'));
          });
        },
      },
    ],
  },
  {
    field: 'password',
    label: '密码',
    component: 'InputPassword',
    required: true,
    ifShow: true,
    componentProps: {
      autocomplete: 'current-password',
      placeholder: '请输入密码',
    },

  },
  {
    field: 'homePath',
    label: 'homePath',
    component: 'Input',
    ifShow: false
  },
  {
    label: '角色',
    field: 'roles',
    component: 'ApiSelect',
    required: true,
    componentProps: {
      api: getAllRoleList,
      mode: "multiple",
      labelField: 'roleName',
      valueField: 'roleValue',
      showSearch: true,
      filterOption: (input: string, option: any) => {
        const keyword = input.toLowerCase();
        const label = String(option.label || '').toLowerCase();
        const value = String(option.value || '').toLowerCase();
        return label.includes(keyword) || value.includes(keyword);
      },
    },
    rules: [
      {
        required: true,
        validator: async (_, value) => {
          if (!value || (Array.isArray(value) && value.length === 0)) {
            return Promise.reject('请选择至少一个角色');
          }
          return Promise.resolve();
        },
        trigger: 'blur'
      }
    ],
  },

  {
    field: 'realName',
    label: '昵称',
    component: 'Input',
    required: true,
  },
  {
    field: 'mobile',
    label: '手机号',
    component: 'Input',
    rules: [
      {
        pattern: /^1[3-9]\d{9}$/,
        message: '请输入正确的11位手机号码',
        trigger: 'blur',
      },
    ],
    helpMessage: ['用于钉钉告警时@某人'],
    componentProps: {
      autocomplete: 'mobile',
    },
  },
  {
    field: 'feiShuUserId',
    label: '飞书用户id',
    component: 'Input',
    // required: true,
  },

  {
    label: '备注',
    field: 'desc',
    component: 'InputTextArea',
  },
  {
    label: 'enable',
    field: 'enable',
    component: 'Input',
    ifShow: false
  },
  {
    field: 'id',
    label: 'id',
    component: 'InputNumber',
    ifShow: false,
  }
];

export const baseSetSchemas: FormSchema[] = [
  {
    field: 'realName',
    component: 'Input',
    label: '用户昵称/姓名',
    colProps: { span: 18 },
    required: true,
  },
  {
    field: 'mobile',
    component: 'Input',
    label: '手机号码',
    colProps: { span: 18 },
    rules: [
      {
        pattern: /^1[3-9]\d{9}$/,
        message: '请输入正确的11位手机号码',
        trigger: 'blur',
      },
    ],
  },
  {
    field: 'email',
    component: 'Input',
    label: '邮箱地址',
    colProps: { span: 18 },
    rules: [{ type: 'email', message: '请输入正确的邮箱格式' }],
  },
  {
    field: 'feiShuUserId',
    component: 'Input',
    label: '飞书 UserID',
    colProps: { span: 18 },
  },
  {
    field: 'homePath',
    component: 'Input',
    label: '默认首页',
    colProps: { span: 18 },
  },
  {
    field: 'desc',
    component: 'InputTextArea',
    label: '个人介绍',
    colProps: { span: 18 },
  },
];
