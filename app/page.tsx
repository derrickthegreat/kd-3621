'use client'

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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
          <div className="h-px w-24 sm:w-40 bg-[#FFD700]" />
          <span className="text-[#FFD700] text-xl sm:text-4xl font-medium">3621</span>
          <div className="h-px w-24 sm:w-40 bg-[#FFD700]" />
        </div>

        <p className="text-lg sm:text-2xl mb-10">We're building something epic. Stay tuned!</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full">
          {[
            { href: '/players', icon: '/icons/player.png', label: 'Players' },
            { href: '/alliances', icon: '/icons/alliance.png', label: 'Alliances' },
            { href: '/calendar', icon: '/icons/events.png', label: 'Calendar' }
          ].map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className="bg-gray-800/80 hover:bg-orange-500 transition-colors border border-gray-700 rounded-lg px-6 py-4 flex flex-col items-center justify-center text-white shadow-lg"
            >
              <Image src={icon} alt={label} width={40} height={40} className="mb-2" />
              <span className="text-lg font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <a
        href="https://discord.gg/YZ2AAnkN"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-white rounded-full h-14 flex flex-row-reverse items-center shadow-lg overflow-hidden transition-all duration-500 group hover:w-56 w-14"
        aria-label="Join us on Discord"
      >
        <Image
          src="/icons/discord-icon.svg"
          alt="Discord logo"
          width={28}
          height={28}
          className="object-contain shrink-0 mr-[14px]"
        />
        <span className="text-md font-medium text-[#5865F2] whitespace-nowrap pr-4 opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[200px] transition-all duration-500">
          Join 3621&apos;s Discord
        </span>
      </a>
    </div>
  )
}
