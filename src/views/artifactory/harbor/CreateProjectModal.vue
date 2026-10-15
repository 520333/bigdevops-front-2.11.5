<template>
  <BasicModal
    v-bind="$attrs"
    @register="registerModal"
    title="新建 Harbor 镜像项目"
    :canFullscreen="false"
    width="560px"
    okText="立即创建"
    @ok="handleSubmit"
    :confirmLoading="submitting"
  >
    <div class="py-2 px-1">
      <Alert
        message="Harbor 项目是镜像的最顶层命名空间。推送镜像命令将遵循：harbor.domain/{项目名}/{镜像名}:{版本Tag}"
        type="info"
        show-icon
        class="mb-4"
      />

      <Form ref="formRef" :model="formModel" :rules="rules" layout="vertical">
        <FormItem label="项目名称" name="projectName">
          <Input
            v-model:value="formModel.projectName"
            placeholder="例如: devops 或 bigdevops"
            :maxlength="64"
            allow-clear
          />
          <div class="text-xs text-gray-400 mt-1">
            命名规范：小写字母、数字、中划线(-)或下划线(_)，不能包含空格或特殊字符
          </div>
        </FormItem>

        <FormItem label="访问级别 (公开性)" name="isPublic">
          <RadioGroup v-model:value="formModel.isPublic">
            <Radio :value="false">
              <span class="font-bold">私有 (Private)</span>
              <span class="text-xs text-gray-500 ml-2">需配置凭证或登录后方可 docker pull 拉取</span>
            </Radio>
            <div class="mt-2">
              <Radio :value="true">
                <span class="font-bold">公开 (Public)</span>
                <span class="text-xs text-gray-500 ml-2">任何客户端均可匿名拉取镜像</span>
              </Radio>
            </div>
          </RadioGroup>
        </FormItem>

        <FormItem label="存储限额" name="storageLimitGb">
          <InputNumber
            v-model:value="formModel.storageLimitGb"
            :min="-1"
            :max="102400"
            style="width: 100%"
            placeholder="-1 表示无限制，单位 GB"
          />
          <div class="text-xs text-gray-400 mt-1">
            填 -1 表示不限制配额，填写具体正数表示限制该项目的最大存储空间 (GB)
          </div>
        </FormItem>
      </Form>
    </div>
  </BasicModal>
</template>

<script lang="ts" setup>
  import { ref, reactive } from 'vue';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { Form, FormItem, Input, RadioGroup, Radio, InputNumber, Alert, message } from 'ant-design-vue';
  import { createHarborProjectApi } from '@/api/artifactory/harbor';

  const emit = defineEmits(['success', 'register']);

  const formRef = ref();
  const submitting = ref(false);

  const formModel = reactive({
    projectName: '',
    isPublic: false,
    storageLimitGb: -1,
  });

  const rules = {
    projectName: [
      { required: true, message: '请输入项目名称', trigger: 'blur' },
      {
        pattern: /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/,
        message: '项目名称只能由小写字母、数字、下划线和连字符组成',
        trigger: 'blur',
      },
      { min: 2, max: 64, message: '长度需在 2 到 64 个字符之间', trigger: 'blur' },
    ],
  };

  const [registerModal, { closeModal }] = useModalInner(() => {
    formModel.projectName = '';
    formModel.isPublic = false;
    formModel.storageLimitGb = -1;
    formRef.value?.clearValidate();
  });

  async function handleSubmit() {
    try {
      await formRef.value.validate();
      submitting.value = true;

      let limitBytes: number = -1;
      if (formModel.storageLimitGb > 0) {
        limitBytes = formModel.storageLimitGb * 1024 * 1024 * 1024;
      }

      await createHarborProjectApi({
        projectName: formModel.projectName.trim(),
        isPublic: formModel.isPublic,
        storageLimit: limitBytes,
      });

      message.success(`Harbor 项目 [${formModel.projectName}] 创建成功！`);
      emit('success', formModel.projectName.trim());
      closeModal();
    } catch (e: any) {
      if (e?.message) {
        message.error(e.message);
      }
    } finally {
      submitting.value = false;
    }
  }
</script>
