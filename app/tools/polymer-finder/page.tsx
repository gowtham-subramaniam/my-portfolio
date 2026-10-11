import type { Metadata } from "next";
import SiteNav from "../../../components/SiteNav";
import PolymerFinder from "../../../components/tools/polymer-finder/PolymerFinder";
import { profile } from "../../../content";

export const metadata: Metadata = {
  title: `Polymer Finder — ${profile.name}`,
  description:
    "Describe your part in plain language and screen 33 engineering polymers for temperature, sterilization, chemical resistance and cost. AI search runs in your browser.",
  openGraph: {
    title: "Polymer Finder",
    description:
      "Plain-language material selection for engineering polymers: temperature, sterilization, chemical resistance and side-by-side comparison.",
    url: "https://www.gowthamsubramaniam.com/tools/polymer-finder",
    siteName: profile.name,
    type: "website",
  },
};

export default function PolymerFinderPage() {
  return (
    <main style={{ maxWidth: 780, margin: "0 auto", padding: "0 1.25rem" }}>
      <SiteNav />
      <PolymerFinder />
    </main>
  );
}
