<template>
  <BasicModal
    v-bind="$attrs"
    @register="registerModal"
    title="新建 Artifactory 项目 / 仓库"
    :canFullscreen="false"
    width="560px"
    okText="立即创建"
    @ok="handleSubmit"
    :confirmLoading="submitting"
  >
    <div class="py-2 px-1">
      <Alert
        message="Artifactory 仓库用于隔离与存储不同业务系统的构建产物与配置（如 k8s yaml、jar、Dockerfile 等）。"
        type="info"
        show-icon
        class="mb-4"
      />

      <Form ref="formRef" :model="formModel" :rules="rules" layout="vertical">
        <FormItem label="仓库 / 项目 Key" name="repoKey">
          <Input
            v-model:value="formModel.repoKey"
            placeholder="例如: bigdevops-release 或 myapp-generic"
            :maxlength="64"
            allow-clear
          />
          <div class="text-xs text-gray-400 mt-1">
            仓库唯一标识，只能包含字母、数字、连字符(-)或下划线(_)，创建后不可修改
          </div>
        </FormItem>

        <FormItem label="仓库类型 (Package Type)" name="packageType">
          <Select v-model:value="formModel.packageType" :options="packageTypeOptions" />
          <div class="text-xs text-gray-400 mt-1">
            推荐选择通用文件 (Generic)，用于存放 yaml、jar、sh 脚本及安装包
          </div>
        </FormItem>

        <FormItem label="描述说明" name="description">
          <Input.TextArea
            v-model:value="formModel.description"
            placeholder="例如: 基础架构项目配置文件与发布产物存储库"
            :rows="3"
            :maxlength="200"
            show-count
            allow-clear
          />
        </FormItem>
      </Form>
    </div>
  </BasicModal>
</template>

<script lang="ts" setup>
  import { ref, reactive } from 'vue';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { Form, FormItem, Input, Select, Alert, message } from 'ant-design-vue';
  import { createArtifactoryRepoApi } from '@/api/artifactory/artifactory';

  const emit = defineEmits(['success', 'register']);

  const formRef = ref();
  const submitting = ref(false);

  const formModel = reactive({
    repoKey: '',
    packageType: 'generic',
    description: '',
  });

  const packageTypeOptions = [
    { label: '通用文件 / 构件库 (generic) - 推荐', value: 'generic' },
    { label: 'Maven 制品库 (maven)', value: 'maven' },
    { label: 'NPM 前端包库 (npm)', value: 'npm' },
    { label: 'Docker 镜像库 (docker)', value: 'docker' },
    { label: 'Helm Chart 库 (helm)', value: 'helm' },
    { label: 'PyPI Python库 (pypi)', value: 'pypi' },
  ];

  const rules = {
    repoKey: [
      { required: true, message: '请输入仓库/项目标识 Key', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z0-9_\-]+$/,
        message: '只允许包含字母、数字、下划线(_)和连字符(-)',
        trigger: 'blur',
      },
      { min: 2, max: 64, message: '长度需在 2 到 64 个字符之间', trigger: 'blur' },
    ],
  };

  const [registerModal, { closeModal }] = useModalInner(() => {
    formModel.repoKey = '';
    formModel.packageType = 'generic';
    formModel.description = '';
    formRef.value?.clearValidate();
  });

  const handleSubmit = async () => {
    try {
      await formRef.value?.validate();
      submitting.value = true;

      await createArtifactoryRepoApi({
        repoKey: formModel.repoKey.trim(),
        packageType: formModel.packageType,
        description: formModel.description?.trim() || '',
      });

      message.success(`创建仓库 [${formModel.repoKey}] 成功！`);
      closeModal();
      emit('success', formModel.repoKey.trim());
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || '创建仓库失败');
    } finally {
      submitting.value = false;
    }
  };
</script>
