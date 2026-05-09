import { defineField, defineType } from "sanity";

export default defineType({
  name: "settings",
  title: "Ustawienia",
  type: "document",
  fields: [
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
    }),
    defineField({
      name: "contactEmail",
      title: "E-mail kontaktowy",
      type: "string",
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: "contactPhone",
      title: "Telefon kontaktowy",
      type: "string",
    }),
    defineField({
      name: "heroTitle",
      title: "Tytuł sekcji Hero",
      type: "string",
    }),
    defineField({
      name: "heroSubtitle",
      title: "Podtytuł sekcji Hero",
      type: "text",
      rows: 3,
    }),
  ],
  preview: {
    select: { title: "tagline" },
    prepare() {
      return { title: "Ustawienia strony" };
    },
  },
});
