<template>
  <CollapseContainer title="基本设置" :canExpand="false">
    <Row :gutter="24">
      <Col :span="14">
        <BasicForm @register="register" />
        <Button type="primary" @click="handleSubmit"> 更新基本信息 </Button>
      </Col>
      <Col :span="10">
        <div class="change-avatar">
          <CropperAvatar
            :uploadApi="uploadAvatarApi"
            :value="avatar"
            btnText="更换头像"
            :btnProps="{ preIcon: 'ant-design:cloud-upload-outlined' }"
            @change="handleAvatarChange"
          />
        </div>
      </Col>
    </Row>
  </CollapseContainer>
</template>

<script lang="ts" setup>
  import { computed, onMounted } from 'vue';
  import { Button, Row, Col } from 'ant-design-vue';
  import { CollapseContainer } from '@/components/Container';
  import { CropperAvatar } from '@/components/Cropper';
  import { BasicForm, useForm } from '@/components/Form';
  import { baseSetSchemas } from '../account.data';
  import { useUserStore } from '@/store/modules/user';
  import { uploadAvatarApi, updateUserInfoApi } from '@/api/demo/system';
  import { useMessage } from '@/hooks/web/useMessage';

  const { createMessage } = useMessage();
  const userStore = useUserStore();

  const avatar = computed(() => userStore.getUserInfo?.avatar || '');

  const [register, { setFieldsValue, validate }] = useForm({
    labelWidth: 120,
    schemas: baseSetSchemas,
    showActionButtonGroup: false,
  });

  onMounted(() => {
    const userInfo = userStore.getUserInfo;
    if (userInfo) {
      setFieldsValue(userInfo);
    }
  });

  function handleAvatarChange({ data }: any) {
    const newAvatar = typeof data === 'string' ? data : (data?.url || data?.avatar || '');
    userStore.setUserInfo({
      ...userStore.getUserInfo,
      avatar: newAvatar,
    });
    createMessage.success('头像上传成功！');
  }

  async function handleSubmit() {
    try {
      const values = await validate();
      const updatedUser = await updateUserInfoApi({
        ...values,
        avatar: avatar.value,
      });
      userStore.setUserInfo(updatedUser);
      createMessage.success('更新个人信息成功！');
    } catch (error) {
      console.error(error);
    }
  }
</script>

<style lang="less" scoped>
  .change-avatar {
    img {
      display: block;
      margin-bottom: 15px;
      border-radius: 50%;
    }
  }
</style>
