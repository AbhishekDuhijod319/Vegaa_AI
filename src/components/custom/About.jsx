import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Globe, Heart, Shield, Sparkles, Map, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import SmartImage from '@/components/ui/SmartImage';

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
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="inline-block py-1 px-3 rounded-full border border-white/30 bg-white/10 text-white/90 text-sm font-medium tracking-wide mb-6 backdrop-blur-md">
            EST. 2025
          </span>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-medium text-white tracking-tight leading-none mix-blend-overlay">
            Reimagining <br /> <span className="italic font-light">Travel</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-2xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed"
        >
          We believe the journey should be as beautiful as the destination.
          Vegaa AI fuses human curiosity with machine precision to craft the perfect itinerary.
        </motion.p>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50"
      >
        <span className="text-xs tracking-[0.2em] uppercase">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent" />
      </motion.div>
    </section>
  );
};

// --- Values Components (Bento Grid) ---
const ValueCard = ({ icon: Icon, title, desc, className, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={cn(
      "group relative p-8 rounded-3xl bg-white/50 dark:bg-black/50 border border-black/5 dark:border-white/10 backdrop-blur-xl overflow-hidden hover:bg-white/80 dark:hover:bg-black/80 transition-all duration-500",
      className
    )}
  >
    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110 group-hover:-rotate-12">
      <Icon size={120} />
    </div>
    <div className="relative z-10 h-full flex flex-col justify-between">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
        <Icon size={24} />
      </div>
      <div>
        <h3 className="text-2xl font-serif font-medium mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  </motion.div>
);

const Values = () => {
  return (
    <section className="py-24 md:py-32 px-6 bg-secondary/5">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 max-w-3xl">
          <h2 className="text-4xl md:text-6xl font-serif font-medium mb-6 text-foreground">Our Core Values</h2>
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

// --- Story Section (Sticky/Parallax) ---
const Story = () => {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden order-2 md:order-1">
          <SmartImage
            query="team collaboration startup office modern"
            alt="Our Team Planning"
            className="w-full h-full object-cover"
            width={800}
            height={1000}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
            <div className="text-white">
              <p className="font-serif italic text-2xl">"Travel is the only thing you buy that makes you richer."</p>
            </div>
          </div>
        </div>

        <div className="order-1 md:order-2 space-y-8">
          <h2 className="text-4xl md:text-6xl font-serif font-medium text-foreground">Not just another <br /> travel app.</h2>
          <div className="space-y-6 text-lg text-muted-foreground font-light leading-relaxed">
            <p>
              Vegaa AI started with a simple frustration: travel planning was broken. It was either too generic (dozens of "Top 10" lists) or too manual (spreadsheets and endless tabs).
            </p>
            <p>
              We asked ourselves: <span className="text-foreground font-medium">What if an itinerary could write itself?</span>
            </p>
            <p>
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
      query={`portrait ${role} professional`} // Using generic query fallback if image not provided
      src={image} // If user provides specific images later
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
  return (
    <section className="py-24 px-6 bg-black text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <h2 className="text-4xl md:text-6xl font-serif font-medium">The Minds <br /> Behind Vegaa</h2>
          <p className="text-white/60 max-w-sm text-lg font-light">
            A diverse group of thinkers and doers from across the globe.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TeamMember name="Alex Chen" role="Founder & CEO" />
          <TeamMember name="Sarah Miller" role="Head of Design" />
          <TeamMember name="David Okonjo" role="Lead Engineer" />
          <TeamMember name="Maria Gonzales" role="AI Research" />
        </div>
      </div>
    </section>
  );
};

// --- Footer CTA ---
const FooterCTA = () => (
  <section className="py-32 px-6 flex flex-col items-center justify-center text-center space-y-8 bg-background">
    <h2 className="text-4xl md:text-7xl font-serif font-medium text-foreground tracking-tight">
      Ready to go?
    </h2>
    <p className="text-xl text-muted-foreground font-light max-w-xl">
      Your next great adventure is just a click away. Let AI handle the details.
    </p>
    <Button size="lg" className="rounded-full px-10 h-14 text-lg">
      Start Planning Now <ArrowRight className="ml-2 w-5 h-5" />
    </Button>
  </section>
);

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
