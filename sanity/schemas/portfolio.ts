import { defineField, defineType } from "sanity";

export default defineType({
  name: "portfolio",
  title: "Realizacje",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Tytuł projektu",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "city",
      title: "Miasto",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "area",
      title: "Powierzchnia (m²)",
      type: "number",
    }),
    defineField({
      name: "description",
      title: "Opis",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "images",
      title: "Zdjęcia",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Tekst alternatywny",
              type: "string",
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "client",
      title: "Klient",
      type: "string",
    }),
    defineField({
      name: "year",
      title: "Rok",
      type: "number",
      validation: (Rule) => Rule.min(2000).max(new Date().getFullYear()),
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "city", media: "images.0" },
  },
});
