import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import mdx from "@astrojs/mdx";
import starlightImageZoom from "starlight-image-zoom";

// https://astro.build/config
export default defineConfig({
  site: "https://intunemacadmins.com",
  integrations: [
    starlight({
      plugins: [starlightImageZoom()],
      title: "IntuneMacAdmins",
      components: {
        LastUpdated: "./src/components/LastUpdated.astro",
        ThemeProvider: "./src/components/ThemeProvider.astro",
        ThemeSelect: "./src/components/ThemeSelect.astro",
      },
      lastUpdated: true,
      head: [
        {
          tag: "meta",
          attrs: {
            name: "keywords",
            content:
              "Intune, Mac Admins, Apple, Device Management, IT, Guides, Best Practices, MDM, MacOS, Scripts, Tools",
          },
        },
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
              "The best place for sharing and learning from real-world experiences with community guides, scripts, tools, and best practices.",
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
        {
          tag: "meta",
          attrs: {
            property: "author",
            content: "Ugur Koc",
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "publish_date",
            content: "2024",
          },
        },
        // Twitter Meta Tags
        {
          tag: "meta",
          attrs: {
            name: "twitter:card",
            content: "summary_large_image",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "twitter:domain",
            content: "intunemacadmins.com",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "twitter:url",
            content: "https://intunemacadmins.com",
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "twitter:title",
            content: "IntuneMacAdmins",
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "twitter:description",
            content:
              "Community Guides, Tools and Best Practices for Intune Mac Admins.",
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "twitter:image",
            content: "https://intunemacadmins.com/IntuneMacAdmins.jpg",
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
          label: "Intune Getting Started Guide",
          autogenerate: {
            directory: "Intune Getting Started Guide",
          },
        },
        {
          label: "Complete Guide Macos Deployment",
          badge: "New",
          autogenerate: {
            directory: "Complete Guide Macos Deployment",
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
          autogenerate: {
            directory: "Platform Single Sign-On",
          },
        },
        {
          label: "Declarative Device Management (DDM)",
          autogenerate: {
            directory: "Declarative Device Management",
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
        {
          label: "Updating Microsoft Apps",
          autogenerate: {
            directory: "Updating Microsoft Apps",
          },
        },
        {
          label: "Deploy Files on a Mac",
          autogenerate: {
            directory: "Deploy Files",
          },
        },
      ],
      customCss: process.env.NO_GRADIENTS
        ? ["./src/styles/custom.css"]
        : ["./src/styles/landing.css", "./src/styles/custom.css"],
    }),
    mdx(),
  ],
});
