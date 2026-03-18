import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bite - Recipe Manager",
    short_name: "Bite",
    description:
      "Save recipes from anywhere — YouTube, TikTok, Instagram, recipe sites and more.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#FF6B35",
    orientation: "portrait-primary",
    categories: ["food", "lifestyle"],
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Import Recipe",
        short_name: "Import",
        url: "/dashboard/recipes/import",
        icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Add Recipe",
        short_name: "New",
        url: "/dashboard/recipes/new",
        icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192" }],
      },
    ],
    share_target: {
      action: "/api/share-target",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
        files: [
          {
            name: "images",
            accept: ["image/*"],
          },
        ],
      },
    },
  } as MetadataRoute.Manifest & { share_target: unknown };
}
