import { groq } from "next-sanity";

// ── Portfolio ─────────────────────────────────────────────────────────────────

export const portfolioAllQuery = groq`
  *[_type == "portfolio"] | order(year desc) {
    _id,
    title,
    city,
    area,
    description,
    client,
    year,
    "images": images[]{
      alt,
      "url": asset->url
    }
  }
`;

export const portfolioByIdQuery = groq`
  *[_type == "portfolio" && _id == $id][0] {
    _id,
    title,
    city,
    area,
    description,
    client,
    year,
    "images": images[]{
      alt,
      "url": asset->url
    }
  }
`;

// ── Testimonials ──────────────────────────────────────────────────────────────

export const testimonialsQuery = groq`
  *[_type == "testimonial"] | order(_createdAt desc) {
    _id,
    quote,
    author,
    position,
    company,
    rating
  }
`;

// ── Clients ───────────────────────────────────────────────────────────────────

export const clientsQuery = groq`
  *[_type == "client"] | order(name asc) {
    _id,
    name,
    country,
    "logo": logo.asset->url
  }
`;

// ── Settings (singleton) ──────────────────────────────────────────────────────

export const settingsQuery = groq`
  *[_type == "settings"][0] {
    tagline,
    contactEmail,
    contactPhone,
    heroTitle,
    heroSubtitle
  }
`;
