<script setup lang="ts">
import { ref } from 'vue';
import { createSecret, SecretApiError } from '../api/secrets';
import RainbowConfetti from '../components/RainbowConfetti.vue';

const password = ref('');
const expiryOption = ref<number | null>(null);
const loading = ref(false);
const errorMessage = ref('');
const shareLink = ref('');
const confettiTrigger = ref(0);

const expiryOptions = [
  { title: 'never', value: null },
  { title: '10m', value: 10 },
  { title: '1h', value: 60 },
  { title: '1d', value: 1440 },
];

async function onSubmit() {
  if (!password.value) return;
  loading.value = true;
  errorMessage.value = '';
  shareLink.value = '';
  try {
    const result = await createSecret(password.value, expiryOption.value ?? undefined);
    shareLink.value = `${window.location.origin}/s/${result.id}`;
    password.value = '';
    confettiTrigger.value++;
  } catch (err) {
    errorMessage.value =
      err instanceof SecretApiError ? err.message : 'Could not create the link. Please try again.';
  } finally {
    loading.value = false;
  }
}

async function copyLink() {
  await navigator.clipboard.writeText(shareLink.value);
}

function reset() {
  shareLink.value = '';
  errorMessage.value = '';
}
</script>

<template>
  <RainbowConfetti :trigger="confettiTrigger" />
  <v-container
    class="fill-height"
    max-width="640"
  >
    <v-responsive
      class="mx-auto"
      max-width="560"
    >
      <v-card class="pa-4">
        <p class="term-comment">
          # one-time link, password is encrypted at rest and deleted immediately
          once it's opened
        </p>

        <v-card-text
          v-if="!shareLink"
          class="pa-0"
        >
          <v-form @submit.prevent="onSubmit">
            <label
              class="term-label"
              for="password-field"
            >password</label>
            <v-text-field
              id="password-field"
              v-model="password"
              type="password"
              autocomplete="off"
              density="comfortable"
              class="mb-4"
              :disabled="loading"
              required
            />

            <label class="term-label">expires after</label>
            <v-btn-toggle
              v-model="expiryOption"
              mandatory
              color="primary"
              class="mb-6"
              :disabled="loading"
            >
              <v-btn
                v-for="opt in expiryOptions"
                :key="String(opt.value)"
                :value="opt.value"
                size="small"
              >
                {{ opt.title }}
              </v-btn>
            </v-btn-toggle>

            <v-alert
              v-if="errorMessage"
              type="error"
              density="compact"
              class="mb-4"
            >
              <span class="term-out-prefix">✗</span> {{ errorMessage }}
            </v-alert>

            <v-btn
              type="submit"
              color="primary"
              block
              :loading="loading"
              :disabled="!password"
            >
              $ generate link
            </v-btn>
          </v-form>
        </v-card-text>

        <v-card-text
          v-else
          class="pa-0"
        >
          <v-alert
            type="success"
            density="compact"
            class="mb-4"
          >
            <span class="term-out-prefix">✓</span> link ready, works once
          </v-alert>
          <label class="term-label">shareable link</label>
          <v-text-field
            :model-value="shareLink"
            density="comfortable"
            class="mb-4"
            readonly
          >
            <template #append-inner>
              <v-btn
                icon="mdi-content-copy"
                variant="text"
                size="small"
                @click="copyLink"
              />
            </template>
          </v-text-field>
          <v-btn
            variant="outlined"
            block
            @click="reset"
          >
            $ new
          </v-btn>
        </v-card-text>

        <p class="term-status">
          status: {{ loading ? 'encrypting…' : shareLink ? 'sent' : 'idle' }} · aes-256-gcm
        </p>
      </v-card>
    </v-responsive>
  </v-container>
</template>

<style scoped>
.term-comment {
  color: var(--term-fg-dim);
  font-size: 0.78rem;
  line-height: 1.5;
  margin: 0 0 20px;
}

.term-out-prefix {
  font-weight: 700;
}

.term-status {
  color: var(--term-fg-dim);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  margin: 20px 0 0;
  padding-top: 16px;
  border-top: 1px solid var(--term-border);
}
</style>
