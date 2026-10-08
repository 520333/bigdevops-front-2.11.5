<template>
  <BasicDrawer
    v-bind="$attrs"
    @register="registerDrawer"
    showFooter
    :title="`服务基线数据权限配置 - [${roleRecord?.roleName || ''} (${roleRecord?.roleValue || ''})]`"
    width="800px"
    @ok="handleSubmit"
  >
    <div class="p-2 space-y-4">
      <Alert
        message="数据权限行级隔离规则"
        description="此处用于控制属于该角色的用户能【看见】哪些项目与部署环境的流水线。未授权的项目及环境对该角色用户直接完全隐形。超级管理员不受此限制。"
        type="info"
        show-icon
      />

      <div class="flex items-center justify-between mt-4">
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">
          已授权的项目与环境列表 (共 {{ permissionList.length }} 条)
        </span>
        <Button type="primary" preIcon="ant-design:plus-outlined" size="small" @click="handleAddRule">
          添加授权规则
        </Button>
      </div>

      <Table
        :dataSource="permissionList"
        :columns="tableColumns"
        :pagination="false"
        size="small"
        bordered
        rowKey="_id"
      >
        <template #bodyCell="{ column, record, index }">
          <!-- 项目名称 -->
          <template v-if="column.key === 'projectName'">
            <Select
              v-model:value="record.projectName"
              style="width: 100%"
              placeholder="选择或输入项目(*表示全部)"
              show-search
              allow-clear
              :options="projectSelectOptions"
            />
          </template>

          <!-- 部署环境 -->
          <template v-if="column.key === 'deployEnv'">
            <div class="space-y-1">
              <Checkbox
                :checked="record.envList.includes('*')"
                @change="(e) => handleToggleAllEnvs(record, e.target.checked)"
              >
                全部环境(*)
              </Checkbox>
              <CheckboxGroup
                v-if="!record.envList.includes('*')"
                v-model:value="record.envList"
                :options="availableEnvs"
              />
            </div>
          </template>

          <!-- 是否允许构建 -->
          <template v-if="column.key === 'allowBuild'">
            <Switch
              v-model:checked="record.allowBuild"
              checked-children="允许构建"
              un-checked-children="仅查看"
            />
          </template>

          <!-- 操作 -->
          <template v-if="column.key === 'action'">
            <Button type="link" danger size="small" @click="handleRemoveRule(index)">
              删除
            </Button>
          </template>
        </template>

        <template #emptyText>
          <div class="py-8 text-center text-gray-400">
            暂无基线权限规则。若不配置，该角色用户进入【服务基线】将直接无法看见任何作业。
          </div>
        </template>
      </Table>
    </div>
  </BasicDrawer>
</template>

<script lang="ts">
  import { defineComponent, ref, computed } from 'vue';
  import { Alert, Table, Select, Checkbox, Switch, Button, message } from 'ant-design-vue';
  import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
  import {
    getRoleJobPermissions,
    saveRoleJobPermissions,
    getJobProjectOptions,
  } from '@/api/cicd';

  interface PermissionRow {
    _id: string;
    projectName: string;
    envList: string[];
    allowBuild: boolean;
  }

  export default defineComponent({
    name: 'JobPermissionDrawer',
    components: {
      BasicDrawer,
      Alert,
      Table,
      Select,
      Checkbox,
      CheckboxGroup: Checkbox.Group,
      Switch,
      Button,
    },
    emits: ['success', 'register'],
    setup(_, { emit }) {
      const roleRecord = ref<any>(null);
      const permissionList = ref<PermissionRow[]>([]);
      const projectOptions = ref<string[]>([]);

      const projectSelectOptions = computed(() => [
        { label: '* (所有项目空间)', value: '*' },
        ...projectOptions.value.map((proj) => ({ label: proj, value: proj })),
      ]);
      const availableEnvs = ref<{ label: string; value: string }[]>([
        { label: '开发(dev)', value: 'dev' },
        { label: '测试(test)', value: 'test' },
        { label: '集成(stage)', value: 'stage' },
        { label: '预发(uat)', value: 'uat' },
        { label: '灰度(pre)', value: 'pre' },
        { label: '生产(prod)', value: 'prod' },
      ]);

      const tableColumns = [
        {
          title: '项目空间 (projectName)',
          dataIndex: 'projectName',
          key: 'projectName',
          width: '32%',
        },
        {
          title: '允许访问的环境 (deployEnv)',
          dataIndex: 'deployEnv',
          key: 'deployEnv',
          width: '42%',
        },
        {
          title: '构建权限',
          dataIndex: 'allowBuild',
          key: 'allowBuild',
          width: '16%',
          align: 'center',
        },
        {
          title: '操作',
          key: 'action',
          width: '10%',
          align: 'center',
        },
      ];

      const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
        setDrawerProps({ confirmLoading: false });
        roleRecord.value = data.record;
        permissionList.value = [];

        try {
          // 1. 获取现有可选择的项目空间
          const optRes = await getJobProjectOptions();
          if (optRes && optRes.projects) {
            projectOptions.value = optRes.projects;
          }

          // 2. 获取该角色的权限配置
          if (roleRecord.value?.id) {
            const list = await getRoleJobPermissions({ roleId: roleRecord.value.id });
            if (Array.isArray(list)) {
              permissionList.value = list.map((item, idx) => {
                const envs = (item.deployEnv || '')
                  .split(',')
                  .map((e: string) => e.trim())
                  .filter(Boolean);
                return {
                  _id: `${Date.now()}_${idx}`,
                  projectName: item.projectName || '*',
                  envList: envs.length > 0 ? envs : ['dev', 'test'],
                  allowBuild: item.allowBuild === 1,
                };
              });
            }
          }
        } catch (e: any) {
          message.error(`加载权限数据失败: ${e.message || e}`);
        }
      });

      const handleAddRule = () => {
        permissionList.value.push({
          _id: `${Date.now()}_${Math.random()}`,
          projectName: projectOptions.value[0] || '*',
          envList: ['dev', 'test'],
          allowBuild: true,
        });
      };

      const handleRemoveRule = (index: number) => {
        permissionList.value.splice(index, 1);
      };

      const handleToggleAllEnvs = (record: PermissionRow, checked: boolean) => {
        if (checked) {
          record.envList = ['*'];
        } else {
          record.envList = ['dev', 'test'];
        }
      };

      const handleSubmit = async () => {
        if (!roleRecord.value?.id) return;

        // 校验每一项
        for (const item of permissionList.value) {
          if (!item.projectName) {
            message.warning('请选择或填写项目空间名称');
            return;
          }
          if (item.envList.length === 0) {
            message.warning(`请为项目 [${item.projectName}] 至少选择一个允许的环境`);
            return;
          }
        }

        try {
          setDrawerProps({ confirmLoading: true });
          const payload = permissionList.value.map((item) => ({
            projectName: item.projectName,
            deployEnv: item.envList.join(','),
            allowBuild: item.allowBuild ? 1 : 2,
          }));

          await saveRoleJobPermissions({
            roleId: roleRecord.value.id,
            permissions: payload,
          });

          message.success('角色服务基线权限保存成功！');
          closeDrawer();
          emit('success');
        } catch (e: any) {
          message.error(`保存失败: ${e.message || e}`);
        } finally {
          setDrawerProps({ confirmLoading: false });
        }
      };

      return {
        registerDrawer,
        roleRecord,
        permissionList,
        projectOptions,
        projectSelectOptions,
        availableEnvs,
        tableColumns,
        handleAddRule,
        handleRemoveRule,
        handleToggleAllEnvs,
        handleSubmit,
      };
    },
  });
</script>
