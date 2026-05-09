import { defineField, defineType } from "sanity";

export default defineType({
  name: "client",
  title: "Klienci",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Nazwa firmy",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "country",
      title: "Kraj",
      type: "string",
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "country", media: "logo" },
  },
});
