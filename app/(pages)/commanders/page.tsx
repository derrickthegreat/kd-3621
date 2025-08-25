'use client'
import Image from 'next/image'
import Link from 'next/link'
import PageHeader from '@/app/components/PageHeader'
import commanders from '@/public/data/commanders.json'

export default function CommandersPage() {
  return (
    <main className="p-6 text-white bg-gray-950 min-h-screen">
      <PageHeader title="Commanders" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {commanders.map((c: any) => (
          <Link href={`/builds/${getSlug(c.image)}`} key={c.name} className="group rounded border border-gray-800 p-3 bg-gray-900/40 hover:bg-gray-900 transition">
            <div className="flex flex-col items-center text-center gap-2">
              <Image
                src={c.image?.startsWith('/') ? c.image : `/icons/commanders/${c.image}`}
                alt={c.name}
                width={80}
                height={80}
                className="rounded-full border border-gray-700"
              />
              <div className="text-sm font-medium group-hover:text-orange-400">{c.name}</div>
              {Array.isArray(c.attributes) && c.attributes.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1">
                  {c.attributes.filter(Boolean).map((attr: string) => (
                    <span key={attr} className="px-2 py-0.5 text-[10px] rounded bg-gray-800 text-gray-300 border border-gray-700">
                      {attr}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}

function getSlug(img: string) {
  const file = (img || '').split('/').pop() || ''
  return file.replace(/\.[a-zA-Z0-9]+$/, '')
}
