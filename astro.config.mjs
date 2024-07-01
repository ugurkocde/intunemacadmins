import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: 'https://intunemacadmins.com',
  integrations: [starlight({
    title: 'IntuneMacAdmins',
    social: {
      github: 'https://github.com/ugurkocde/intunemacadmins'
    },
    editLink: {
      baseUrl: 'https://github.com/ugurkocde/IntuneMacAdmins/edit/main/',
    },
    sidebar: [
    {
      label: 'Home',
      autogenerate: {
        directory: 'Home'
      }
    }, {
      label: 'Community',
      autogenerate: {
        directory: 'Community'
      }
    }, {
      label: 'Frequently Asked Questions',
      autogenerate: {
        directory: 'Frequently Asked Questions'
      }
    }, {
      label: 'Await Final Configuration',
      autogenerate: {
        directory: 'Await Final Configuration'
      }
    }, {
      label: 'Platform Single Sign-On (PSSO)',
      autogenerate: {
        directory: 'Platform Single Sign-On'
      }
    }, {
      label: 'Custom Attributes',
      autogenerate: {
        directory: 'Custom Attributes'
      }
    }, {
      label: 'FileVault',
      autogenerate: {
        directory: 'FileVault'
      }
    }]
  }), mdx()]
});