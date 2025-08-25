'use client'

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import HomeCard from './components/HomeCard';
import DiscordButton from './components/DiscordButton';

export default function Home() {
  const bgRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  const [expanded, setExpanded] = useState(false);

  // Background motion
  useEffect(() => {
    const handleMouseMove = ({ clientX, clientY }: MouseEvent) => {
      const x = (clientX - window.innerWidth / 2) / 40;
      const y = (clientY - window.innerHeight / 2) / 40;
      target.current = { x, y };
    }

    const animate = () => {
      const lerp = 0.03;
      current.current.x += (target.current.x - current.current.x) * lerp;
      current.current.y += (target.current.y - current.current.y) * lerp;

      if (bgRef.current) {
        bgRef.current.style.transform = `scale(1.1) translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
      }

      requestAnimationFrame(animate);
    }

    window.addEventListener('mousemove', handleMouseMove);
    requestAnimationFrame(animate);

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setExpanded((prev) => !prev)
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        ref={bgRef}
        className="absolute inset-0 z-0 bg-center bg-cover bg-no-repeat will-change-transform"
        style={{ backgroundImage: "url('/rok_night.png')" }}
      >
        <div className="absolute inset-0 backdrop-brightness-40" />
      </div>

      <Image
        src="/left-corner.png"
        alt="Left corner character"
        width={600}
        height={600}
        className="absolute bottom-0 left-0 z-20 pointer-events-none"
      />
      <Image
        src="/right-corner.png"
        alt="Right corner character"
        width={600}
        height={600}
        className="absolute bottom-0 right-0 z-20 pointer-events-none"
      />

      <div className="absolute inset-0 z-30 flex flex-col justify-center items-center text-center px-4 text-white">

        <h1 className="text-4xl sm:text-6xl font-bold mb-4">Kingdom of Okros</h1>

        <div className="flex items-center gap-4 mb-4">
          <div className="h-px w-24 sm:w-40 bg-gradient-to-r from-orange-500 to-orange-300 text-transparent" />
          <span className="bg-gradient-to-r from-orange-500 to-orange-300 text-transparent bg-clip-text text-xl sm:text-4xl font-medium">3621</span>
          <div className="h-px w-24 sm:w-40 bg-gradient-to-r from-orange-500 to-orange-300 text-transparent" />
        </div>

        <p className="text-lg sm:text-2xl mb-10">We're building something epic. Stay tuned!</p>

        <div className="grid gap-6 w-full max-w-6xl px-4 sm:px-6 md:px-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">

          {[
            { href: '/players', icon: '/icons/player.png', label: 'Governors' },
            { href: '/alliances', icon: '/icons/alliance.png', label: 'Alliances' },
            { href: '/calendar', icon: '/icons/events.png', label: 'Calendar' },
            { href: '/equipments', icon: '/icons/equipment/revival_helmet.png', label: 'Equipments' },
            { href: '/builds', icon: '/icons/commanders/arthur-pendragon.png', label: 'Builds' },

          ].map((card) => (
            <HomeCard key={card.href} {...card} />
          ))}
        </div>
      </div>

      <DiscordButton />
    </div>
  )
}
