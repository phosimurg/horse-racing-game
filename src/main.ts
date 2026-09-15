import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import { RNG_KEY } from './composables/useRng';
import { createRng } from './domain';
import { resolveSeed } from './utils/resolveSeed';

const app = createApp(App);

app.provide(RNG_KEY, createRng(resolveSeed(window.location.search)));
app.use(createPinia()).mount('#app');
