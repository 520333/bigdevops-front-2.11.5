import { BasicColumn, FormSchema } from '@/components/Table';
import dayjs from 'dayjs';
import { getAccountList, setMonitorPromScrapeJobStatus } from '@/api/demo/system';
import { h } from 'vue';
import { Switch } from 'ant-design-vue';
import { useMessage } from '@/hooks/web/useMessage';

// ================== 列表列配置 ==================
export const columns: BasicColumn[] = [
  {
    title: '值班组名称',
    dataIndex: 'name',
    width: 250,
  },
  {
    title: '成员列表',
    dataIndex: 'userNames',
    width: 200,
  },
  {
    title: '轮班周期(天)',
    dataIndex: 'shiftDays',
    width: 200,
  },
  {
    title: '当天值班人',
    dataIndex: 'toDayOnDutyUser',
    width: 200,
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

          const newEnable = checked ? 1 : 2;
          const { createMessage } = useMessage();

          setMonitorPromScrapeJobStatus(record.id, newEnable)
            .then(() => {
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
    auth: 'POST:/api/monitor/setMonitorOndutyStatus'
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
    label: '值班组名称',
    component: 'Input',
    colProps: { span: 6 },
    componentProps: { placeholder: '请输入值班组名称' }
  },
  {
    field: 'shiftDays',
    label: '轮班周期(天)',
    component: 'Input',
    colProps: { span: 6 },
    componentProps: { placeholder: '请输入轮班周期' }
  },
  {
    field: 'createUserName',
    label: '创建人',
    component: 'Input',
    colProps: { span: 6 },
    componentProps: { placeholder: '请输入创建人' }
  },
  {
    field: 'enable',
    label: '状态',
    component: 'Select',
    colProps: { span: 6 },
    componentProps: {
      placeholder: '请选择状态',
      options: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 2 },
      ],
    }
  }
];

// ================== 新增/编辑弹窗表单配置 ==================
export const formSchema: FormSchema[] = [
  {
    field: 'name',
    label: '值班组名称',
    labelWidth: 120,
    required: true,
    component: 'Input',
    componentProps: {
      placeholder: '请输入值班组名称，例如：数据库运维组',
    }
  },
  {
    field: 'shiftDays',
    label: '轮班周期(天)',
    labelWidth: 120,
    required: true,
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入轮班周期，例如：7',
    }
  },
  {
    field: 'userNames',
    label: '调整值班人',
    labelWidth: 120,
    component: 'ApiSelect',

    componentProps: {
      api: getAccountList,
      mode: 'multiple',
      showSearch: true,
      labelField: "realName",
      valueField: "userName",
      resultField: 'items',

      placeholder: '请选择值班人',

    },
    rules: [
      {
        required: true,
        validator: async (_, value) => {
          if (!value || (Array.isArray(value) && value.length === 0)) {
            return Promise.reject('请选择至少一个值班人');
          }
          return Promise.resolve();
        },
        trigger: 'blur'
      }
    ],
  },
  {
    field: 'enable',
    label: '是否开启',
    component: 'Switch',
    componentProps: {
      checkedValue: 1,
      checkedChildren: '启用',
      unCheckedValue: 2,
      unCheckedChildren: '禁用',
    },
    defaultValue: 1
  }
];

export const ondutyChangeFormSchema: FormSchema[] = [
  {
    field: 'targetUserName',
    label: '替班人员',
    labelWidth: 100,
    component: 'Select',
    componentProps: {
      showSearch: true,
      placeholder: '请选择替班人员',
      options: [],
    },
    rules: [
      {
        required: true,
        validator: async (_, value) => {
          if (!value || (Array.isArray(value) && value.length === 0)) {
            return Promise.reject('请选择替班人员');
          }
          return Promise.resolve();
        },
        trigger: 'blur'
      }
    ],
  },
  {
    field: 'name',
    label: '换班说明',
    component: 'InputTextArea',
    componentProps: {
      placeholder: '请简单说明换班原因（如：事假、调休等）',
      rows: 3,
    },
    rules: [{ required: true, message: '请填写换班说明', trigger: 'blur' }],
  },
];