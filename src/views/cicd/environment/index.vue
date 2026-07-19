<template>
  <PageWrapper title="环境配置" content="管理各环境变量和服务器节点">
    <div class="flex gap-4">
      <!-- 左侧：环境列表 -->
      <div class="w-56 shrink-0">
        <Card size="small" :bordered="false" title="环境列表">
          <template #extra>
            <Button size="small" type="text" @click="handleAddEnv"><PlusOutlined /></Button>
          </template>
          <div
            v-for="env in envList"
            :key="env.id"
            :class="[
              'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer mb-1 transition-all',
              selectedEnv?.id === env.id
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            ]"
            @click="selectEnv(env)"
          >
            <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: env.color }"></span>
            <span class="text-sm font-medium">{{ env.name }}</span>
            <Tag class="ml-auto text-xs scale-90" :color="env.color">{{ env.key }}</Tag>
          </div>
        </Card>
      </div>

      <!-- 右侧：环境详情 -->
      <div class="flex-1 min-w-0">
        <template v-if="selectedEnv">
          <!-- 环境基本信息 -->
          <Card size="small" :bordered="false" class="mb-3">
            <div class="flex items-center gap-4">
              <span class="text-base font-semibold flex items-center gap-2">
                <span class="w-3 h-3 rounded-full inline-block" :style="{ background: selectedEnv.color }"></span>
                {{ selectedEnv.name }}
              </span>
              <Tag :color="selectedEnv.color">{{ selectedEnv.key }}</Tag>
              <span class="text-sm text-gray-400">{{ selectedEnv.desc }}</span>
              <div class="flex-1" />
              <Button size="small" @click="editEnv(selectedEnv)"><EditOutlined /> 编辑</Button>
              <Popconfirm title="确认删除该环境？" @confirm="deleteEnv(selectedEnv)">
                <Button size="small" danger><DeleteOutlined /></Button>
              </Popconfirm>
            </div>
          </Card>

          <!-- 环境变量 -->
          <Card size="small" :bordered="false" class="mb-3">
            <template #title>
              <span>环境变量</span>
              <Badge :count="selectedEnv.vars.length" class="ml-2" />
            </template>
            <template #extra>
              <Button size="small" type="primary" ghost @click="handleAddVar"><PlusOutlined /> 新增变量</Button>
            </template>

            <Table
              :dataSource="selectedEnv.vars"
              :columns="varColumns"
              row-key="id"
              size="small"
              :pagination="false"
              bordered
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'value'">
                  <div class="flex items-center gap-2">
                    <span
                      class="font-mono text-sm flex-1"
                      :class="showValues[record.id] ? 'text-gray-800' : 'text-gray-400'"
                    >
                      {{ showValues[record.id] ? record.value : maskValue(record.value) }}
                    </span>
                    <Button type="text" size="small" @click="toggleShowValue(record.id)">
                      <EyeOutlined v-if="!showValues[record.id]" />
                      <EyeInvisibleOutlined v-else />
                    </Button>
                    <Button type="text" size="small" @click="copyValue(record.value)">
                      <CopyOutlined />
                    </Button>
                  </div>
                </template>
                <template v-if="column.key === 'varAction'">
                  <Space>
                    <a @click="handleEditVar(record)">编辑</a>
                    <Divider type="vertical" />
                    <Popconfirm title="确认删除？" @confirm="handleDeleteVar(record)">
                      <a class="text-red-500">删除</a>
                    </Popconfirm>
                  </Space>
                </template>
              </template>
            </Table>
          </Card>

          <!-- 服务器节点 -->
          <Card size="small" :bordered="false">
            <template #title>
              <span>服务器节点</span>
              <Badge :count="selectedEnv.nodes.length" class="ml-2" />
            </template>
            <template #extra>
              <Button size="small" type="primary" ghost @click="message.info('添加节点功能待对接')">
                <PlusOutlined /> 添加节点
              </Button>
            </template>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div
                v-for="node in selectedEnv.nodes"
                :key="node.id"
                class="flex items-center gap-3 p-3 border rounded-lg border-gray-200 dark:border-gray-700 hover:border-blue-300 transition-colors"
              >
                <div :class="['w-2.5 h-2.5 rounded-full shrink-0', node.status === 'online' ? 'bg-green-400' : 'bg-red-400']" />
                <div>
                  <div class="font-mono text-sm font-medium">{{ node.ip }}</div>
                  <div class="text-xs text-gray-400">{{ node.role }}</div>
                </div>
                <div class="ml-auto">
                  <Tag :color="node.status === 'online' ? 'success' : 'error'" class="text-xs">
                    {{ node.status === 'online' ? '在线' : '离线' }}
                  </Tag>
                </div>
              </div>
            </div>
          </Card>
        </template>
        <Empty v-else description="请从左侧选择一个环境" class="py-16" />
      </div>
    </div>

    <!-- 变量 新增/编辑 弹窗 -->
    <Modal
      v-model:open="varModal.visible"
      :title="varModal.isEdit ? '编辑变量' : '新增变量'"
      @ok="saveVar"
      ok-text="保存"
      :destroyOnClose="true"
    >
      <Form :model="varModal.form" layout="vertical">
        <FormItem label="Key（变量名）" required>
          <Input v-model:value="varModal.form.key" placeholder="例如：REDIS_HOST" />
        </FormItem>
        <FormItem label="Value（变量值）" required>
          <Input v-model:value="varModal.form.value" placeholder="例如：10.0.1.20" />
        </FormItem>
        <FormItem label="说明">
          <Input v-model:value="varModal.form.desc" placeholder="可选：说明该变量用途" />
        </FormItem>
      </Form>
    </Modal>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue';
  import { message, Card, Table, Tag, Badge, Button, Space, Divider, Popconfirm, Empty, Modal, Form, Input } from 'ant-design-vue';
  import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, EyeInvisibleOutlined, CopyOutlined } from '@ant-design/icons-vue';
  import { PageWrapper } from '@/components/Page';
  import { getEnvList } from '@/api/cicd/cicd.mock';

  const FormItem = Form.Item;

  const envList = ref<any[]>([]);
  const selectedEnv = ref<any>(null);
  const showValues = ref<Record<number, boolean>>({});

  const varColumns = [
    { title: 'Key', dataIndex: 'key', key: 'key', width: 220, ellipsis: true },
    { title: 'Value', key: 'value', ellipsis: true },
    { title: '说明', dataIndex: 'desc', key: 'desc', ellipsis: true },
    { title: '操作', key: 'varAction', width: 100 },
  ];

  let varIdCounter = 100;
  const varModal = reactive({
    visible: false,
    isEdit: false,
    editId: null as number | null,
    form: { key: '', value: '', desc: '' },
  });

  async function loadEnvList() {
    const list = await getEnvList();
    envList.value = list;
    if (list.length) selectedEnv.value = list[0];
  }

  function selectEnv(env: any) {
    selectedEnv.value = env;
  }

  function handleAddEnv() {
    message.info('新增环境功能待对接后端');
  }

  function editEnv(env: any) {
    message.info(`编辑环境：${env.name}`);
  }

  function deleteEnv(env: any) {
    envList.value = envList.value.filter((e) => e.id !== env.id);
    selectedEnv.value = envList.value[0] || null;
    message.success('已删除');
  }

  function toggleShowValue(id: number) {
    showValues.value[id] = !showValues.value[id];
  }

  function maskValue(val: string) {
    if (!val || val.length <= 4) return '****';
    return val.slice(0, 4) + '****';
  }

  function copyValue(val: string) {
    navigator.clipboard.writeText(val).then(() => message.success('已复制'));
  }

  function handleAddVar() {
    varModal.isEdit = false;
    varModal.editId = null;
    varModal.form = { key: '', value: '', desc: '' };
    varModal.visible = true;
  }

  function handleEditVar(record: any) {
    varModal.isEdit = true;
    varModal.editId = record.id;
    varModal.form = { key: record.key, value: record.value, desc: record.desc };
    varModal.visible = true;
  }

  function saveVar() {
    if (!varModal.form.key || !varModal.form.value) {
      message.warning('Key 和 Value 不能为空');
      return;
    }
    if (!selectedEnv.value) return;
    if (varModal.isEdit) {
      const v = selectedEnv.value.vars.find((v: any) => v.id === varModal.editId);
      if (v) Object.assign(v, varModal.form);
    } else {
      selectedEnv.value.vars.push({ id: varIdCounter++, ...varModal.form });
    }
    varModal.visible = false;
    message.success('保存成功');
  }

  function handleDeleteVar(record: any) {
    if (!selectedEnv.value) return;
    selectedEnv.value.vars = selectedEnv.value.vars.filter((v: any) => v.id !== record.id);
    message.success('已删除');
  }

  loadEnvList();
</script>