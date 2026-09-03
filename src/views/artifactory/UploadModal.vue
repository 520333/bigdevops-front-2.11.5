<template>
  <BasicModal
    v-bind="$attrs"
    @register="register"
    title="上传文件 / 构件到 Artifactory"
    @ok="handleSubmit"
    width="560px"
  >
    <div class="p-4">
      <Form :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <FormItem label="所属项目/仓库" required>
          <Input v-model:value="formData.project" disabled />
        </FormItem>

        <FormItem label="目标子路径" help="例如: k8s 或 target，可留空">
          <Input v-model:value="formData.path" placeholder="默认为仓库根目录" />
        </FormItem>

        <FormItem label="选择文件" required>
          <Upload
            :file-list="fileList"
            :before-upload="beforeUpload"
            :on-remove="handleRemove"
            :max-count="1"
          >
            <Button>
              <UploadOutlined /> 选择配置文件或 .jar 构件
            </Button>
          </Upload>
        </FormItem>
      </Form>
    </div>
  </BasicModal>
</template>

<script lang="ts">
  import { defineComponent, ref, reactive } from 'vue';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { Form, FormItem, Input, Upload, Button } from 'ant-design-vue';
  import { UploadOutlined } from '@ant-design/icons-vue';
  import { uploadArtifactoryFileApi } from '@/api/artifactory/artifactory';
  import { useMessage } from '@/hooks/web/useMessage';

  export default defineComponent({
    name: 'UploadModal',
    components: {
      BasicModal,
      Form,
      FormItem,
      Input,
      Upload,
      Button,
      UploadOutlined,
    },
    emits: ['success', 'register'],
    setup(_, { emit }) {
      const { createMessage } = useMessage();
      const fileList = ref<any[]>([]);
      const formData = reactive({
        project: '',
        path: '',
      });

      const [register, { setModalProps, closeModal }] = useModalInner((data) => {
        formData.project = data.project || '';
        formData.path = data.path || '';
        fileList.value = [];
        setModalProps({ confirmLoading: false });
      });

      const beforeUpload = (file: File) => {
        fileList.value = [file];
        return false; // 阻止自动上传，统一在 ok 时手动上传
      };

      const handleRemove = () => {
        fileList.value = [];
      };

      const handleSubmit = async () => {
        if (!formData.project) {
          createMessage.warning('项目名称不能为空');
          return;
        }
        if (fileList.value.length === 0) {
          createMessage.warning('请选择需要上传的文件');
          return;
        }

        try {
          setModalProps({ confirmLoading: true });
          const fileToUpload = fileList.value[0];
          await uploadArtifactoryFileApi({
            project: formData.project,
            path: formData.path,
            file: fileToUpload,
          });
          createMessage.success('文件上传成功！');
          closeModal();
          emit('success');
        } catch (err: any) {
          createMessage.error(`上传失败: ${err?.message || err}`);
        } finally {
          setModalProps({ confirmLoading: false });
        }
      };

      return {
        register,
        formData,
        fileList,
        beforeUpload,
        handleRemove,
        handleSubmit,
      };
    },
  });
</script>
