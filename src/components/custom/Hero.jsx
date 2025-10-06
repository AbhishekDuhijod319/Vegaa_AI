import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button"

const Hero = () => {
  return (
    <div className="flex flex-col items-center mt-10 md:mx-20 lg:mx-40 xl:mx-56 gap-6 rounded-xl py-12 border bg-card">
      <h1 className="text-4xl md:text-5xl font-semibold text-center leading-tight tracking-tight">
        Plan Smarter. Travel Better.
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground text-center max-w-3xl">
        AI-crafted itineraries, hotels and places tailored to your style and pace.
      </p>

      <div className="flex gap-3">
        <Link to="/create-trip">
          <Button className="h-11 px-6 text-base">Create your trip</Button>
        </Link>
        <Button variant="outline" asChild>
          <a href="#how1" className="h-11 px-6 text-base inline-flex items-center">Learn more</a>
        </Button>
      </div>
    </div>
  );
};

export default Hero;
