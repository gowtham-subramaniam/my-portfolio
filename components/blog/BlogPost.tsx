import BlogNav from "./BlogNav";

export default function BlogPost({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ maxWidth: 780, margin: "0 auto", padding: "0 1.25rem" }}>
      <BlogNav />
      <article style={{ maxWidth: 680, margin: "0 auto", paddingTop: "2rem" }}>
        {children}
      </article>
    </main>
  );
}