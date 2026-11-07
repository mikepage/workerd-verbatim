export interface Post {
  slug: string;
  title: string;
  date: string;
  body: string;
}

export const posts: Post[] = [
  {
    slug: "no-build-step",
    title: "No build step",
    date: "2026-11-07",
    body: "This page is rendered by the TypeScript file in src/. workerd strips the types and runs it.",
  },
  {
    slug: "plain-modules",
    title: "Plain modules in the browser",
    date: "2026-11-06",
    body: "The like button below is one ES module served from public/. No bundler touched it.",
  },
];

export const findPost = (slug: string): Post | undefined => posts.find((p) => p.slug === slug);
