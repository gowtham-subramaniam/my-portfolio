import type { Metadata } from "next";
import SiteNav from "../../../../../components/SiteNav";
import SnapFitExplainer from "../../../../../components/tools/polymer-finder/learn/SnapFitExplainer";
import { profile } from "../../../../../content";

export const metadata: Metadata = {
  title: `Why snap-fits break at the root — ${profile.name}`,
  description:
    "Interactive explainer: bend a cantilever snap-fit arm, watch the strain build at the root, and check it against sourced allowable strains for engineering plastics.",
  openGraph: {
    title: "Why snap-fits break at the root",
    description: "Drag the arm length, thickness and undercut and watch the root strain against the material's limit.",
    url: "https://www.gowthamsubramaniam.com/tools/polymer-finder/learn/snap-fit",
    siteName: profile.name,
    type: "article",
  },
};

export default async function SnapFitPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  return (
    <main style={{ maxWidth: 780, margin: "0 auto", padding: "0 1.25rem" }}>
      <SiteNav />
      <SnapFitExplainer initialMaterial={typeof m === "string" ? m : undefined} />
    </main>
  );
}
