import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import ImportTerminal from "@/components/landing/import-terminal";
import Navbar from "@/components/landing/navbar";
import Hero from "@/components/landing/hero";
import GeminiSection from "@/components/landing/gemini-section";
import PropBlocks from "@/components/landing/prop-block";
import Footer from "@/components/landing/footer";

export default async function Page() {
  const user = await currentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="bg-white text-text-primary overflow-x-hidden">
      <Navbar />
      <Hero />

      <section className="container pb-20">
        <ImportTerminal />
      </section>

      <div className="container">
        <PropBlocks />
      </div>

      <GeminiSection />
      <Footer />
    </main>
  );
}
