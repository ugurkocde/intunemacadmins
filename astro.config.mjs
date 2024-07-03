import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: "https://intunemacadmins.com",
  integrations: [
    {
      name: "plausible",
      hooks: {
        "astro:config:setup": ({ injectScript }) => {
          injectScript(
            "head",
            `
            <script defer data-domain="intunemacadmins.com" src="https://plausible.io/js/script.js"></script>
          `
          );
        },
      },
    },
    starlight({
      title: "IntuneMacAdmins",
      social: {
        github: "https://github.com/ugurkocde/intunemacadmins",
      },
      editLink: {
        baseUrl: "https://github.com/ugurkocde/IntuneMacAdmins/edit/main/",
      },
      sidebar: [
        {
          label: "Home",
          autogenerate: {
            directory: "Home",
          },
        },
        {
          label: "Community",
          autogenerate: {
            directory: "Community",
          },
        },
        {
          label: "Frequently Asked Questions",
          autogenerate: {
            directory: "Frequently Asked Questions",
          },
        },
        {
          label: "Await Final Configuration",
          autogenerate: {
            directory: "Await Final Configuration",
          },
        },
        {
          label: "Platform Single Sign-On (PSSO)",
          badge: "New",
          autogenerate: {
            directory: "Platform Single Sign-On",
          },
        },
        {
          label: "Custom Attributes",
          autogenerate: {
            directory: "Custom Attributes",
          },
        },
        {
          label: "FileVault",
          autogenerate: {
            directory: "FileVault",
          },
        },
        {
          label: "OneDrive Known Folder Move (KFM)",
          autogenerate: {
            directory: "OneDrive Known Folder Move (KFM)",
          },
        },
      ],
    }),
    mdx(),
  ],
});
