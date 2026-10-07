<template>
  <BasicModal
    v-bind="$attrs"
    @register="registerModal"
    :title="getTitle"
    :width="760"
    okText="发起构建部署"
    @ok="handleSubmit"
  >
    <div class="px-2 py-1">
      <BasicForm @register="registerForm">
        <template #customParamsSlot>
          <div class="w-full mt-2 pt-3 border-t border-gray-200 dark:border-gray-800">
            <div class="flex items-center justify-between mb-2">
              <span
                class="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1"
              >
                <Icon icon="ant-design:plus-circle-outlined" class="text-blue-500" />
                自定义动态构建参数 (扩展变量)
              </span>
              <Button size="small" type="dashed" @click="handleAddCustomParam"> + 添加参数 </Button>
            </div>

            <div v-if="customParamList.length === 0" class="text-xs text-gray-400 py-1 italic">
              暂无动态扩展参数，如需额外变量可点击上方按钮自由添加。
            </div>

            <div
              v-for="(item, index) in customParamList"
              :key="index"
              class="flex items-center gap-2 mb-2"
            >
              <Input
                v-model:value="item.key"
                placeholder="参数名 (如 MAVEN_OPTS)"
                size="small"
                class="w-5/12"
              />
              <Input
                v-model:value="item.value"
                placeholder="参数值 (如 -Xmx512m)"
                size="small"
                class="w-5/12"
              />
              <Button size="small" type="link" danger @click="handleRemoveCustomParam(index)">
                删除
              </Button>
            </div>
          </div>
        </template>
      </BasicForm>
    </div>
  </BasicModal>
</template>

<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import { Input } from 'ant-design-vue';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { BasicForm, useForm } from '@/components/Form';
  import { Button } from '@/components/Button';
  import Icon from '@/components/Icon/Icon.vue';
  import { getJenkinsJobParameters } from '@/api/cicd';
  import { buildDynamicSchemas, extractInitialValues, customParamsSchemaItem } from './build.data';

  defineOptions({ name: 'BuildModal' });

  const emit = defineEmits(['confirm', 'success', 'register']);

  const instanceId = ref<number | null>(null);
  const currentRecord = ref<any>(null);
  const customParamList = ref<Array<{ key: string; value: string }>>([]);
  const jobDisplayName = ref<string>('');

  const getTitle = computed(() => {
    return jobDisplayName.value
      ? `触发构建部署 - ${jobDisplayName.value}`
      : '触发 Jenkins 构建与部署配置';
  });

  function handleAddCustomParam() {
    customParamList.value.push({ key: '', value: '' });
  }

  function handleRemoveCustomParam(index: number) {
    customParamList.value.splice(index, 1);
  }

  const [registerForm, { validate, setFieldsValue, resetFields, resetSchema }] = useForm({
    labelWidth: 110,
    schemas: [customParamsSchemaItem],
    showActionButtonGroup: false,
    baseColProps: { span: 24 },
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    resetFields();
    customParamList.value = [];
    setModalProps({ confirmLoading: false, loading: true });

    instanceId.value = data?.instanceId || null;
    currentRecord.value = data?.record || null;

    const rawName = data?.record?.name || data?.record?.jobName || '';
    const shortJobName = rawName.includes('/') ? rawName.split('/').pop()! : rawName;
    const folder =
      data?.record?.folder ||
      data?.record?.projectName ||
      (rawName.includes('/') ? rawName.split('/')[0] : '');

    jobDisplayName.value = shortJobName;

    try {
      const res: any = await getJenkinsJobParameters({
        instanceId: instanceId.value!,
        jobName: shortJobName,
        folder: folder,
        projectName: folder,
      });

      const params = Array.isArray(res) ? res : res?.result || res?.parameters || res?.data || [];

      if (params.length > 0) {
        await resetSchema(buildDynamicSchemas(params, () => currentRecord.value));
        await setFieldsValue(extractInitialValues(params, currentRecord.value));
      } else {
        await resetSchema([customParamsSchemaItem]);
      }
    } catch (err: any) {
      console.warn('获取 Jenkins Job 构建参数失败:', err);
      await resetSchema([customParamsSchemaItem]);
    } finally {
      setModalProps({ loading: false });
    }
  });

  async function handleSubmit() {
    try {
      const values = await validate();
      setModalProps({ confirmLoading: true });

      const rawName = currentRecord.value?.name || currentRecord.value?.jobName || '';
      const shortJobName = rawName.includes('/') ? rawName.split('/').pop()! : rawName;
      const folder =
        currentRecord.value?.folder ||
        currentRecord.value?.projectName ||
        (rawName.includes('/') ? rawName.split('/')[0] : '');

      const customParamsMap: Record<string, any> = {};
      for (const [k, v] of Object.entries(values)) {
        if (k !== 'customParamsSlotField' && v !== undefined && v !== null) {
          customParamsMap[k] = Array.isArray(v) ? v.join(',') : v;
        }
      }

      customParamList.value.forEach((item) => {
        if (item.key && item.key.trim() !== '') {
          customParamsMap[item.key.trim()] = item.value || '';
        }
      });

      closeModal();

      let selectedBranch = '';
      for (const [k, v] of Object.entries(customParamsMap)) {
        const lk = k.toLowerCase();
        if (lk === 'branch' || lk === 'gitbranch' || lk === 'git_branch' || k.includes('分支')) {
          selectedBranch = String(v);
          break;
        }
      }

      const payload = {
        instanceId: instanceId.value,
        jobName: shortJobName,
        fullName: rawName,
        folder: folder,
        projectName: folder,
        branch: selectedBranch,
        customParams: customParamsMap,
        record: currentRecord.value,
      };

      emit('confirm', payload);
      emit('success', payload);
    } catch (e) {
      console.warn('构建提交校验异常:', e);
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }
</script>
