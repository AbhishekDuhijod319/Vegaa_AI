import React from "react";
import SmartImage from "@/components/ui/SmartImage";

const slides = [
  {
    image: null,
    title: "Paris, France",
    text: "Cafés, art, and illuminated nights along the Seine.",
  },
  {
    image: null,
    title: "Kyoto, Japan",
    text: "Timeless temples, bamboo forests, and tea traditions.",
  },
  {
    image: null,
    title: "Santorini, Greece",
    text: "Whitewashed villages overlooking azure seas.",
  },
];

const HomeCarousel = () => {
  const curr = slides[0]; // minimal: still showing first slide, but image is dynamic
  return (
    <section className="mt-16 md:px-32 lg:px-56 xl:px-72">
      <div className="rounded-xl overflow-hidden border bg-card">
        <div className="h-64 md:h-64">
          <SmartImage
            src={curr.image}
            query={curr.title}
            alt={curr.title}
            className="h-64 md:h-64 w-full object-cover"
          />
        </div>
        <div className="p-4 md:p-6 flex items-end justify-between">
          <div>
            <h3 className="text-xl md:text-2xl font-semibold">{curr.title}</h3>
            <p className="text-muted-foreground text-sm md:text-base">
              {curr.text}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeCarousel;