import React, { useRef } from 'react';
import { ArrowRight, Globe, Heart, Shield, Sparkles, Github, Linkedin, Code2, Server, Database, Cloud, Cpu, Layers, Mail, GraduationCap, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useReveal } from '@/lib/useReveal';
import { useNavigate } from 'react-router-dom';
import SmartImage from '@/components/ui/SmartImage';

// ─── Owner Info ───────────────────────────────────────────────────────────────
const OWNER = {
  name: 'Abhishek R. Duhijod',
  title: 'MCA Final Year Student · 2024–2026',
  college: 'JD College of Engineering & Management, Nagpur',
  batch: '2026',
  email: 'abhishekduhijod319@gmail.com',
  github: 'https://github.com/AbhishekDuhijod319',
  linkedin: 'https://www.linkedin.com/in/abhishek-duhijod',
  bio: 'A passionate Front-end developer and travel enthusiast who built Vegaa AI as a final-year MCA project to solve the real-world problem of AI-powered, personalized travel planning. Combining cutting-edge machine learning with a love for exploration, this platform turns complex travel decisions into effortless experiences.',
  // Cloudinary authenticated photo — secured & cannot be downloaded directly
  photo: 'https://res.cloudinary.com/dphatyl6s/image/authenticated/s--xRnHbiWP--/v1776615036/vegaa/admin/abhishek_duhijod_profile.jpg',
  guide: 'Prof. Rohan B. Kokate',
  coordinator: 'Mr. Rahul Ingle',
  projectName: 'AI-Powered Personalized Smart Travel Planner',
};

const TECH_STACK = [
  { icon: Code2, label: 'React 19', desc: 'Frontend UI framework' },
  { icon: Layers, label: 'Vite + CSS', desc: 'Build tool & styling' },
  { icon: Server, label: 'Node.js', desc: 'Backend runtime' },
  { icon: Database, label: 'MongoDB', desc: 'NoSQL database' },
  { icon: Cpu, label: 'Google Gemini', desc: 'AI itinerary engine' },
  { icon: Cloud, label: 'Vercel + Render', desc: 'Cloud deployment' },
];

// ─── Hero ─────────────────────────────────────────────────────────────────────
const Hero = () => (
  <section className="relative h-[100svh] w-full overflow-hidden flex items-center justify-center">
    <div className="absolute inset-0 z-0">
      <SmartImage
        query="abstract landscape travel cinematic mountain aerial"
        alt="Cinematic Travel Background"
        className="w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/60" />
    </div>

    <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto space-y-4 sm:space-y-6 pt-[var(--app-header-offset)]">
      <div className="anim-fade-in-up">
        <span className="inline-block py-1 px-3 sm:py-1.5 sm:px-4 rounded-full glass-dark text-white/90 text-xs sm:text-sm font-medium tracking-wide mb-4 sm:mb-6">
          MCA Final Year Project · {OWNER.batch}
        </span>
        <h1 className="text-fluid-hero font-bold text-white tracking-tight leading-none">
          Reimagining<br />
          <span className="italic font-light text-white/90">Travel</span>
        </h1>
      </div>

      <p className="anim-fade-in-up anim-delay-2 text-fluid-lg text-white/75 max-w-xl mx-auto font-light leading-relaxed">
        An AI-powered itinerary platform that turns your travel ideas into
        precise, personalized plans — in seconds.
      </p>
    </div>

    {/* Scroll indicator */}
    <div className="anim-fade-in anim-delay-5 absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
      <span className="text-[10px] tracking-[0.25em] uppercase font-medium">Scroll</span>
      <div
        className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent"
        style={{ animation: 'gentlePulse 2s ease-in-out infinite' }}
      />
    </div>
  </section>
);

// ─── Mission ──────────────────────────────────────────────────────────────────
const Mission = () => {
  const ref = useReveal();
  return (
    <section className="py-[--section-py] px-4 sm:px-6 bg-background" ref={ref}>
      <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
        <p className="reveal text-xs sm:text-sm font-semibold tracking-widest uppercase text-primary">The Mission</p>
        <h2 className="reveal text-fluid-h1 text-foreground tracking-tight leading-tight" data-reveal-delay="100">
          Travel planning was broken.<br />
          <span className="text-primary">We fixed it.</span>
        </h2>
        <p className="reveal text-fluid-body text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed" data-reveal-delay="200">
          Vegaa AI started from one frustration: travel planning was either too
          generic (endless "Top 10" lists) or too manual (spreadsheets and open
          tabs). This project set out to build the AI co-pilot every traveler
          deserved.
        </p>
      </div>
    </section>
  );
};

// ─── Values (Bento Grid) ─────────────────────────────────────────────────────
const values = [
  {
    icon: Sparkles,
    title: 'AI Precision',
    desc: "Algorithms that understand nuance. We don\u2019t just find places; we find feelings, atmospheres, and moments tailored to you.",
    span: 'md:col-span-2',
    delay: 0,
  },
  {
    icon: Heart,
    title: 'Human Touch',
    desc: "Technology serving humanity. Every recommendation fosters genuine connection and cultural appreciation.",
    span: '',
    delay: 0.1,
  },
  {
    icon: Shield,
    title: 'Privacy First',
    desc: "Your journey is yours alone. Your data is protected with the same rigor applied to the code.",
    span: '',
    delay: 0.2,
  },
  {
    icon: Globe,
    title: 'Global Lens',
    desc: "Respecting local cultures and sustainable tourism in every itinerary generated.",
    span: 'md:col-span-2',
    delay: 0.3,
  },
];

const ValueCard = ({ icon: Icon, title, desc, className, delay }) => (
  <div
    className={cn(
      'reveal group relative p-5 sm:p-6 md:p-8 rounded-3xl glass-card overflow-hidden',
      'transition-all duration-500 min-h-[220px] sm:min-h-[280px]',
      className
    )}
    data-reveal-delay={delay * 1000}
  >
    {/* Background icon watermark */}
    <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110 group-hover:-rotate-12">
      <Icon size={80} className="sm:hidden" />
      <Icon size={110} className="hidden sm:block" />
    </div>
    <div className="relative z-10 h-full flex flex-col justify-between">
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 sm:mb-6">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="text-fluid-h3 mb-2 sm:mb-3 text-foreground">{title}</h3>
        <p className="text-fluid-body text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  </div>
);

const Values = () => {
  const ref = useReveal();
  return (
    <section className="py-[--section-py] px-4 sm:px-6 bg-secondary/30" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 sm:mb-16 max-w-2xl reveal">
          <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-primary mb-3">Core Values</p>
          <h2 className="text-fluid-h1 text-foreground">Built on principles,<br />not just features.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {values.map((v) => (
            <ValueCard key={v.title} {...v} className={v.span} />
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── The Creator ─────────────────────────────────────────────────────────────
const Creator = () => {
  const ref = useReveal();
  return (
    <section className="py-24 md:py-32 px-6 bg-background" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 text-center reveal">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-3">The Creator</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">The Mind Behind Vegaa</h2>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Portrait */}
          <div className="reveal flex-shrink-0 mx-auto lg:mx-0">
            <div className="relative w-44 h-44 sm:w-60 sm:h-60 lg:w-80 lg:h-80">
              {/* Glow ring */}
              <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent blur-xl" />
              <div className="relative w-full h-full rounded-full overflow-hidden ring-4 ring-border shadow-2xl">
                <img
                  src={OWNER.photo}
                  alt={OWNER.name}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    // Fallback to initials avatar if Cloudinary secured URL fails locally
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(OWNER.name)}&background=6366f1&color=fff&size=400&bold=true`;
                  }}
                />
              </div>
              {/* Badge */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 glass-card rounded-full px-3 py-1.5 sm:px-4 sm:py-2 whitespace-nowrap shadow-lg">
                <span className="text-xs font-semibold text-foreground">MCA · {OWNER.batch}</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="reveal flex-1 text-center lg:text-left space-y-4 sm:space-y-6" data-reveal-delay="150">
            <div>
              <h3 className="text-fluid-h2 text-foreground">{OWNER.name}</h3>
              <p className="text-primary font-medium mt-1 text-fluid-sm sm:text-fluid-base">{OWNER.title}</p>
            </div>

            <p className="text-fluid-body text-muted-foreground leading-relaxed max-w-xl lg:max-w-none">
              {OWNER.bio}
            </p>

            {/* Academic Info */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <GraduationCap size={15} className="text-primary shrink-0" />
                <span>{OWNER.college}</span>
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <BookOpen size={15} className="text-primary shrink-0" />
                <span>Project Guide: <strong className="text-foreground">{OWNER.guide}</strong></span>
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <BookOpen size={15} className="text-primary shrink-0" />
                <span>Project Coordinator: <strong className="text-foreground">{OWNER.coordinator}</strong></span>
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <Mail size={15} className="text-primary shrink-0" />
                <a href={`mailto:${OWNER.email}`} className="hover:text-primary transition-colors">{OWNER.email}</a>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-2">
              {[
                { label: 'Final Year Project', value: '2026' },
                { label: 'Technologies Used', value: '6+' },
                { label: 'Features Built', value: '15+' },
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-2xl px-5 py-3 text-center min-w-[100px]">
                  <p className="text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Social links */}
            <div className="flex gap-3 justify-center lg:justify-start pt-2 flex-wrap">
              <a
                href={OWNER.github}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card rounded-full px-5 py-2.5 flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <Github size={16} /> GitHub
              </a>
              <a
                href={OWNER.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card rounded-full px-5 py-2.5 flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <Linkedin size={16} /> LinkedIn
              </a>
              <a
                href={`mailto:${OWNER.email}`}
                className="glass-card rounded-full px-5 py-2.5 flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <Mail size={16} /> Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Tech Stack ───────────────────────────────────────────────────────────────
const TechStack = () => {
  const ref = useReveal();
  return (
    <section className="py-24 md:py-32 px-6 bg-secondary/20" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 text-center reveal">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-3">Tech Stack</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">Built with modern tools</h2>
          <p className="text-muted-foreground mt-4 text-lg max-w-xl mx-auto">
            Every layer of Vegaa AI is powered by industry-standard, production-ready technologies.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {TECH_STACK.map((tech, i) => (
            <div
              key={tech.label}
              className="reveal glass-card rounded-2xl p-3 sm:p-5 flex flex-col items-center gap-2 sm:gap-3 text-center group cursor-default"
              data-reveal-delay={i * 80}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <tech.icon size={20} />
              </div>
              <div>
                <p className="font-semibold text-foreground text-xs sm:text-sm">{tech.label}</p>
                <p className="text-muted-foreground text-[10px] sm:text-xs mt-0.5">{tech.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Project Info Banner ──────────────────────────────────────────────────────
const ProjectInfo = () => {
  const ref = useReveal();
  return (
    <section className="py-20 px-6 bg-primary/5 border-y border-primary/10" ref={ref}>
      <div className="max-w-4xl mx-auto text-center space-y-4">
        <p className="reveal text-sm font-semibold tracking-widest uppercase text-primary mb-2">Project Details</p>
        <h2 className="reveal text-2xl md:text-3xl font-bold text-foreground leading-snug" data-reveal-delay="100">
          {OWNER.projectName}
        </h2>
        <p className="reveal text-muted-foreground text-base leading-relaxed max-w-2xl mx-auto" data-reveal-delay="150">
          An Adaptive Itinerary Optimization System with Real-Time Adaptability, Budget Efficiency, and AI Chatbot Assistant
        </p>
        <div className="reveal flex flex-wrap gap-3 justify-center pt-4" data-reveal-delay="200">
          {[
            { label: 'Institution', value: 'JD College of Engg. & Mgmt., Nagpur' },
            { label: 'Guide', value: OWNER.guide },
            { label: 'Coordinator', value: OWNER.coordinator },
            { label: 'Year', value: '2025–2026' },
          ].map(item => (
            <div key={item.label} className="glass-card rounded-xl px-4 py-3 text-sm text-center min-w-[160px]">
              <p className="text-muted-foreground text-xs mb-1">{item.label}</p>
              <p className="font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Footer CTA ──────────────────────────────────────────────────────────────
const FooterCTA = () => {
  const ref = useReveal();
  const navigate = useNavigate();
  return (
    <section
      className="relative py-32 px-6 flex flex-col items-center justify-center text-center space-y-8 overflow-hidden bg-background"
      ref={ref}
    >
      {/* Decorative glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full bg-primary/6 blur-[100px]" />
      </div>

      <h2 className="reveal relative text-fluid-h1 text-foreground tracking-tight">
        Ready to explore?
      </h2>
      <p className="reveal relative text-fluid-lg text-muted-foreground font-light max-w-md" data-reveal-delay="100">
        Your next adventure is a click away. Let AI craft the perfect itinerary.
      </p>
      <div className="reveal relative" data-reveal-delay="200">
        <Button
          size="lg"
          className="rounded-full px-10 h-13 text-base font-semibold shadow-lg hover:scale-105 transition-transform"
          onClick={() => navigate('/create-trip')}
        >
          Start Planning Free <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </section>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
const About = () => (
  <div className="bg-background min-h-screen">
    <Hero />
    <Mission />
    <Values />
    <Creator />
    <ProjectInfo />
    <TechStack />
    <FooterCTA />
  </div>
);

export default About;
