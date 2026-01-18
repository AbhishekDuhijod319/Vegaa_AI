import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MapPin, BookOpen, User, Users, Building2, FileText, ArrowUpRight } from 'lucide-react'

// --- Data Constants ---
const authors = [
  {
    name: 'Student Name 1',
    program: 'MCA (Master of Computer Applications)',
    college: 'Your College Name',
    university: 'Your University Name',
    year: 'Final Year',
    image: 'https://ui-avatars.com/api/?name=Student+One&background=0D8ABC&color=fff',
  },
  {
    name: 'Student Name 2',
    program: 'MCA (Master of Computer Applications)',
    college: 'Your College Name',
    university: 'Your University Name',
    year: 'Final Year',
    image: 'https://ui-avatars.com/api/?name=Student+Two&background=F97316&color=fff',
  },
  {
    name: 'Student Name 3',
    program: 'MCA (Master of Computer Applications)',
    college: 'Your College Name',
    university: 'Your University Name',
    year: 'Final Year',
    image: 'https://ui-avatars.com/api/?name=Student+Three&background=22C55E&color=fff',
  },
]

const guide = {
  name: 'Guide Name',
  title: 'Project Guide / Assistant Professor',
  department: 'Department of Computer Applications',
  college: 'Your College Name',
  image: 'https://ui-avatars.com/api/?name=Project+Guide&background=7F9CF5&color=fff',
}

const college = {
  name: 'Your College Name',
  university: 'Your University Name',
  affiliation: 'Affiliated to XYZ University',
  accreditation: 'AICTE approved • NAAC Accredited',
  location: 'City, State, Country',
  crest: '/logo.svg', // Using app logo as placeholder if crest unavailable
}

const resources = [
  { label: 'Research Paper', href: '#', desc: 'Peer‑reviewed paper for MCA final year project' },
  { label: 'Thesis Document', href: '#', desc: 'Complete dissertation and methodology' },
  { label: 'Supporting Materials', href: '#', desc: 'Datasets, diagrams, appendices and references' },
]

// --- iOS UI Components ---

const IOSCard = ({ children, className, hover = false }) => (
  <div className={cn(
    "relative overflow-hidden bg-white/70 dark:bg-black/40 backdrop-blur-xl",
    "border border-white/20 dark:border-white/10 shadow-ios-subtle rounded-[8px]",
    hover && "transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-ios cursor-pointer",
    className
  )}>
    {children}
  </div>
)

const SectionTitle = ({ children, subtitle }) => (
  <div className="mb-6 md:mb-8 animate-fade-in">
    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{children}</h2>
    {subtitle && (
      <p className="mt-2 text-[17px] leading-relaxed text-muted-foreground max-w-3xl">
        {subtitle}
      </p>
    )}
  </div>
)

// --- Main Component ---

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background font-ios text-foreground pb-24">
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-12 px-6 md:px-8 lg:px-12 max-w-screen-xl mx-auto">
        <div className="max-w-4xl space-y-6 animate-slide-in-from-bottom-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            About Us
          </h1>
          <p className="text-[19px] md:text-[21px] leading-relaxed text-muted-foreground font-medium">
            Vegaa AI blends real‑time data and AI to craft smart, editable itineraries that match your pace, budget, and interests—down to weather‑aware suggestions.
          </p>
          
          {/* Quick Navigation (Segmented Control Style) */}
          <nav className="flex flex-wrap gap-3 pt-4" aria-label="Quick navigation">
            {[
              { label: 'Authors', href: '#students', icon: Users },
              { label: 'Guide', href: '#guide', icon: User },
              { label: 'College', href: '#college', icon: Building2 },
              { label: 'Resources', href: '#resources', icon: FileText },
            ].map((item) => (
              <a key={item.href} href={item.href} className="no-underline">
                <Button 
                  variant="secondary" 
                  className="rounded-[8px] h-11 px-5 bg-secondary/50 backdrop-blur-md hover:bg-secondary/80 shadow-sm border border-transparent hover:border-black/5 transition-all duration-300"
                >
                  <item.icon className="w-4 h-4 mr-2 opacity-70" />
                  {item.label}
                </Button>
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="px-6 md:px-8 lg:px-12 max-w-screen-xl mx-auto grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* Intro Cards */}
        <div className="col-span-4 md:col-span-4 lg:col-span-6">
          <IOSCard className="h-full p-6 md:p-8 flex flex-col justify-center">
            <h3 className="text-xl font-semibold mb-3">What we do</h3>
            <p className="text-[17px] leading-relaxed text-muted-foreground">
              We blend real‑time data and AI to craft itineraries tailored to your preferences, ensuring clarity with hotels, places, and daily flow—all editable and shareable.
            </p>
          </IOSCard>
        </div>
        <div className="col-span-4 md:col-span-4 lg:col-span-6">
          <IOSCard className="h-full p-6 md:p-8 flex flex-col justify-center">
            <h3 className="text-xl font-semibold mb-3">Why it matters</h3>
            <p className="text-[17px] leading-relaxed text-muted-foreground">
              No more tab overload—just a focused plan with responsive design, accessible components, and smooth section‑by‑section scrolling.
            </p>
          </IOSCard>
        </div>

        {/* Authors Section */}
        <div id="students" className="col-span-4 md:col-span-8 lg:col-span-12 scroll-mt-32 pt-12">
          <SectionTitle subtitle="Meet the MCA final year students behind Vegaa AI">
            Authors & Student Team
          </SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {authors.map((student) => (
              <IOSCard key={student.name} hover className="p-5 flex items-start gap-4 group">
                <img 
                  src={student.image} 
                  alt={student.name}
                  className="w-16 h-16 rounded-[8px] object-cover shadow-sm bg-muted"
                  loading="lazy"
                />
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                    {student.name}
                  </h3>
                  <p className="text-[15px] text-muted-foreground font-medium">{student.program}</p>
                  <p className="text-[13px] text-muted-foreground/80">{student.college}</p>
                  <div className="pt-2 flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-secondary text-[11px] font-medium text-secondary-foreground uppercase tracking-wide">
                      {student.year}
                    </span>
                  </div>
                </div>
              </IOSCard>
            ))}
          </div>
        </div>

        {/* Guide Section */}
        <div id="guide" className="col-span-4 md:col-span-8 lg:col-span-12 scroll-mt-32 pt-12">
          <SectionTitle subtitle="Guidance and mentorship for the MCA project">
            Project Guide
          </SectionTitle>
          <IOSCard className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
              <img 
                src={guide.image} 
                alt={guide.name}
                className="w-24 h-24 rounded-[12px] object-cover shadow-md bg-muted"
              />
              <div className="space-y-2 max-w-2xl">
                <h3 className="text-2xl font-bold">{guide.name}</h3>
                <p className="text-[17px] text-primary font-medium">{guide.title}</p>
                <p className="text-muted-foreground">{guide.department}</p>
                <p className="text-muted-foreground">{guide.college}</p>
              </div>
            </div>
          </IOSCard>
        </div>

        {/* College Section */}
        <div id="college" className="col-span-4 md:col-span-8 lg:col-span-12 scroll-mt-32 pt-12">
          <SectionTitle subtitle="Institutional details and academic accreditation">
            College & Credentials
          </SectionTitle>
          <div className="grid md:grid-cols-12 gap-6">
            <IOSCard className="md:col-span-7 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
              <div className="w-20 h-20 shrink-0 bg-white rounded-[12px] shadow-sm flex items-center justify-center p-2 border border-black/5">
                 <img src={college.crest} alt="Crest" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">{college.name}</h3>
                <p className="text-[15px] font-medium text-muted-foreground">{college.university}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded-[4px] bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-semibold border border-green-500/20">
                    {college.accreditation}
                  </span>
                  <span className="px-2.5 py-1 rounded-[4px] bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-semibold border border-blue-500/20">
                    {college.affiliation}
                  </span>
                </div>
                <div className="pt-2 flex items-center justify-center md:justify-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {college.location}
                </div>
              </div>
            </IOSCard>
            
            <IOSCard className="md:col-span-5 p-6 md:p-8 bg-gradient-to-br from-primary/5 to-transparent">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Academic Program
              </h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                This project is submitted in partial fulfillment of the requirements for the degree of <strong>Master of Computer Applications (MCA)</strong>. It adheres to institutional research ethics and follows standard academic formatting.
              </p>
            </IOSCard>
          </div>
        </div>

        {/* Resources Section */}
        <div id="resources" className="col-span-4 md:col-span-8 lg:col-span-12 scroll-mt-32 pt-12">
          <SectionTitle subtitle="Direct links to project documents and materials">
            Resources & Copyright
          </SectionTitle>
          <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-4">
               {resources.map((r) => (
                 <a key={r.label} href={r.href} target="_blank" rel="noreferrer" className="block group no-underline">
                   <IOSCard hover className="p-4 flex items-center justify-between group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors">
                     <div>
                       <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{r.label}</h4>
                       <p className="text-[13px] text-muted-foreground mt-0.5">{r.desc}</p>
                     </div>
                     <Button size="icon" variant="ghost" className="rounded-[4px] opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="w-5 h-5" />
                     </Button>
                   </IOSCard>
                 </a>
               ))}
             </div>
             <IOSCard className="p-6 md:p-8 flex flex-col justify-between bg-muted/30">
                <div>
                  <h3 className="font-semibold mb-3">Copyright Notice</h3>
                  <p className="text-[14px] leading-relaxed text-muted-foreground">
                    © {new Date().getFullYear()} Vegaa AI — MCA Final Year Project. All rights reserved. The materials, documents, and research presented are intended solely for academic evaluation and learning purposes. Redistribution or commercial use requires prior written consent.
                  </p>
                </div>
                <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5 flex items-center gap-4 text-xs text-muted-foreground">
                   <span>Privacy Policy</span>
                   <span>Terms of Service</span>
                   <span className="ml-auto">v1.0.0</span>
                </div>
             </IOSCard>
          </div>
        </div>

      </div>
    </div>
  )
}

export default About
