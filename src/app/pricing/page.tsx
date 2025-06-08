import { Header } from "@/components/ui/header";
import { PricingSection } from "@/components/ui/pricing";

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen" style={{ backgroundColor: '#1A1A1C' }}>
        <PricingSection />
      </main>
    </>
  );
} 