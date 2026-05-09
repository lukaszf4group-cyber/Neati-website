import { defineField, defineType } from "sanity";

export default defineType({
  name: "testimonial",
  title: "Referencje",
  type: "document",
  fields: [
    defineField({
      name: "quote",
      title: "Cytat",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "author",
      title: "Autor",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "position",
      title: "Stanowisko",
      type: "string",
    }),
    defineField({
      name: "company",
      title: "Firma",
      type: "string",
    }),
    defineField({
      name: "rating",
      title: "Ocena (1–5)",
      type: "number",
      validation: (Rule) => Rule.required().min(1).max(5).integer(),
    }),
  ],
  preview: {
    select: { title: "author", subtitle: "company" },
  },
});
