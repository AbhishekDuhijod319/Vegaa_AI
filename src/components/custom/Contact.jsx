import React from 'react'

const Contact = () => {
  return (
    <section id="contact" className="mt-16 px-5 md:px-32 lg:px-56 xl:px-72">
      <h2 className="text-3xl font-semibold mb-4">Contact</h2>
      <form onSubmit={(e)=>e.preventDefault()} className="rounded-xl border p-6 bg-card grid gap-4">
        <div className="grid md:grid-cols-2 gap-4">
          <input className="h-10 rounded-md border border-input px-3 outline-none focus-visible:border-ring bg-background/90 backdrop-blur-md" placeholder="Full name" required />
          <input className="h-10 rounded-md border border-input px-3 outline-none focus-visible:border-ring bg-background/90 backdrop-blur-md" type="email" placeholder="Email" required />
        </div>
        <input className="h-10 rounded-md border border-input px-3 outline-none focus-visible:border-ring bg-background/90 backdrop-blur-md" placeholder="Subject" />
        <textarea className="min-h-28 rounded-md border border-input p-3 outline-none focus-visible:border-ring bg-background/90 backdrop-blur-md" placeholder="Complaint or suggestion..." />
        <div className="flex justify-end">
          <button className="h-10 px-5 rounded-md bg-primary text-primary-foreground">Submit</button>
        </div>
      </form>
    </section>
  )
}

export default Contact


