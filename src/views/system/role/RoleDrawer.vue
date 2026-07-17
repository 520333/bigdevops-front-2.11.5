<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" showFooter :title="getTitle" width="500px" @ok="handleSubmit">
    <BasicForm @register="registerForm">
      <template #menus="{ model, field }">
        <BasicTree v-model:value="model[field]" :treeData="treeData" :fieldNames="{ title: 'title', key: 'id' }" ref="menuTreeRef"
          checkable toolbar title="菜单分配" />
      </template>
      <template #apis="{ model, field }">
        <BasicTree v-model:value="model[field]" :treeData="treeDataApi" :fieldNames="{ title: 'title', key: 'id' }" ref="apiTreeRef"
          checkable toolbar title="接口分配"/>
      </template>
    </BasicForm>
  </BasicDrawer>
</template>

<script lang="ts" setup>
import { ref, computed, unref } from 'vue';
import { BasicForm, useForm } from '@/components/Form/index';
import { formSchema } from './role.data';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
import { BasicTree, TreeItem } from '@/components/Tree';

import { usePermissionStore } from '@/store/modules/permission';
import { listToTree } from '@/utils/helper/treeHelper';

import { createRole, getMenuListAll, updateRole, getApiList } from '@/api/demo/system';
import { useMessage } from '@/hooks/web/useMessage';
import { nextTick } from 'vue';
const emit = defineEmits(['success', 'register']);
const isUpdate = ref(true);
const treeData = ref<TreeItem[]>([]);
const treeDataApi = ref<TreeItem[]>([]);

const [registerForm, { resetFields, setFieldsValue, getFieldsValue, validate }] = useForm({
  labelWidth: 90,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
  
});
const menuTreeRef = ref();
const apiTreeRef = ref();
const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
  resetFields();
  setDrawerProps({ confirmLoading: false });
  if (unref(treeData).length === 0) {
    const res = await getMenuListAll();
    const rawList = (res.result || res) as any[];
    treeData.value = listToTree(rawList, { id: 'id', pid: 'pId' });
  }

  // 2. 新增：填充 API treeData
  if (unref(treeDataApi).length === 0) {
    const resApi = await getApiList();
    treeDataApi.value = (resApi.result || resApi) as any[];
  }



  isUpdate.value = !!data?.isUpdate;
  if (unref(isUpdate)) {
    const record = { ...data.record };

    if (record.menus && Array.isArray(record.menus)) {
      const rawList = record.menus;
      const allIds = rawList.map(m => m.id);
      const pIds = rawList.map(m => m.pId);
      record.menus = allIds.filter(id => !pIds.includes(id));
    }

    // == 新增：处理 API 回显 ==
    if (record.apis && Array.isArray(record.apis)) {
      const rawApiList = record.apis;
      const allApiIds = rawApiList.map(a => a.id);
      const pApiIds = rawApiList.map(a => a.pId);
      record.apis = allApiIds.filter(id => !pApiIds.includes(id));
    }

    setFieldsValue(record);

  }
});

const getTitle = computed(() => (!unref(isUpdate) ? '新增角色' : '编辑角色'));

async function handleSubmit() {
  try {
    setDrawerProps({ confirmLoading: true });
    var roleFunc = createRole;
    if (unref(isUpdate)) {
      roleFunc = updateRole;
    }

    var reqData = getFieldsValue();

    // ================= 处理 Menu IDs =================
    var menus = reqData['menus'] || [];
    var menuIds: any[] = [];
    menus.forEach((val) => {
      if (val && typeof val === 'object' && val.id != null) {
        menuIds.push(val.id);
      } else {
        menuIds.push(val);
      }
    });
    delete reqData['menus'];
    reqData["menuIds"] = menuIds;


    var apis = reqData['apis'] || [];
    var apiIds: any[] = [];
    apis.forEach((val) => {
      if (val && typeof val === 'object' && val.id != null) {
        apiIds.push(val.id);
      } else {
        apiIds.push(val);
      }
    });
    delete reqData['apis'];
    reqData["apiIds"] = apiIds;

    const { createMessage } = useMessage();
    roleFunc(reqData).then(() => {
      closeDrawer();
      emit('success');
      createMessage.success(`${getTitle.value}成功`)
      const permissionStore = usePermissionStore();
      permissionStore.buildRoutesAction();
    }).catch(() => {
      createMessage.error(`${getTitle.value}失败`)
    });

  } finally {
    setDrawerProps({ confirmLoading: false });
  }
}

</script>