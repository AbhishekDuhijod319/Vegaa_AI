import React from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { ArrowRight, Linkedin, Twitter, Youtube, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"

const Footer = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const year = new Date().getFullYear()

  const socialLinks = [
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Twitter, href: "#", label: "X (Twitter)" },
    { icon: Youtube, href: "#", label: "YouTube" },
    { icon: Instagram, href: "#", label: "Instagram" },
  ]

  const footerLinks = {
    Product: [
      { label: "Plan a Trip", path: "/create-trip" },
      { label: "My Trips", path: "/my-trips" },
      { label: "AI Assistant", path: "#" },
      { label: "Destinations", path: "#destinations" },
    ],
    Resources: [
      { label: "Travel Blog", path: "#" },
      { label: "Community", path: "#" },
      { label: "Help Center", path: "#" },
      { label: "Safety Guidelines", path: "#" },
    ],
    Company: [
      { label: "About Us", path: "/about" },
      { label: "Careers", path: "#" },
      { label: "Press", path: "#" },
      { label: "Contact", path: "#" },
    ],
  }

  return (
    <footer className={`bg-[#050505] text-white pt-24 pb-8 overflow-hidden relative font-sans mt-auto ${isHome ? 'snap-start snap-always min-h-[100svh] flex flex-col justify-between' : ''}`}>
      <div className={`max-w-[1400px] mx-auto px-6 md:px-12 relative z-10 ${isHome ? 'flex-1 flex flex-col justify-center' : ''}`}>
        
        {/* Top Section: Description & Links */}
        <div className="flex flex-col lg:flex-row justify-between gap-16 lg:gap-24 mb-20">
          
          {/* Left: Description */}
          <div className="max-w-md space-y-6">
            <div className="flex items-center gap-2">
               <img src="/logo.svg" alt="Vegaa AI" className="h-8 w-8" />
               <span className="text-xl font-bold tracking-tight">Vegaa AI</span>
            </div>
            <p className="text-lg text-gray-400 leading-relaxed font-light">
              Vegaa AI is the most complete AI suite for modern travelers, trusted by explorers worldwide to craft personalized, unforgettable journeys.
            </p>
          </div>

          {/* Right: Link Columns */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="space-y-6">
                <h4 className="text-base font-semibold text-white tracking-wide">{category}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      {link.path.startsWith("#") ? (
                        <a 
                          href={link.path} 
                          className="text-gray-400 hover:text-white transition-colors text-[15px] font-medium"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link 
                          to={link.path} 
                          className="text-gray-400 hover:text-white transition-colors text-[15px] font-medium"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Section: Newsletter & Socials */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-24 border-t border-white/5 pt-12">
          <div className="space-y-2 max-w-lg">
             <h3 className="text-xl md:text-2xl font-semibold text-white">Get the latest updates from Vegaa AI</h3>
             <p className="text-gray-500 text-sm">Join our newsletter for travel tips and AI features.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {/* Input Group */}
            <div className="group flex items-center bg-[#151515] rounded-full p-1.5 pl-5 border border-white/10 focus-within:border-white/20 transition-all w-full sm:w-[380px]">
              <input 
                type="email" 
                placeholder="Email address" 
                className="bg-transparent border-none focus:ring-0 text-sm w-full text-white placeholder:text-gray-500 outline-none" 
              />
              <Button 
                size="sm"
                className="rounded-full bg-white text-black hover:bg-gray-200 transition-colors px-4 h-9 font-medium flex items-center gap-2"
              >
                Subscribe <ArrowRight size={14} />
              </Button>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3 mt-4 sm:mt-0">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="bg-white/10 hover:bg-white text-white hover:text-black p-2.5 rounded-full transition-all duration-300"
                >
                  <social.icon size={18} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section: Branding & Copyright */}
        <div className="relative pt-12 pb-6">
           {/* Large Background Text */}
           <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full overflow-hidden flex justify-center opacity-[0.03] pointer-events-none select-none">
              <span className="text-[20vw] font-bold leading-none whitespace-nowrap tracking-tighter">
                VEGAA AI
              </span>
           </div>

           {/* Central Logo/Graphic (Optional, matching the diamond in reference) */}
           <div className="flex justify-center mb-16 relative z-10">
              <div className="relative group">
                 <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                 <img src="/logo.svg" alt="Vegaa AI Logo" className="h-24 w-24 relative z-10 drop-shadow-2xl grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500" />
              </div>
           </div>

           {/* Footer Bottom Bar */}
           <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-500 font-medium border-t border-white/5 pt-8">
              <p>© {year} Vegaa AI. All rights reserved.</p>
              <div className="flex flex-wrap justify-center gap-8">
                 <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                 <a href="#" className="hover:text-white transition-colors">Refund Policy</a>
                 <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              </div>
           </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer
