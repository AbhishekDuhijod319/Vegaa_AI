import React from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { ArrowRight, Linkedin, Twitter, Youtube, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"

const Footer = () => {
  const navigate = useNavigate()
  const location = useLocation()
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
    <footer className="bg-[#0a0a0a] text-white pt-20 md:pt-24 pb-6 overflow-hidden relative font-sans mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10 w-full">

        {/* Top Section: Description & Links */}
        <div className="flex flex-col lg:flex-row justify-between gap-10 lg:gap-16 mb-12 md:mb-16">

          {/* Left: Description */}
          <div className="max-w-md space-y-5">
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Vegaa AI" className="h-7 w-7 md:h-9 md:w-9" />
              <span className="text-xl md:text-2xl font-bold tracking-tight">Vegaa AI</span>
            </div>
            <p className="text-[15px] md:text-base text-gray-400 leading-relaxed font-light">
              Vegaa AI is the most complete AI suite for modern travelers, trusted by explorers worldwide to craft personalized, unforgettable journeys.
            </p>
          </div>

          {/* Right: Link Columns */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="space-y-5">
                <h4 className="text-sm font-semibold text-white/80 tracking-widest uppercase">{category}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      {link.path.startsWith("#") ? (
                        <a
                          href={link.path}
                          className="text-gray-500 hover:text-white transition-colors text-[15px] font-medium"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.path}
                          className="text-gray-500 hover:text-white transition-colors text-[15px] font-medium"
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

        {/* Newsletter & Socials */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 md:mb-16 border-t border-white/[0.06] pt-8 md:pt-10">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-lg md:text-xl font-semibold text-white">Get the latest updates</h3>
            <p className="text-gray-500 text-xs md:text-sm">Join our newsletter for travel tips and AI features.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {/* Input Group */}
            <div className="group flex items-center bg-white/[0.04] rounded-full p-1.5 pl-5 border border-white/[0.08] focus-within:border-white/20 transition-all w-full sm:w-[380px]">
              <input
                type="email"
                placeholder="Email address"
                className="bg-transparent border-none focus:ring-0 text-sm w-full text-white placeholder:text-gray-600 outline-none"
              />
              <Button
                size="sm"
                className="rounded-full bg-white text-black hover:bg-gray-200 transition-colors px-5 h-9 font-medium flex items-center gap-2"
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
                  className="bg-white/[0.06] hover:bg-white text-gray-500 hover:text-black p-2.5 rounded-full transition-all duration-300"
                >
                  <social.icon size={18} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.06] pt-6 pb-2">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600 font-medium">
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
