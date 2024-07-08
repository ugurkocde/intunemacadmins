import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: "https://intunemacadmins.com",
  integrations: [
    starlight({
      title: "IntuneMacAdmins",
      head: [
        {
          tag: "script",
          attrs: {
            defer: true,
            "data-domain": "intunemacadmins.com",
            src: "https://plausible.io/js/script.js",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:title",
            content: "IntuneMacAdmins",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:description",
            content:
              "Community Guides, Tools and Best Practices for Intune Mac Admins.",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "https://intunemacadmins.com/IntuneMacAdmins.jpg",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:url",
            content: "https://intunemacadmins.com",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:type",
            content: "website",
          },
        },
      ],
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
          badge: "Updated",
          autogenerate: {
            directory: "Frequently Asked Questions",
          },
        },
        {
          label: "Await Final Configuration",
          badge: "New",
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
          badge: "New",
          autogenerate: {
            directory: "Custom Attributes",
          },
        },
        {
          label: "FileVault",
          badge: "New",
          autogenerate: {
            directory: "FileVault",
          },
        },
        {
          label: "OneDrive Known Folder Move (KFM)",
          badge: "New",
          autogenerate: {
            directory: "OneDrive Known Folder Move (KFM)",
          },
        },
      ],
    }),
    mdx(),
  ],
});
