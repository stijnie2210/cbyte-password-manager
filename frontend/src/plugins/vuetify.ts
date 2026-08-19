import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import '../assets/terminal.css';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'terminal',
    themes: {
      terminal: {
        dark: true,
        colors: {
          background: '#0a0a0a',
          surface: '#0f0f0f',
          'surface-variant': '#1a1a1a',
          primary: '#00ff9c',
          secondary: '#7a7a7a',
          error: '#ff5f56',
          warning: '#ffbd2e',
          success: '#00ff9c',
          info: '#5fd7ff',
          'on-background': '#d4d4d4',
          'on-surface': '#d4d4d4',
        },
      },
    },
  },
  defaults: {
    VBtn: { rounded: '0', variant: 'flat' },
    VCard: { rounded: '0', elevation: 0 },
    VTextField: { rounded: '0', variant: 'outlined' },
    VAlert: { rounded: '0', variant: 'outlined' },
    VBtnToggle: { rounded: '0', divided: true },
  },
});
