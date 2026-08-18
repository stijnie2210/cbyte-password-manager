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
  { title: 'Geen vervaldatum', value: null },
  { title: '10 minuten', value: 10 },
  { title: '1 uur', value: 60 },
  { title: '1 dag', value: 1440 },
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
      err instanceof SecretApiError ? err.message : 'Kon de link niet aanmaken. Probeer het opnieuw.';
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
      <v-card
        elevation="2"
        class="pa-2"
      >
        <v-card-title class="text-h6">
          Wachtwoord delen
        </v-card-title>
        <v-card-subtitle>
          Maak een eenmalige link aan. Het wachtwoord wordt versleuteld opgeslagen en direct
          verwijderd zodra de link is geopend.
        </v-card-subtitle>

        <v-card-text v-if="!shareLink">
          <v-form @submit.prevent="onSubmit">
            <v-text-field
              v-model="password"
              label="Wachtwoord"
              type="password"
              autocomplete="off"
              :disabled="loading"
              required
            />
            <v-select
              v-model="expiryOption"
              :items="expiryOptions"
              item-title="title"
              item-value="value"
              label="Vervalt na"
              :disabled="loading"
            />
            <v-alert
              v-if="errorMessage"
              type="error"
              density="compact"
              class="mb-4"
            >
              {{ errorMessage }}
            </v-alert>
            <v-btn
              type="submit"
              color="primary"
              block
              :loading="loading"
              :disabled="!password"
            >
              Link aanmaken
            </v-btn>
          </v-form>
        </v-card-text>

        <v-card-text v-else>
          <v-alert
            type="success"
            density="compact"
            class="mb-4"
          >
            Link aangemaakt. Deze werkt maar één keer.
          </v-alert>
          <v-text-field
            :model-value="shareLink"
            label="Deelbare link"
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
            variant="tonal"
            block
            @click="reset"
          >
            Nog een link aanmaken
          </v-btn>
        </v-card-text>
      </v-card>
    </v-responsive>
  </v-container>
</template>
