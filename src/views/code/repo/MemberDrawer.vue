<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" :title="`成员管理 - ${repoName}`" width="800px">

    <!-- 顶部：添加成员表单 -->
    <div class="mb-4 flex gap-2">
      <ApiSelect
        v-if="serverId > 0"
        v-model:value="newMember.username"
        :api="getGitUsers"
        :params="{ serverId }"
        showSearch
        optionFilterProp="label"
        labelField="username"
        valueField="username"
        resultField="items"
        placeholder="请选择Git平台用户"
        style="width: 200px"
      />
      <Select v-model:value="newMember.accessLevel" :options="roleOptions" style="width: 180px" />
      <Button type="primary" @click="handleAddMember" :loading="isAdding">添加/修改</Button>
    </div>

    <!-- 底部：现有成员列表 -->
    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'accessLevel'">
          <Select 
            v-model:value="record.accessLevel" 
            :options="roleOptions" 
            style="width: 150px"
            @change="(val) => handleRoleChange(record, val)"
          />
        </template>
        <!-- 删除成员按钮 -->
        <template v-if="column.key === 'action'">
          <!-- 🚀 修改点 3：此时 TableAction 已被正确导入并解析 -->
          <TableAction :actions="[
            { icon: 'ant-design:delete-outlined', color: 'error', popConfirm: { title: '确认移除？', confirm: () => handleRemove(record) } }
          ]" />
        </template>
      </template>
    </BasicTable>

  </BasicDrawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
// 🚀 修复 1：从 @/components/Table 中补充导入 TableAction
import { BasicTable, useTable, TableAction } from '@/components/Table';
// 🚀 修复 2：从 ant-design-vue 中补充导入 Select, Input, Button, Tag
import { Select, Button, message } from 'ant-design-vue'; 
import { getRepoMembers, addRepoMember, removeRepoMember, getGitUsers } from '@/api/code/repo';
import { ApiSelect } from '@/components/Form';

const repoId = ref(0);
const repoName = ref('');
const serverId = ref(0);
const fullName = ref('');
const newMember = ref({ username: '', accessLevel: 2 });
const isAdding = ref(false);

const [registerTable, { reload }] = useTable({
  api: () => getRepoMembers({ repoId: repoId.value, serverId: serverId.value, fullName: fullName.value }),
  columns: [
    { title: '用户名', dataIndex: 'username', width: 250 },
    { title: '权限', dataIndex: 'accessLevel', width: 200 },
  ],
  actionColumn: { width: 80, title: '操作', dataIndex: 'action' },
  pagination: false,
  
});

const [registerDrawer] = useDrawerInner((data) => {
  repoId.value = data.id;
  repoName.value = data.name || '';
  serverId.value = data.record?.serverId || 0;
  fullName.value = data.record?.fullName || '';
  reload(); 
});

const roleOptions = [
  { label: '只读 (Reporter)', value: 1 },
  { label: '读写 (Developer)', value: 2 },
  { label: '管理 (Maintainer)', value: 3 },
  { label: '拥有者 (Owner)', value: 4 },
];

async function handleAddMember() {
  if (!newMember.value.username) return message.warning('请输入用户名');
  isAdding.value = true;
  try {
    await addRepoMember({ repoId: repoId.value, serverId: serverId.value, fullName: fullName.value, ...newMember.value });
    message.success('配置成功');
    newMember.value.username = '';
    reload();
  } finally {
    isAdding.value = false;
  }
}

async function handleRemove(record: any) {
  try {
    await removeRepoMember({ repoId: repoId.value, serverId: serverId.value, fullName: fullName.value, username: record.username });
    message.success('移除成功');
    reload();
  } catch (error) {
    // 错误拦截器处理
  }
}

async function handleRoleChange(record: any, newLevel: number) {
  try {
    await addRepoMember({ 
      repoId: repoId.value, 
      serverId: serverId.value, 
      fullName: fullName.value, 
      username: record.username,
      accessLevel: newLevel
    });
    message.success('修改权限成功');
  } catch (error) {
    reload(); // 失败时重新加载以恢复原值
  }
}

function getRoleName(level: number) {
  const map: Record<number, string> = { 1: '只读 (Reporter)', 2: '读写 (Developer)', 3: '管理 (Maintainer)', 4: '拥有者 (Owner)' };
  return map[level] || '未知';
}

function getRoleColor(level: number) {
  const map: Record<number, string> = { 1: 'blue', 2: 'green', 3: 'red', 4: 'purple' };
  return map[level] || 'default';
}
</script>