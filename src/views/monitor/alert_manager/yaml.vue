<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="`AlertManager ${current_ip} 节点主配置文件预览`"
    :showOkBtn="false" cancelText="关闭" width="800px">
    <template #appendFooter>
      <a-button type="primary" preIcon="ant-design:copy-outlined" @click="handleCopy">
        一键复制 YAML
      </a-button>
    </template>

    <div class="py-2" v-loading="loading" style="min-height: 500px;">
      <div class="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
        <Codemirror v-if="renderEditor" v-model="yamlContent" placeholder="正在加载配置..." :style="{ height: '600px' }"
          :extensions="extensions" :disabled="true" />
      </div>
    </div>
  </BasicModal>
</template>

<script lang="ts" setup>
import { ref, nextTick } from 'vue';
import { BasicModal, useModalInner } from '@/components/Modal';
import { useMessage } from '@/hooks/web/useMessage';
import { getMonitorAlertManagerYamlOne } from '@/api/demo/system';

import { Codemirror } from 'vue-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { yaml } from '@codemirror/lang-yaml';
import { EditorState } from '@codemirror/state';

const yamlContent = ref('');
const loading = ref(false);
const renderEditor = ref(false);
const { createMessage } = useMessage();
const current_ip = ref('');

const extensions = [oneDark, yaml(), EditorState.readOnly.of(true)];

const [registerModal] = useModalInner(async (data) => {
  renderEditor.value = false;
  yamlContent.value = '';
  const ip = data.ip;
  current_ip.value = ip;
  if (!ip) return;

  try {
    loading.value = true;
    const res = await getMonitorAlertManagerYamlOne(ip);
    yamlContent.value = res || '配置为空';

    nextTick(() => {
      setTimeout(() => {
        renderEditor.value = true;
      }, 150);
    });

  } catch (error) {
    yamlContent.value = '# 获取配置文件失败\n' + error;
    renderEditor.value = true;
  } finally {
    loading.value = false;
  }
});

function handleCopy() {
  if (!yamlContent.value) {
    createMessage.warning('没有可复制的内容');
    return;
  }
  navigator.clipboard.writeText(yamlContent.value).then(() => {
    createMessage.success('YAML 已成功复制到剪贴板！');
  }).catch(() => {
    createMessage.error('复制失败，请手动框选复制');
  });
}
</script>