"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Plane,
  Shield,
  Users,
  Zap,
  Github,
  MessageSquare,
  Mail,
  CheckCircle2,
  Globe,
  Download,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AboutPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background gradients - matching LiveryHero */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div
          className="absolute top-0 left-0 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/2 right-0 w-[500px] h-[500px] translate-x-1/3 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 text-center z-20 overflow-hidden">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/pacific.png"
            alt="Background"
            fill
            className="object-cover opacity-30"
            priority
          />
          {/* Gradient Overlay to blend with page background */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
        </div>

        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight  duration-700 delay-100">
            <span className="text-foreground">Built for </span>
            <span className="bg-gradient-to-b from-white via-primary to-primary bg-clip-text text-transparent">
              Aeronautica.
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed  duration-700 delay-200">
            Enhancing your Aeronautica experience.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8  duration-700 delay-300">
            <Button size="lg" className="h-12 px-8  text-base" asChild>
              <Link href="/liveries">
                Start Exploring <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* STATS STRIP - Aligned with LiveryHero stats styling */}
      {/* <div className="border-y border-border/50 bg-background/50 backdrop-blur-sm relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-12 flex flex-wrap justify-center md:justify-around gap-8 text-center items-center">
          <StatItem value="100%" label="Open Source" />
          <div className="hidden md:block w-px h-12 bg-border" />
          <StatItem value="500+" label="Liveries" />
          <div className="hidden md:block w-px h-12 bg-border" />
          <StatItem value="50+" label="Aircraft" />
          <div className="hidden md:block w-px h-12 bg-border" />
          <StatItem value="24/7" label="Reliability" />
        </div>
      </div> */}

      {/* FAQ SECTION */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <FAQItem
              value="free"
              question="Is AEROHUB free?"
              answer="Yes. AEROHUB is 100% free for browsing, downloading, and uploading. Spread the word and help us grow!"
            />
            <FAQItem
              value="games"
              question="What features does AEROHUB offer?"
              answer="AEROHUB is currently focused on providing a seamless experience for sharing and browsing liveries. Future plans may include trade listings, in-game integrations, and more!"
            />
            <FAQItem
              value="upload"
              question="How do I post a livery?"
              answer="Create an account, click 'Post', and complete the form. It's that simple!"
            />
            <FAQItem
              value="security"
              question="How do I trust you?"
              answer="We recommend using Discord OAuth sign-in for secure authentication, and we recommend you never share any Personally Identifiable Information (PII) with us. 
              Additionally, we only use industry-standard technologies and cloud services to ensure the platform's reliability and security. 
              We are committed to transparency and are always open to feedback and questions."
            />
            <FAQItem
              value="founder"
              question="Who is responsible for the AEROHUB platform?"
              answer="ItsSkelly is the lead developer of AEROHUB. He is also the founder of NOVUS, a reputable Roblox Flight Simulator. Additionally, AEROHUB is developed and maintained in partnership with the Aeronautica Team."
            />
            <FAQItem
              value="discord"
              question="Where can I follow the project?"
              answer="Join the discord server here: https://discord.gg/<INSERT_INVITE>"
            />
          </Accordion>
        </div>
      </section>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Component Styles based on Liveries Components
// -----------------------------------------------------------------------------

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl md:text-4xl font-bold text-foreground">
        {value}
      </span>
      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative rounded-xl overflow-hidden bg-muted/10 border border-border/50 p-6 hover:border-primary/50 hover:bg-muted/20 transition-all duration-300">
      <div className="mb-4 text-primary p-3 bg-background/50 rounded-lg w-fit">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function FAQItem({
  value,
  question,
  answer,
}: {
  value: string;
  question: string;
  answer: string;
}) {
  return (
    <AccordionItem
      value={value}
      className="border-none rounded-xl bg-muted/10 px-2 data-[state=open]:bg-muted/20 transition-colors"
    >
      <AccordionTrigger className="text-base font-medium hover:no-underline py-4 px-4">
        {question}
      </AccordionTrigger>
      <AccordionContent className="text-muted-foreground text-sm leading-relaxed px-4 pb-4">
        {answer}
      </AccordionContent>
    </AccordionItem>
  );
}
