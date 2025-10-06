import React from 'react'

const About = () => {
  return (
    <section id="about" className="mt-24 px-5 md:px-32 lg:px-56 xl:px-72">
      <h2 className="text-3xl font-semibold mb-4">
        About Us
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border p-6 bg-card">
          <h3 className="font-medium mb-2">What we do</h3>
          <p className="text-muted-foreground leading-relaxed">
            We blend real-time data and AI to craft itineraries that match your pace, budget, and interests—down to weather-aware suggestions.
          </p>
        </div>
        <div className="rounded-xl border p-6 bg-card">
          <h3 className="font-medium mb-2">Why it matters</h3>
          <p className="text-muted-foreground leading-relaxed">
            No more tabs overload. Get a clear plan with hotels, places, and daily flow—all editable and shareable with friends.
          </p>
        </div>
      </div>
    </section>
  )
}

export default About


