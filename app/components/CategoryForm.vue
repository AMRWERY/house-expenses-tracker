<template>
  <form novalidate @submit.prevent="submit">
    <!-- Name + live preview -->
    <div class="cat-name">
      <span class="row-icon" :style="{ '--c': color }"><AppIcon :name="icon" /></span>
      <div class="cat-name-field">
        <label class="field-label" for="category-name">{{ t("category_name") }}</label>
        <input
          id="category-name"
          ref="nameEl"
          v-model="name"
          class="field field-input"
          type="text"
          :maxlength="CATEGORY_NAME_MAX"
          :placeholder="t('category_name_placeholder')"
          :aria-invalid="nameError"
          :aria-describedby="nameError ? 'category-name-err' : undefined"
          @input="nameError = false"
        />
      </div>
    </div>
    <p v-if="nameError" id="category-name-err" class="field-error field-error-inline">
      {{ t("category_name_required") }}
    </p>

    <!-- Color -->
    <span class="field-label cat-label">{{ t("category_color") }}</span>
    <div class="swatches" role="radiogroup" :aria-label="t('category_color')">
      <button
        v-for="c in CATEGORY_COLOR_CHOICES"
        :key="c"
        type="button"
        role="radio"
        class="swatch"
        :style="{ '--c': c }"
        :aria-label="c"
        :aria-checked="color === c"
        @click="color = c"
      >
        <AppIcon v-if="color === c" name="check" />
      </button>
    </div>

    <!-- Icon -->
    <span class="field-label cat-label">{{ t("category_icon") }}</span>
    <div class="icon-choices" role="radiogroup" :aria-label="t('category_icon')">
      <button
        v-for="i in CATEGORY_ICON_CHOICES"
        :key="i"
        type="button"
        role="radio"
        class="icon-choice"
        :style="{ '--c': color }"
        :aria-label="i"
        :aria-checked="icon === i"
        @click="icon = i"
      >
        <AppIcon :name="i" />
      </button>
    </div>

    <p v-if="error" class="field-error sheet-error" role="alert">{{ t(error) }}</p>

    <button class="btn btn-block" type="submit" :disabled="busy">{{ t("save") }}</button>

    <template v-if="editing">
      <button v-if="!confirming" class="btn-text danger" type="button" :disabled="busy" @click="confirming = true">
        {{ t("delete_category") }}
      </button>
      <div v-else class="cat-confirm" role="alertdialog" :aria-label="t('delete_category')">
        <p>{{ t("delete_category_confirm") }}</p>
        <button class="btn-text danger" type="button" :disabled="busy" @click="sheet.remove()">{{ t("delete") }}</button>
        <button class="btn-text" type="button" @click="confirming = false">{{ t("cancel") }}</button>
      </div>
    </template>
  </form>
</template>

<script lang="ts" setup>
const { t } = useI18n();

const sheet = useCategorySheetStore();
const { editing, error, busy } = storeToRefs(sheet);

// Form state, prefilled when editing. (The sheet re-creates this component per category via :key.)
const initial = editing.value;
const name = ref(initial?.name ?? "");
const color = ref<string>(initial?.color ?? CATEGORY_COLOR_CHOICES[2]);
const icon = ref<IconName>(initial?.icon ?? "tag");
const nameError = ref(false);
const confirming = ref(false);
const nameEl = ref<HTMLInputElement>();

function submit() {
  if (!name.value.trim()) {
    nameError.value = true;
    nameEl.value?.focus();
    return;
  }
  sheet.save({ name: name.value.trim(), color: color.value, icon: icon.value });
}

onMounted(() => {
  if (!initial) nameEl.value?.focus({ preventScroll: true });
});
</script>
