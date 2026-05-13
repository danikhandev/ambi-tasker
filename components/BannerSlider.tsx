"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { unbounded } from '@/app/fonts';

export function BannerSlider() {
  const [banners, setBanners] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBanners() {
      try {
        const res = await fetch('/api/posters');
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setBanners(json.data);
        } else {
          // Fallback if no banners in DB
          setBanners([
            {
              id: "fallback-1",
              title: "Expert Electricians",
              subtitle: "Safe & reliable electrical solutions for your home",
              imageUrl: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=1200&h=400&fit=crop",
              color: "from-blue-600/80 to-blue-900/80",
              link: "/search?category=electrician-services",
              buttonText: "Book Now"
            }
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch banners", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const next = () => setCurrent((prev) => (prev + 1) % banners.length);
  const prev = () => setCurrent((prev) => (prev - 1 + banners.length) % banners.length);

  const handleDragEnd = (e: any, { offset, velocity }: import('framer-motion').PanInfo) => {
    const swipe = offset.x;
    if (swipe < -50) {
      next();
    } else if (swipe > 50) {
      prev();
    }
  };

  if (loading) {
    return <div className="w-full h-[250px] md:h-[400px] bg-muted/20 animate-pulse rounded-[2rem] md:rounded-[3rem]" />;
  }

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full h-[250px] md:h-[400px] rounded-[2rem] md:rounded-[3rem] overflow-hidden group shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.5}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          <Image
            src={banners[current].imageUrl}
            alt={banners[current].title}
            fill
            className="object-cover"
            priority
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${banners[current].color} flex flex-col justify-center px-8 md:px-20 text-white`}>
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`${unbounded.className} text-[32px] md:text-[48px] font-black mb-4 max-w-xl leading-tight tracking-tight`}
            >
              {banners[current].title}
            </motion.h2>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[14px] md:text-[18px] opacity-90 max-w-md font-medium mb-10 leading-relaxed"
            >
              {banners[current].subtitle}
            </motion.p>
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={() => window.location.href = banners[current].link}
              className="btn-primary !bg-white !text-primary hover:!bg-primary/5 shadow-2xl !min-w-[200px]"
            >
              {banners[current].buttonText || "Book Now"}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      {banners.length > 1 && (
        <>
          <button 
            onClick={prev}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={next}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Pagination */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${i === current ? "w-8 bg-white" : "w-1.5 bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
