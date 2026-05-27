"use client"

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const pathname = usePathname();

  // === CORRECCIÓN AQUÍ: Solo oculta el menú si la ruta es EXACTAMENTE "/c" ===
  if (pathname === '/c' || pathname?.startsWith('/c/')) {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}>
          {children}
        </body>
      </html>
    );
  }

  // === RENDERIZADO NORMAL PARA EL ADMINISTRADOR ===
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex min-h-screen bg-gray-50 overflow-hidden w-full relative">

          {sidebarAbierto && (
            <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarAbierto(false)} />
          )}

          <aside className={`bg-slate-900 text-white transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-50 md:relative ${sidebarAbierto ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'}`}>
            <div className="p-6 flex items-center justify-between border-b border-slate-800">
              {sidebarAbierto && <h2 className="font-bold text-amber-400 text-xl whitespace-nowrap">SC Joyas</h2>}
              <button onClick={() => setSidebarAbierto(!sidebarAbierto)} className="p-2 hover:bg-slate-800 rounded-lg hidden md:block">
                {sidebarAbierto ? '⬅️' : '☰'}
              </button>
              <button onClick={() => setSidebarAbierto(false)} className="p-2 hover:bg-slate-800 rounded-lg md:hidden text-xl">✖</button>
            </div>

            <nav className="flex-1 px-4 space-y-4 mt-4">
              <Link href="/" onClick={() => setSidebarAbierto(false)} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800 text-slate-400 transition-all">
                <span className="text-xl">💍</span>
                {sidebarAbierto && <span>Inventario</span>}
              </Link>
              <Link href="/catalogo" onClick={() => setSidebarAbierto(false)} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800 text-slate-400 transition-all">
                <span className="text-xl">📱</span>
                {sidebarAbierto && <span>Armar Catálogo</span>}
              </Link>
              <Link href="/ventas" onClick={() => setSidebarAbierto(false)} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800 text-slate-400 transition-all">
                <span className="text-xl">📊</span>
                {sidebarAbierto && <span>Ventas</span>}
              </Link>
              <Link href="/contabilidad" onClick={() => setSidebarAbierto(false)} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800 text-slate-400 transition-all">
                <span className="text-xl">💰</span>
                {sidebarAbierto && <span>Contabilidad</span>}
              </Link>
            </nav>
            
            {sidebarAbierto && (
              <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-600">
                Desarrollado por Tí
              </div>
            )}
          </aside>

          <main className="flex-1 overflow-y-auto w-full relative">
            <div className="md:hidden sticky top-0 p-4 bg-gray-50 z-30 flex items-center border-b shadow-sm">
              <button onClick={() => setSidebarAbierto(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg shadow-md font-bold text-sm">
                ☰ Menú
              </button>
            </div>
            <div className="p-0">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}