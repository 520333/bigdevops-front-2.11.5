import { FormSchema } from '@/components/Form';

export const formSchema: FormSchema[] = [
  {
    field: 'passwordOld',
    label: '当前密码',
    component: 'InputPassword',
    required: true,
  },
  {
    field: 'passwordNew',
    label: '新密码',
    component: 'StrengthMeter',
    componentProps: {
      placeholder: '新密码',
    },
    rules: [
      {
        required: true,
        message: '请输入新密码',
      },
    ],
    dynamicRules: ({ values }) => {
      return [
        {
          required: true,
          validator: (_, value) => {
            if (!value) {
              return Promise.reject('请输入新密码');
            }
            // 💡 新增：长度校验
            if (value.length < 3) {
              return Promise.reject('新密码长度不能少于3位');
            }
            // 增加新旧密码一致性校验
            if (value === values.passwordOld) {
              return Promise.reject('新密码不能与当前密码相同!');
            }
            return Promise.resolve();
          },
        },
      ];
    },
  },
  {
    field: 'confirmPassword',
    label: '确认密码',
    component: 'InputPassword',

    dynamicRules: ({ values }) => {
      return [
        {
          required: true,
          validator: (_, value) => {
            if (!value) {
              return Promise.reject('密码不能为空');
            }
            if (value !== values.passwordNew) {
              return Promise.reject('两次输入的密码不一致!');
            }
            return Promise.resolve();
          },
        },
      ];
    },
  },
];
