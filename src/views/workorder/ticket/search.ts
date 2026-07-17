import { h } from 'vue';
import { Tag } from 'ant-design-vue';
import { BasicColumn, FormSchema } from '@/components/Table';
import { getAllUserAndRoles } from '@/api/demo/system';
import dayjs from 'dayjs';

export const columns: BasicColumn[] = [
  { title: '工单标题', dataIndex: 'title', width: 200 },
  { title: '申请人', dataIndex: 'createUserName', width: 120 },
  { title: '期望完成时间', dataIndex: 'desireFinishTime', width: 150, format: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-' },
  { 
    title: '当前状态', 
    dataIndex: 'status', 
    width: 120, 
    customRender: ({ record }) => {
      const status = record.status;
      let color = 'blue';
      let label = status;
      
      switch (status) {
        case 'pendingApproval': color = 'processing'; label = '审批中'; break;
        case 'pendingAction': color = 'warning'; label = '待执行'; break; // 🚨 新增：待执行状态
        case 'finished': color = 'success'; label = '已完成'; break;     // 🚨 新增：已完成状态
        case 'approvalReject': color = 'error'; label = '已驳回'; break; 
      }
      return h(Tag, { color }, () => label);
    }
  },
  { title: '创建时间', dataIndex: 'CreatedAt', width: 150, format: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-' },
];

export const searchFormSchema: FormSchema[] = [
  { 
    field: 'title', 
    label: '工单标题', 
    component: 'Input', 
    colProps: { span: 6 } 
  },
  { 
    field: 'status', 
    label: '状态', 
    component: 'Select', 
    componentProps: { 
      options: [
        { label: '审批中', value: 'pendingApproval' }, 
        { label: '待执行', value: 'pendingAction' }, // 🚨 新增：待执行
        { label: '已完成', value: 'finished' },     // 🚨 新增：已完成
        { label: '已驳回', value: 'approvalReject' } 
      ] 
    }, 
    colProps: { span: 6 } 
  },
  { 
    field: 'UserID', 
    label: '创建人', 
    component: 'ApiSelect', 
    componentProps: {
      api: async () => {
        try {
          const res = await getAllUserAndRoles(); 
          return res.result || res || [];
        } catch (error) {
          return [];
        }
      },
      showSearch: true,
      optionFilterProp: 'label',
      labelField: 'label', 
      valueField: 'value', 
    },
    colProps: { span: 6 } 
  },
];