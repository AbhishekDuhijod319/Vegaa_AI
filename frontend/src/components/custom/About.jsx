import React, { useRef } from 'react';
import { ArrowRight, Globe, Heart, Shield, Sparkles, Map, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import SmartImage from '@/components/ui/SmartImage';
import { useReveal } from '@/lib/useReveal';

// --- Hero Section ---
const Hero = () => {
  return (
    <section className="relative h-[100svh] w-full overflow-hidden flex items-center justify-center">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <SmartImage
          query="abstract landscape travel cinematic"
          alt="Cinematic Travel Background"
          className="w-full h-full object-cover opacity-80"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto space-y-8">
        <div className="anim-fade-in-up">
          <span className="inline-block py-1 px-3 rounded-full border border-white/30 bg-white/10 text-white/90 text-sm font-medium tracking-wide mb-6 liquid-glass-subtle">
            EST. 2025
          </span>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-semibold text-white tracking-tight leading-none mix-blend-overlay">
            Reimagining <br /> <span className="italic font-light">Travel</span>
          </h1>
        </div>

        <p className="anim-fade-in-up anim-delay-2 text-lg md:text-2xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed">
          We believe the journey should be as beautiful as the destination.
          Vegaa AI fuses human curiosity with machine precision to craft the perfect itinerary.
        </p>
      </div>

      {/* Scroll Indicator */}
      <div className="anim-fade-in anim-delay-5 absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50">
        <span className="text-xs tracking-[0.2em] uppercase">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent" style={{ animation: 'gentlePulse 2s ease-in-out infinite' }} />
      </div>
    </section>
  );
};

// --- Values Components (Bento Grid) ---
const ValueCard = ({ icon: Icon, title, desc, className, delay }) => (
  <div
    className={cn(
      "reveal group relative p-8 rounded-3xl liquid-glass overflow-hidden hover:bg-white/20 transition-all duration-500",
      className
    )}
    data-reveal-delay={delay * 1000}
  >
    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110 group-hover:-rotate-12">
      <Icon size={120} />
    </div>
    <div className="relative z-10 h-full flex flex-col justify-between">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
        <Icon size={24} />
      </div>
      <div>
        <h3 className="text-2xl font-semibold mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  </div>
);

const Values = () => {
  const containerRef = useReveal();

  return (
    <section className="py-24 md:py-32 px-6 bg-secondary/5" ref={containerRef}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 max-w-3xl reveal">
          <h2 className="text-4xl md:text-6xl font-semibold mb-6 text-foreground">Our Core Values</h2>
          <p className="text-xl text-muted-foreground font-light">
            We're building more than just an app; we're building a new philosophy of exploration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px]">
          {/* Main Large Card */}
          <ValueCard
            icon={Sparkles}
            title="AI Precision"
            desc="Algorithms that understand nuance. We don't just find places; we find feelings, atmospheres, and moments tailored exactly to you."
            className="md:col-span-2 bg-gradient-to-br from-primary/5 to-transparent"
            delay={0}
          />
          <ValueCard
            icon={Heart}
            title="Human Touch"
            desc="Technology serving humanity. Every recommendation is curated to foster genuine connection and cultural appreciation."
            className=""
            delay={0.1}
          />
          <ValueCard
            icon={Shield}
            title="Privacy First"
            desc="Your journey is yours alone. We protect your data with the same rigor we apply to our code."
            className=""
            delay={0.2}
          />
          <ValueCard
            icon={Globe}
            title="Global Lens"
            desc="Respecting local cultures and sustainable tourism in every itinerary we generate."
            className="md:col-span-2"
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
};

// --- Story Section ---
const Story = () => {
  const containerRef = useReveal();

  return (
    <section className="py-24 md:py-32 px-6" ref={containerRef}>
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden order-2 md:order-1 reveal">
          <SmartImage
            query="team collaboration startup office modern"
            alt="Our Team Planning"
            className="w-full h-full object-cover"
            width={800}
            height={1000}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
            <div className="text-white">
              <p className="italic text-2xl">"Travel is the only thing you buy that makes you richer."</p>
            </div>
          </div>
        </div>

        <div className="order-1 md:order-2 space-y-8">
          <h2 className="reveal text-4xl md:text-6xl font-semibold text-foreground">Not just another <br />travel app.</h2>
          <div className="space-y-6 text-lg text-muted-foreground font-light leading-relaxed">
            <p className="reveal" data-reveal-delay="100">
              Vegaa AI started with a simple frustration: travel planning was broken. It was either too generic (dozens of "Top 10" lists) or too manual (spreadsheets and endless tabs).
            </p>
            <p className="reveal" data-reveal-delay="200">
              We asked ourselves: <span className="text-foreground font-medium">What if an itinerary could write itself?</span>
            </p>
            <p className="reveal" data-reveal-delay="300">
              Today, we're a team of engineers, designers, and wanderers dedicated to solving the "blank page" problem of travel. We're building the co-pilot we always wished we had.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Team Section (Cinematic) ---
const TeamMember = ({ name, role, image }) => (
  <div className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
    <SmartImage
      query={`portrait ${role} professional`}
      src={image}
      alt={name}
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale group-hover:grayscale-0"
      width={400}
      height={500}
    />
    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
      <h3 className="text-white text-xl font-medium">{name}</h3>
      <p className="text-white/70 text-sm font-light uppercase tracking-wider">{role}</p>
    </div>
  </div>
);

const Team = () => {
  const containerRef = useReveal();

  return (
    <section className="py-24 px-6 bg-black text-white" ref={containerRef}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 reveal">
          <h2 className="text-4xl md:text-6xl font-semibold">The Minds <br />Behind Vegaa</h2>
          <p className="text-white/60 max-w-sm text-lg font-light">
            A diverse group of thinkers and doers from across the globe.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="reveal" data-reveal-delay="0"><TeamMember name="Alex Chen" role="Founder & CEO" /></div>
          <div className="reveal" data-reveal-delay="100"><TeamMember name="Sarah Miller" role="Head of Design" /></div>
          <div className="reveal" data-reveal-delay="200"><TeamMember name="David Okonjo" role="Lead Engineer" /></div>
          <div className="reveal" data-reveal-delay="300"><TeamMember name="Maria Gonzales" role="AI Research" /></div>
        </div>
      </div>
    </section>
  );
};

// --- Footer CTA ---
const FooterCTA = () => {
  const containerRef = useReveal();

  return (
    <section className="py-32 px-6 flex flex-col items-center justify-center text-center space-y-8 bg-background" ref={containerRef}>
      <h2 className="reveal text-4xl md:text-7xl font-semibold text-foreground tracking-tight">
        Ready to go?
      </h2>
      <p className="reveal text-xl text-muted-foreground font-light max-w-xl" data-reveal-delay="100">
        Your next great adventure is just a click away. Let AI handle the details.
      </p>
      <div className="reveal" data-reveal-delay="200">
        <Button size="lg" className="rounded-full px-10 h-14 text-lg">
          Start Planning Now <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </section>
  );
};

const About = () => {
  return (
    <div className="bg-background min-h-screen">
      <Hero />
      <Story />
      <Values />
      <Team />
      <FooterCTA />
    </div>
  );
};

export default About;
