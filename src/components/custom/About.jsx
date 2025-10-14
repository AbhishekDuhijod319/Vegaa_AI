import React from 'react'
import { Button } from '@/components/ui/button'

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
  crest: '/logo.svg',
}

const resources = [
  { label: 'Research Paper', href: '#', desc: 'Peer‑reviewed paper for MCA final year project' },
  { label: 'Thesis Document', href: '#', desc: 'Complete dissertation and methodology' },
  { label: 'Supporting Materials', href: '#', desc: 'Datasets, diagrams, appendices and references' },
]

const SectionHeader = ({ title, subtitle }) => (
  <div className="px-6 md:px-8 lg:px-16 py-8 sm:py-9 md:py-10 lg:py-12 mt-24 w-full">
    <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
    {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
  </div>
)

const About = () => {
  return (
    <>
      {/* Overview */}
      <section id="about" data-section className="scroll-mt-24 min-h-[100svh]">
        <div className="px-6 md:px-8 lg:px-16 py-8 sm:py-9 md:py-10 lg:py-12 mt-24 w-full">
          <h1 className="text-3xl md:text-4xl font-bold">About Us</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Vegaa AI blends real‑time data and AI to craft smart, editable itineraries that match your pace, budget, and interests—down to weather‑aware suggestions. The experience stays consistent across devices with a modern, accessible UI.
          </p>

          {/* Quick navigation within About page */}
          <nav className="mt-6 flex flex-wrap items-center gap-2" aria-label="About page sections">
            <a href="#students"><Button variant="outline" size="sm">Authors</Button></a>
            <a href="#guide"><Button variant="outline" size="sm">Project Guide</Button></a>
            <a href="#college"><Button variant="outline" size="sm">College & Credentials</Button></a>
            <a href="#resources"><Button variant="outline" size="sm">Resources & Copyright</Button></a>
          </nav>

          {/* Full-width content sections (no card surfaces) */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="p-2">
              <h3 className="font-medium mb-2">What we do</h3>
              <p className="text-muted-foreground leading-relaxed">
                We blend real‑time data and AI to craft itineraries tailored to your preferences, ensuring clarity with hotels, places, and daily flow—all editable and shareable.
              </p>
            </div>
            <div className="p-2">
              <h3 className="font-medium mb-2">Why it matters</h3>
              <p className="text-muted-foreground leading-relaxed">
                No more tab overload—just a focused plan with responsive design, accessible components, and smooth section‑by‑section scrolling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Authors / Students */}
      <section id="students" data-section className="scroll-mt-24 min-h-[100svh]">
        <SectionHeader
          title="Authors & Student Team"
          subtitle="Meet the MCA final year students behind Vegaa AI"
        />
        <div className="px-6 md:px-8 lg:px-16 mt-6 w-full">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {authors.map((m) => (
              <div key={m.name} className="p-5">
                <div className="flex items-center gap-4">
                  <img
                    src={m.image}
                    alt={m.name}
                    className="h-20 w-20 rounded-md object-cover border"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold leading-tight">{m.name}</h3>
                    <p className="text-sm text-muted-foreground">{m.program}</p>
                    <p className="text-sm text-muted-foreground">{m.college}</p>
                    <p className="text-xs text-muted-foreground">{m.university} • {m.year}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Guide */}
      <section id="guide" data-section className="scroll-mt-24 min-h-[100svh]">
        <SectionHeader
          title="Project Guide"
          subtitle="Guidance and mentorship for the MCA project"
        />
        <div className="px-6 md:px-8 lg:px-16 mt-6 w-full">
          <div className="p-5 flex items-center gap-4">
            <img
              src={guide.image}
              alt={guide.name}
              className="h-20 w-20 rounded-md object-cover border"
            />
            <div className="flex-1">
              <h3 className="font-semibold leading-tight">{guide.name}</h3>
              <p className="text-sm text-muted-foreground">{guide.title}</p>
              <p className="text-sm text-muted-foreground">{guide.department}</p>
              <p className="text-sm text-muted-foreground">{guide.college}</p>
            </div>
          </div>
        </div>
      </section>

      {/* College & Credentials */}
      <section id="college" data-section className="scroll-mt-24 min-h-[100svh]">
        <SectionHeader
          title="College Affiliation & Credentials"
          subtitle="Institutional details and academic accreditation"
        />
        <div className="px-6 md:px-8 lg:px-16 mt-6 w-full">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center gap-5 p-5">
              <img
                src={college.crest}
                alt={`${college.name} crest`}
                className="h-16 w-16 rounded-md object-contain border bg-muted"
              />
              <div>
                <h3 className="font-semibold leading-tight">{college.name}</h3>
                <p className="text-sm text-muted-foreground">{college.university}</p>
                <p className="text-sm text-muted-foreground">{college.affiliation}</p>
                <p className="text-sm text-muted-foreground">{college.accreditation}</p>
                <p className="text-xs text-muted-foreground">{college.location}</p>
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-medium mb-2">Academic Program</h3>
              <p className="text-muted-foreground leading-relaxed">
                This project is submitted in partial fulfillment of the requirements for the degree of Master of Computer Applications (MCA). It adheres to institutional research ethics and follows standard academic formatting and citation guidelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Resources & Copyright */}
      <section id="resources" data-section className="scroll-mt-24 min-h-[100svh]">
        <SectionHeader
          title="Resources & Copyright"
          subtitle="Direct links to project documents and materials"
        />
        <div className="px-6 md:px-8 lg:px-16 mt-6 w-full">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5">
              <h3 className="font-medium mb-2">Project Documents</h3>
              <div className="grid gap-2">
                {resources.map((r) => (
                  <a key={r.label} href={r.href} target="_blank" rel="noreferrer" className="block">
                    <Button variant="outline" className="w-full justify-start">{r.label}</Button>
                    <span className="text-xs text-muted-foreground block mt-1">{r.desc}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="p-5">
              <h3 className="font-medium mb-2">Copyright Notice</h3>
              <p className="text-muted-foreground leading-relaxed">
                © {new Date().getFullYear()} Vegaa AI — MCA Final Year Project. All rights reserved. The materials, documents, and research presented are intended solely for academic evaluation and learning purposes. Redistribution or commercial use requires prior written consent from the authors and supervising institution.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default About


