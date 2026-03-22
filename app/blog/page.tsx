import Link from "next/link";
import BlogNav from "../../components/blog/BlogNav";

const posts = [
  {
    slug: "how-plastics-fail",
    title: "How Plastics and Elastomers Fail Over Time",
    date: "March 21, 2026",
    summary: "Viscoelasticity, creep, stress relaxation, DMA, and the WLF equation — how engineers predict long-term polymer failure without waiting decades.",
    tags: ["Materials", "DMA", "Polymers", "Viscoelasticity"],
  },
];

export default function BlogPage() {
  return (
    <main style={{ maxWidth: 780, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <BlogNav />
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground)", marginBottom: "0.5rem" }}>Blog</h1>
      <p style={{ fontSize: 15, color: "var(--subtle)", marginBottom: "2rem" }}>Engineering writeups and technical notes.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "1.25rem 1.5rem", transition: "border-color 0.2s" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "0.6rem" }}>
                {post.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: 11, fontWeight: 600, color: "#1a4a8a", background: "#eef4fc", padding: "2px 9px", borderRadius: 20, border: "1px solid #bdd4f4" }}>{tag}</span>
                ))}
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", marginBottom: "0.4rem" }}>{post.title}</h2>
              <p style={{ fontSize: 13, color: "var(--subtle)", marginBottom: "0.6rem" }}>{post.date}</p>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>{post.summary}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
