<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" showFooter :title="getTitle" width="55%" @ok="handleSubmit">
    <BasicForm @register="registerForm">
      <template #kubeconfigSlot="{ model, field }">
        <div class="border border-gray-300 rounded overflow-hidden relative">
          <input id="codemirror_kubeconfig_input" class="sr-only" tabindex="-1" />
          <Codemirror
            v-if="renderEditor"
            v-model="model[field]"
            placeholder="请输入 KubeConfig 文件的具体内容"
            :style="{ height: '350px' }"
            :extensions="extensions"
          />
        </div>
      </template>
    </BasicForm>
  </BasicDrawer>
</template>

<script lang="ts" setup>
import { ref, computed, unref, nextTick } from 'vue';
import { BasicForm, useForm } from '@/components/Form/index';
import { formSchema } from './cluster.data';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
import { useMessage } from '@/hooks/web/useMessage';
import { createK8sCluster, updateK8sCluster, getK8sClusterDetail } from '@/api/demo/system';

import { Codemirror } from 'vue-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { yaml } from '@codemirror/lang-yaml';
import { EditorView } from '@codemirror/view';

const emit = defineEmits(['success', 'register']);
const { createMessage } = useMessage();
const isUpdate = ref(true);
const clusterId = ref<number | null>(null);
const renderEditor = ref(false);

const getTitle = computed(() => (!unref(isUpdate) ? '新增K8s集群' : '编辑K8s集群'));
const extensions = [oneDark, yaml(), EditorView.lineWrapping];

const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
  labelWidth: 150,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
});

const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
  renderEditor.value = false;
  await nextTick();
  resetFields();
  setDrawerProps({ confirmLoading: false });
  isUpdate.value = !!data?.isUpdate;

  if (unref(isUpdate) && data?.record) {
    clusterId.value = data.record.id;
    let formData = { ...data.record };

    // 🚀 参考 Git 实例与 Jenkins 实例处理逻辑：编辑模式下精准拉取单条详情，获取明文 KubeConfig 进行表单与编辑器回显
    try {
      setDrawerProps({ loading: true });
      const detail = await getK8sClusterDetail({ id: data.record.id });
      if (detail) {
        formData = { ...formData, ...detail };
      }
    } catch (err) {
      console.warn('获取集群详情失败，降级使用列表行数据', err);
    } finally {
      setDrawerProps({ loading: false });
    }

    setFieldsValue(formData);
  } else {
    clusterId.value = null;
  }

  await nextTick();
  renderEditor.value = true;
});

async function handleSubmit() {
  try {
    const values = await validate();
    setDrawerProps({ confirmLoading: true });

    if (!unref(isUpdate)) {
      await createK8sCluster(values);
      createMessage.success('K8s集群创建成功');
    } else {
      await updateK8sCluster({ ...values, id: clusterId.value });
      createMessage.success('K8s集群更新成功');
    }

    closeDrawer();
    emit('success');
  } catch (error) {
    console.error('提交失败:', error);
  } finally {
    setDrawerProps({ confirmLoading: false });
  }
}
</script>
