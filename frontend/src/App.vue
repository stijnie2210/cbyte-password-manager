<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const routeLabels: Record<string, string> = {
  share: 'password-share',
  'view-secret': 'view-secret',
};

const typedLabel = ref('');
let typing: ReturnType<typeof setInterval> | undefined;

function typeLabel(text: string) {
  if (typing) clearInterval(typing);
  typedLabel.value = '';
  let i = 0;
  typing = setInterval(() => {
    i++;
    typedLabel.value = text.slice(0, i);
    if (i >= text.length && typing) {
      clearInterval(typing);
      typing = undefined;
    }
  }, 45);
}

watch(
  () => route.name,
  (name) => typeLabel(routeLabels[String(name)] ?? 'password-share'),
  { immediate: true },
);

onUnmounted(() => {
  if (typing) clearInterval(typing);
});
</script>

<template>
  <v-app>
    <v-app-bar
      flat
      color="background"
      height="48"
      class="term-bar"
    >
      <span class="term-bar__prompt">
        avionics-intl<span class="term-bar__muted">:~$</span> {{ typedLabel }}<span
          class="term-cursor"
        />
      </span>
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<style scoped>
.term-bar {
  border-bottom: 1px solid var(--term-border);
  padding: 0 16px;
}

.term-bar__prompt {
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  color: var(--term-fg);
}

.term-bar__muted {
  color: var(--term-fg-dim);
}
</style>
