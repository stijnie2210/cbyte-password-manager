<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ trigger: number }>();

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
}

const RAINBOW = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'];
const particles = ref<Particle[]>([]);
let nextId = 0;

watch(
  () => props.trigger,
  () => {
    if (props.trigger === 0) return;
    const burst: Particle[] = Array.from({ length: 28 }, () => ({
      id: nextId++,
      left: Math.random() * 100,
      delay: Math.random() * 0.2,
      duration: 1.1 + Math.random() * 0.7,
      color: RAINBOW[Math.floor(Math.random() * RAINBOW.length)],
    }));
    particles.value.push(...burst);
    setTimeout(() => {
      particles.value = particles.value.filter((p) => !burst.includes(p));
    }, 2200);
  },
);
</script>

<template>
  <div
    class="confetti-layer"
    aria-hidden="true"
  >
    <span
      v-for="p in particles"
      :key="p.id"
      class="confetti-piece"
      :style="{
        left: p.left + '%',
        backgroundColor: p.color,
        animationDelay: p.delay + 's',
        animationDuration: p.duration + 's',
      }"
    />
  </div>
</template>

<style scoped>
.confetti-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 2000;
}

.confetti-piece {
  position: absolute;
  top: -12px;
  width: 8px;
  height: 14px;
  opacity: 0.9;
  border-radius: 1px;
  animation-name: confetti-fall;
  animation-timing-function: ease-in;
  animation-fill-mode: forwards;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
</style>
