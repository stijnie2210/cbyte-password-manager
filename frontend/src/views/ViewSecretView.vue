<script setup lang="ts">
import { ref } from 'vue';
import { consumeSecret, SecretApiError } from '../api/secrets';
import RainbowConfetti from '../components/RainbowConfetti.vue';

const props = defineProps<{ id: string }>();

const password = ref('');
const errorMessage = ref('');
const loading = ref(false);
const revealed = ref(false);
const confettiTrigger = ref(0);

async function reveal() {
  loading.value = true;
  errorMessage.value = '';
  try {
    password.value = await consumeSecret(props.id);
    revealed.value = true;
    confettiTrigger.value++;
  } catch (err) {
    errorMessage.value =
      err instanceof SecretApiError ? err.message : 'Could not retrieve the password.';
  } finally {
    loading.value = false;
  }
}

async function copyPassword() {
  await navigator.clipboard.writeText(password.value);
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
          # one-time reveal, this password is deleted from the server immediately after
          opening
        </p>

        <v-card-text
          v-if="!revealed && !errorMessage"
          class="pa-0"
        >
          <v-alert
            type="warning"
            density="compact"
            class="mb-4"
          >
            <span class="term-out-prefix">Note:</span> can only be viewed once, save it
            immediately
          </v-alert>
          <v-btn
            color="primary"
            block
            :loading="loading"
            @click="reveal"
          >
            $ reveal password
          </v-btn>
        </v-card-text>

        <v-card-text
          v-else-if="revealed"
          class="pa-0"
        >
          <v-alert
            type="success"
            density="compact"
            class="mb-4"
          >
            <span class="term-out-prefix">✓</span> deleted from the server, this page will
            not show it again
          </v-alert>
          <label class="term-label">password</label>
          <v-text-field
            :model-value="password"
            density="comfortable"
            readonly
          >
            <template #append-inner>
              <v-btn
                icon="mdi-content-copy"
                variant="text"
                size="small"
                @click="copyPassword"
              />
            </template>
          </v-text-field>
        </v-card-text>

        <v-card-text
          v-else
          class="pa-0"
        >
          <v-alert
            type="error"
            density="compact"
          >
            <span class="term-out-prefix">✗</span> {{ errorMessage }}
          </v-alert>
        </v-card-text>

        <p class="term-status">
          status: {{ loading ? 'decrypting…' : revealed ? 'consumed' : 'idle' }} · aes-256-gcm
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
