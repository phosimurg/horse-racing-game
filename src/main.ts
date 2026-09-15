import '@fontsource-variable/archivo/standard.css';
import './styles/layers.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/utilities.css';

import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import { RNG_KEY } from './composables/useRng';
import { createRng } from './domain';
import { createErrorHandler } from './utils/errorHandler';
import { resolveSeed } from './utils/resolveSeed';

const app = createApp(App);

app.config.errorHandler = createErrorHandler();

app.provide(RNG_KEY, createRng(resolveSeed(window.location.search)));
app.use(createPinia()).mount('#app');
