<template>
  <Select
    show-search
    :option-label-prop="optionLabelProp || undefined"
    :filter-option="filterOption"
    @dropdown-visible-change="handleFetch"
    v-bind="$attrs"
    @change="handleChange"
    @search="debounceSearchFn"
    :options="getOptions"
    v-model:value="state"
  >
    <template #[item]="data" v-for="item in Object.keys($slots)">
      <slot :name="item" v-bind="data || {}"></slot>
    </template>
    <template #suffixIcon v-if="loading">
      <LoadingOutlined spin />
    </template>
    <template #notFoundContent v-if="loading">
      <span>
        <LoadingOutlined spin class="mr-1" />
        {{ t('component.form.apiSelectNotFound') }}
      </span>
    </template>
  </Select>
</template>

<script lang="ts" setup>
  import { computed, PropType, ref, unref, watch } from 'vue';
  import { Select } from 'ant-design-vue';
  import type { SelectValue } from 'ant-design-vue/es/select';
  import { isEmpty, isFunction } from '@/utils/is';
  import { useRuleFormItem } from '@/hooks/component/useFormItem';
  import { assignIn, get, isEqual, omit } from 'lodash-es';
  import { LoadingOutlined } from '@ant-design/icons-vue';
  import { useI18n } from '@/hooks/web/useI18n';
  import { propTypes } from '@/utils/propTypes';
  import { useDebounceFn } from '@vueuse/core';
  import { defHttp } from '@/utils/http/axios';

  type OptionsItem = { label?: string; value?: string; disabled?: boolean; [name: string]: any };

  type ApiSearchOption = {
    // 展示搜索
    show?: boolean;
    // 待搜索字段名
    searchName?: string;
    // 是否允许空搜索
    emptySearch?: boolean;
    // 搜索前置方法
    beforeFetch?: (value?: string) => Promise<string>;
    // 拦截方法
    interceptFetch?: (value?: string) => Promise<boolean>;
  };

  defineOptions({ name: 'ApiSelect', inheritAttrs: false });

  const props = defineProps({
    value: { type: [Array, Object, String, Number] as PropType<SelectValue> },
    numberToString: propTypes.bool,
    api: {
      type: [Function, String] as PropType<((arg?: any) => Promise<OptionsItem[] | Recordable>) | string>,
      default: null,
    },
    // api params
    params: propTypes.any.def({}),
    // support xxx.xxx.xx
    resultField: propTypes.string.def(''),
    labelField: propTypes.string.def('label'),
    valueField: propTypes.string.def('value'),
    optionLabelProp: propTypes.string.def(''),
    immediate: propTypes.bool.def(true),
    alwaysLoad: propTypes.bool.def(false),
    options: {
      type: Array<OptionsItem>,
      default: [],
    },
    apiSearch: {
      type: Object as PropType<ApiSearchOption>,
      default: () => null,
    },
    beforeFetch: {
      type: Function as PropType<Fn>,
      default: null,
    },
    afterFetch: {
      type: Function as PropType<Fn>,
      default: null,
    },
  });

  const emit = defineEmits(['options-change', 'change', 'update:value']);

  const optionsRef = ref<OptionsItem[]>([]);

  const loading = ref(false);
  // 首次是否加载过了
  const isFirstLoaded = ref(false);
  const emitData = ref<OptionsItem[]>([]);
  const searchParams = ref<any>({});
  const { t } = useI18n();

  // Embedded in the form, just use the hook binding to perform form verification
  const [state] = useRuleFormItem(props, 'value', 'change', emitData);

  const getOptions = computed(() => {
    const { labelField, valueField, numberToString } = props;

    let data = unref(optionsRef).reduce((prev, next: any) => {
      if (next) {
        const value = get(next, valueField);
        prev.push({
          ...omit(next, [labelField, valueField]),
          label: get(next, labelField),
          value: numberToString ? `${value}` : value,
        });
      }
      return prev;
    }, [] as OptionsItem[]);
    return data.length > 0 ? data : props.options;
  });

  watch(
    () => state.value,
    (v) => {
      emit('update:value', v);
    },
  );

  watch(
    () => props.params,
    (value, oldValue) => {
      if (isEqual(value, oldValue)) return;
      if (oldValue !== undefined) {
        state.value = undefined;
      }
      fetch();
    },
    { deep: true, immediate: props.immediate },
  );

  watch(
    () => searchParams.value,
    (value, oldValue) => {
      if (isEmpty(value) || isEqual(value, oldValue)) return;
      (async () => {
        await fetch();
        searchParams.value = {};
      })();
    },
    { deep: true, immediate: props.immediate },
  );

  async function fetch() {
    let { api, beforeFetch, afterFetch, params, resultField } = props;
    if (!api || loading.value) return;

    if (params && typeof params === 'object') {
      const keys = Object.keys(params);
      for (const k of keys) {
        if (['fullName', 'repoId', 'serverId'].includes(k)) {
          const v = params[k];
          if (v === '' || v === null || v === undefined) {
            optionsRef.value = [];
            isFirstLoaded.value = false;
            return;
          }
        }
      }
    }

    let fetchApiFn: any = api;
    if (typeof api === 'string') {
      fetchApiFn = (p: any) => defHttp.get({ url: api as string, params: p });
    } else if (!isFunction(api)) {
      return;
    }
    optionsRef.value = [];
    try {
      loading.value = true;
      let apiParams = assignIn({}, params, searchParams.value);
      if (beforeFetch && isFunction(beforeFetch)) {
        apiParams = (await beforeFetch(apiParams)) || apiParams;
      }
      let res = await fetchApiFn(apiParams);
      if (afterFetch && isFunction(afterFetch)) {
        res = (await afterFetch(res)) || res;
      }
      isFirstLoaded.value = true;
      if (Array.isArray(res)) {
        optionsRef.value = res;
        emitChange();
        return;
      }
      if (resultField) {
        optionsRef.value = get(res, resultField) || [];
      }
      emitChange();
    } catch (error) {
      console.warn(error);
      isFirstLoaded.value = false;
    } finally {
      loading.value = false;
    }
  }

  async function handleFetch(visible: boolean) {
    if (visible) {
      if (props.alwaysLoad || unref(optionsRef).length === 0) {
        await fetch();
      } else if (!props.immediate && !unref(isFirstLoaded)) {
        if (!(!!props.apiSearch && !!props.apiSearch.show && !props.apiSearch.emptySearch)) {
          await fetch();
        } else {
          optionsRef.value = [];
          emitChange();
        }
      }
    }
  }

  let debounceSearchFn = useDebounceFn(handleSearch, 500);

  async function handleSearch(value: any) {
    if (!props.apiSearch) {
      return;
    }
    const { show, searchName, beforeFetch, interceptFetch } = props.apiSearch;
    if (!show || !searchName) {
      return;
    }

    value = value || undefined;
    if (beforeFetch && isFunction(beforeFetch)) {
      value = (await beforeFetch(value)) || value;
    }

    if (interceptFetch && isFunction(interceptFetch)) {
      if (!(await interceptFetch(value))) {
        return;
      }
    }
    searchParams.value = {
      [searchName]: value,
    };
  }

  function emitChange() {
    emit('options-change', unref(getOptions));
  }

  function handleChange(_, ...args) {
    emitData.value = args;
  }

  function filterOption(input: string, option: any) {
    if (!input) return true;
    const label = option?.label ?? '';
    const value = option?.value ?? '';
    const str = `${label} ${value}`.toLowerCase();
    return str.includes(input.trim().toLowerCase());
  }
</script>
