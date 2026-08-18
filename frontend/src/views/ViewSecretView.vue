<script setup lang="ts">
import { ref } from 'vue';
import { consumeSecret, SecretApiError } from '../api/secrets';

const props = defineProps<{ id: string }>();

const password = ref('');
const errorMessage = ref('');
const loading = ref(false);
const revealed = ref(false);

async function reveal() {
  loading.value = true;
  errorMessage.value = '';
  try {
    password.value = await consumeSecret(props.id);
    revealed.value = true;
  } catch (err) {
    errorMessage.value =
      err instanceof SecretApiError ? err.message : 'Kon het wachtwoord niet ophalen.';
  } finally {
    loading.value = false;
  }
}

async function copyPassword() {
  await navigator.clipboard.writeText(password.value);
}
</script>

<template>
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
          Wachtwoord bekijken
        </v-card-title>

        <v-card-text v-if="!revealed && !errorMessage">
          <v-alert
            type="warning"
            density="compact"
            class="mb-4"
          >
            Dit wachtwoord kan maar één keer bekeken worden. Zodra je het opent, wordt het
            permanent verwijderd. Sla het direct op.
          </v-alert>
          <v-btn
            color="primary"
            block
            :loading="loading"
            @click="reveal"
          >
            Toon wachtwoord
          </v-btn>
        </v-card-text>

        <v-card-text v-else-if="revealed">
          <v-alert
            type="success"
            density="compact"
            class="mb-4"
          >
            Dit wachtwoord is nu verwijderd van de server. Sla het op, deze pagina toont het
            niet nogmaals.
          </v-alert>
          <v-text-field
            :model-value="password"
            label="Wachtwoord"
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

        <v-card-text v-else>
          <v-alert
            type="error"
            density="compact"
          >
            {{ errorMessage }}
          </v-alert>
        </v-card-text>
      </v-card>
    </v-responsive>
  </v-container>
</template>
