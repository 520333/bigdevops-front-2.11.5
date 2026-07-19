<!-- src/views/code/repo/RepoModal.vue -->
<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="getTitle" @ok="handleSubmit">
    <BasicForm @register="registerForm">
      
      <!-- ✨ 这里是自定义命名空间插槽的内容 -->
      <template #customNamespaceSlot="{ model, field }">
        <div class="flex items-center space-x-2">
          <ApiSelect
            class="flex-1"
            :key="refreshKey" 
            v-model:value="model[field]"
            :api="getGitNamespaces"
            :params="{ serverId: model.serverId }"
            labelField="name"
            valueField="path"
            :showSearch="true"
            optionFilterProp="label"
          >
            <template #option="{ label, kind }">
              <span>
                {{ label }} 
                <Tag style="margin-left: 8px; zoom: 0.8" :color="kind === 'user' ? 'blue' : 'green'">
                  {{ kind === 'user' ? '用户' : '组织' }}
                </Tag>
              </span>
            </template>
          </ApiSelect>
          <a-button type="primary" preIcon="ant-design:plus-outlined" @click="handleOpenNamespace(model.serverId)">
            新建群组
          </a-button>
        </div>
      </template>

    </BasicForm>
  </BasicModal>

  <!-- ✨ 挂载新建命名空间弹窗 -->
  <NamespaceModal @register="registerNamespaceModal" @success="handleNamespaceSuccess" />
</template>

<script setup lang="ts">
import { ref, computed, unref } from 'vue';
import { BasicModal, useModalInner } from '@/components/Modal';
import { useModal } from '@/components/Modal'; // 引入 hook
import { BasicForm, useForm, ApiSelect } from '@/components/Form'; // 引入 ApiSelect
import { createCodeGitRepo, updateCodeGitRepo, getGitNamespaces } from '@/api/code/repo'; // 补上 getGitNamespaces
import { formSchema } from './repo.data';
import NamespaceModal from './NamespaceModal.vue'; // 引入新建群组弹窗
import { useMessage } from '@/hooks/web/useMessage';
import { Tag } from 'ant-design-vue';

const { createMessage } = useMessage();
const emit = defineEmits(['success', 'register']);
const isUpdate = ref(true);

// 强制刷新 ApiSelect 用的变量
const refreshKey = ref(Date.now()); 
const rowDataRef = ref<any>(null);

const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
  labelWidth: 100,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 },
});

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  resetFields();
  isUpdate.value = !!data?.isUpdate;
  if (isUpdate.value) {
    rowDataRef.value = data.record;
    let defaultNamespace = data.record.namespace || data.record.namespacePath;
    // 如果 namespaceId 存在且不为 0
    if (!defaultNamespace && data.record.namespaceId !== 0 && data.record.namespaceId !== undefined) {
      defaultNamespace = data.record.namespaceId;
    }
    // 尝试从 fullName (namespace/name) 提取出 namespace
    if (!defaultNamespace && data.record.fullName && data.record.fullName.includes('/')) {
      defaultNamespace = data.record.fullName.substring(0, data.record.fullName.lastIndexOf('/'));
    }

    setFieldsValue({
      ...data.record,
      namespace: defaultNamespace,
    });
  }
});

// ✨ 注册 Namespace 弹窗
const [registerNamespaceModal, { openModal: openNamespaceModal }] = useModal();

// 打开新建群组弹窗
function handleOpenNamespace(serverId: number) {
  if (!serverId) {
    createMessage.warning('请先选择所属 Git 实例！');
    return;
  }
  // 携带当前选中的 serverId 传给子弹窗
  openNamespaceModal(true, { serverId });
}

// ✨ 群组创建成功后的回调
function handleNamespaceSuccess() {
  createMessage.success('命名空间创建成功');
  // 更新 Key 触发 ApiSelect 重新发起请求刷新下拉列表
  refreshKey.value = Date.now(); 
}

const getTitle = computed(() => (!unref(isUpdate) ? '新建代码仓库' : '编辑仓库配置'));

async function handleSubmit() {
  try {
    const values = await validate();
    setModalProps({ confirmLoading: true });

    const submitData = { ...values };
    
    // 注入 id 和 fullName
    if (isUpdate.value && rowDataRef.value) {
      submitData.id = rowDataRef.value.id;
      submitData.fullName = rowDataRef.value.fullName;
    }

    // 兼容赋值给 namespacePath 或 namespaceId
    if (typeof values.namespace === 'number') {
      submitData.namespaceId = values.namespace;
    } else {
      submitData.namespacePath = values.namespace;
    }
    delete submitData.namespace;

    if (isUpdate.value) {
      await updateCodeGitRepo(submitData);
    } else {
      await createCodeGitRepo(submitData);
    }
    closeModal();
    emit('success');
  } catch (error) {
  } finally {
    setModalProps({ confirmLoading: false });
  }
}
</script>