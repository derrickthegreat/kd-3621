import Navbar from "@/app/components/Navbar";
import { ClerkProvider } from '@clerk/nextjs';

/**
 * Layout wrapper for all pages under /app/(pages)/.
 * Provides a shared Navbar and main container styling.
 *
 * @param children - The page content to render inside the layout
 */
export default function PagesLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider>
            <Navbar />
            <main className="min-h-screen bg-gray-950 text-white font-sans">
                <div className="container mx-auto px-4 py-6">{children}</div>
            </main>
        </ClerkProvider>
    );
}
