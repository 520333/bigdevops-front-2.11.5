import { BasicColumn, FormSchema } from '@/components/Table';
import { 
  getJobExecScriptSelect, 
  getJobExecScriptOne, 
  getStreeNodeSelect, 
  getStreeNodeEcsList 
} from '@/api/demo/system';
import { listToTree } from '@/utils/helper/treeHelper';

export const columns: BasicColumn[] = [
  { title: '任务ID', dataIndex: 'id', width: 60 },
  { title: '任务名称', dataIndex: 'title', width: 180 },
  { title: '创建人', dataIndex: 'createUserName', width: 120 },
  { title: '执行账号', dataIndex: 'account', width: 100 },
  { 
    title: '错误策略', 
    dataIndex: 'OnErrorStrategy', 
    width: 150,
    // 🚀 修复 1：利用 customRender 将后端的英文枚举在表格中映射为中文标签
    customRender: ({ record }) => {
      const strategyMap: Record<string, string> = {
        'ignore': '忽略错误继续执行',
        'stop': '遇到单机错误停止',
        'pause': '遇到单机错误暂停',
      };
      // 如果匹配不到，则原样返回（兼容脏数据）
      return strategyMap[record.OnErrorStrategy] || record.OnErrorStrategy;
    }
  },
  { title: '超时时间', dataIndex: 'execTimeoutSeconds', width: 100 },
  { title: '状态', dataIndex: 'status', width: 100 },
];

export const searchFormSchema: FormSchema[] = [
  { field: 'title', label: '任务名称', component: 'Input', colProps: { span: 6 } },
];

// 👉 左侧：常规任务参数配置
export const leftFormSchema: FormSchema[] = [
  { field: 'title', label: '任务名称', component: 'Input', required: true },
  { field: 'account', label: '执行账号', component: 'Input', defaultValue: 'root', required: true },
  { field: 'args', label: '执行参数', component: 'Input', helpMessage: '脚本执行时传入的参数' },
  
  {
    field: 'treeNodeId',
    label: '服务树节点',
    component: 'ApiTreeSelect',
    helpMessage: '选择节点后，该节点下的主机将出现在下方穿梭框中',
    componentProps: ({ formModel }) => {
      return {
        api: getStreeNodeSelect,
        labelField: 'title',
        valueField: 'id',
        treeDefaultExpandAll: true,
        placeholder: '请选择服务树节点获取对应主机',
        afterFetch: (res) => (res ? listToTree(res, { id: 'id', pid: 'pId' }) : []),
        
        onChange: async (nodeId: number) => {
          if (!nodeId) {
            formModel.machineData = []; 
            return;
          }
          try {
            const ecsList = await getStreeNodeEcsList(nodeId);
            const transferData: any[] = [];
            ecsList.forEach((ecs: any) => {
              if (ecs.PrivateIpAddress && ecs.PrivateIpAddress.length > 0) {
                const ip = ecs.PrivateIpAddress[0];
                transferData.push({
                  // 💡 核心：传给后端的必须是机器的 ID，转成字符串防止类型报错
                  key: String(ecs.id), 
                  title: `${ecs.title || ecs.HostName} (${ip})`, 
                });
              }
            });
            formModel.machineData = transferData;
          } catch (error) {
            console.error('拉取主机失败', error);
          }
        },
      };
    },
  },
  
  { 
    field: 'targetIps', 
    label: '目标机器', 
    component: 'Input', 
    slot: 'machineTransferSlot', 
    required: true,
    defaultValue: [], // 🚀 关键修复：确保永远是数组
  },

  { field: 'batchSize', label: '并发数量', component: 'InputNumber', defaultValue: 0, helpMessage: '0代表全部并发' },
  { field: 'execTimeoutSeconds', label: '超时时间(秒)', component: 'InputNumber', defaultValue: 60, required: true },
  {
    field: 'OnErrorStrategy',
    label: '错误策略',
    component: 'Select',
    // 🚀 修复 2：默认值改为英文常量
    defaultValue: 'stop', 
    componentProps: {
      // 🚀 修复 3：Label 给用户看（中文），Value 存进数据库（英文）
      options: [
        { label: '忽略错误继续执行', value: 'ignore' },
        { label: '遇到单台机器错误停止', value: 'stop' },
        { label: '遇到单台机器错误暂停', value: 'pause' },
      ],
    },
    required: true,
  },
];

// 👉 右侧：脚本来源、语言与内容配置
export const rightFormSchema: FormSchema[] = [
  {
    field: 'scriptSource',
    label: '脚本来源',
    component: 'RadioGroup',
    defaultValue: '1',
    componentProps: {
      options: [
        { label: '手工录入', value: '1' },
        { label: '从脚本模板选择', value: '2' },
      ],
    },
  },
  {
    field: 'scriptId',
    label: '选择模板',
    component: 'ApiSelect',
    show: ({ values }) => values.scriptSource === '2',
    componentProps: ({ formActionType }) => {
      return {
        api: getJobExecScriptSelect,
        onChange: async (val: string) => {
          if (val) {
            const detail = await getJobExecScriptOne(val);
            formActionType.setFieldsValue({
              scriptContent: detail.content,
              lang: detail.lang || 'shell',
            });
          }
        },
      };
    },
  },
  {
    field: 'lang',
    label: '脚本语言',
    component: 'Select',
    defaultValue: 'shell',
    componentProps: {
      options: [
        { label: 'Shell', value: 'shell' },
        { label: 'Python', value: 'python' },
        { label: 'ansible', value: 'yaml' },
        { label: 'json', value: 'javascript' },
      ],
    },
    required: true,
  },
  {
    field: 'scriptContent',
    label: '脚本内容',
    component: 'Input',
    slot: 'scriptContentSlot',
    required: true,
  },
];