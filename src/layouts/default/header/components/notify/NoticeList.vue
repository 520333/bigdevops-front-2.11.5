<template>
  <List :class="prefixCls" bordered :pagination="getPagination">
    <template v-for="item in getData" :key="item.id">
      <List.Item class="list-item" @click="handleTitleClick(item)">
        <List.Item.Meta>
          <template #title>
            <div class="title flex justify-between items-start">
              <div class="title-text flex-1 min-w-0 mr-2">
                <Typography.Paragraph
                  class="!mb-0"
                  :delete="!!item.titleDelete"
                  :ellipsis="
                    titleRows && titleRows > 0 ? { rows: titleRows, tooltip: !!item.title } : false
                  "
                  :content="item.title"
                />
              </div>
              <div class="extra shrink-0" v-if="item.extra">
                <Tag class="tag" :color="item.color">
                  {{ item.extra }}
                </Tag>
              </div>
            </div>
          </template>

          <template #avatar>
            <Avatar v-if="item.avatar" class="avatar" :src="item.avatar" />
            <span v-else> {{ item.avatar }}</span>
          </template>

          <template #description>
            <div>
              <div class="description" v-if="item.description">
                <Typography.Paragraph
                  :ellipsis="
                    descRows && descRows > 0
                      ? { rows: descRows, tooltip: !!item.description }
                      : false
                  "
                  :content="item.description"
                />
              </div>
              <div class="datetime">
                {{ item.datetime }}
              </div>
            </div>
          </template>
        </List.Item.Meta>
      </List.Item>
    </template>
  </List>
</template>
<script lang="ts" setup>
  import { computed, PropType, ref, watch, unref } from 'vue';
  import { ListItem } from './data';
  import { useDesign } from '@/hooks/web/useDesign';
  import { List, Avatar, Tag, Typography } from 'ant-design-vue';
  import { isNumber } from '@/utils/is';

  const props = defineProps({
    list: {
      type: Array as PropType<ListItem[]>,
      default: () => [],
    },
    pageSize: {
      type: [Boolean, Number] as PropType<Boolean | Number>,
      default: 5,
    },
    currentPage: {
      type: Number,
      default: 1,
    },
    titleRows: {
      type: Number,
      default: 1,
    },
    descRows: {
      type: Number,
      default: 2,
    },
    onTitleClick: {
      type: Function as PropType<(Recordable) => void>,
    },
  });

  const emit = defineEmits(['update:currentPage', 'titleClick', 'title-click']);

  const { prefixCls } = useDesign('header-notify-list');
  const current = ref(props.currentPage || 1);
  const getData = computed(() => {
    const { pageSize, list } = props;
    if (pageSize === false) return [];
    let size = isNumber(pageSize) ? pageSize : 5;
    return list.slice(size * (unref(current) - 1), size * unref(current));
  });
  watch(
    () => props.currentPage,
    (v) => {
      current.value = v;
    },
  );
  const getPagination = computed(() => {
    const { list, pageSize } = props;

    // compatible line 104
    // if typeof pageSize is boolean, Number(true) && 5 = 5, Number(false) && 5 = 0
    const size = isNumber(pageSize) ? pageSize : Number(pageSize) && 5;

    if (size > 0 && list && list.length > size) {
      return {
        total: list.length,
        pageSize: size,
        current: unref(current),
        onChange(page) {
          current.value = page;
          emit('update:currentPage', page);
        },
      };
    } else {
      return false;
    }
  });

  function handleTitleClick(item: ListItem) {
    emit('title-click', item);
  }
</script>
<style lang="less" scoped>
  @prefix-cls: ~'@{namespace}-header-notify-list';

  .@{prefix-cls} {
    &::-webkit-scrollbar {
      display: none;
    }

    ::v-deep(.ant-pagination-disabled) {
      display: inline-block !important;
    }

    .list-item {
      padding: 6px;
      overflow: hidden;
      transition: all 0.3s;
      cursor: pointer;

      .title {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 6px;
        font-weight: normal;

        .title-text {
          flex: 1;
          min-width: 0;
          margin-right: 8px;

          .ant-typography {
            margin-bottom: 0 !important;
          }
        }

        .extra {
          flex-shrink: 0;
          font-weight: normal;

          .tag {
            margin-right: 0;
          }
        }
      }

      .avatar {
        margin-top: 4px;
      }

      .description {
        font-size: 12px;
        line-height: 18px;
      }

      .datetime {
        margin-top: 4px;
        font-size: 12px;
        line-height: 18px;
      }
    }
  }
</style>
