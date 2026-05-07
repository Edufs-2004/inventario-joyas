"use client" // Obligatorio para usar estados (useState)

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useState } from 'react';
import Link from 'next/link';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Nota: No podemos usar Metadatos en Client Components directamente de esta forma.
// He quitado la exportación de const metadata para que no te salte error.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Estado para controlar si el panel lateral está abierto o cerrado
  const [sidebarAbierto, setSidebarAbierto] = useState(false); // Cerrado por defecto en móvil

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen bg-gray-50 overflow-hidden w-full relative">

          {/* CAPA OSCURA PARA MÓVIL CUANDO EL MENÚ ESTÁ ABIERTO (Tocar aquí cierra el menú) */}
          {sidebarAbierto && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setSidebarAbierto(false)}
            />
          )}

          {/* MENÚ LATERAL (SIDEBAR) COLAPSABLE - AQUÍ ESTÁ EL CAMBIO PRINCIPAL */}
          <aside className={`bg-slate-900 text-white transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-50 md:relative ${sidebarAbierto ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'}`}>
            <div className="p-6 flex items-center justify-between border-b border-slate-800">
              
              {/* CAMBIO DE TEXTO: EOS JOYAS -> SC JOYAS */}
              {sidebarAbierto && <h2 className="font-bold text-amber-400 text-xl whitespace-nowrap">SC Joyas</h2>}
              
              {/* BOTÓN HAMBURGUESA/⬅️ PARA COMPUTADOR */}
              <button onClick={() => setSidebarAbierto(!sidebarAbierto)} className="p-2 hover:bg-slate-800 rounded-lg hidden md:block">
                {sidebarAbierto ? '⬅️' : '☰'}
              </button>
              
              {/* BOTÓN CERRAR (✖) PARA MÓVIL */}
              <button onClick={() => setSidebarAbierto(false)} className="p-2 hover:bg-slate-800 rounded-lg md:hidden text-xl">
                ✖
              </button>
            </div>

            <nav className="flex-1 px-4 space-y-4 mt-4">
              {/* ÍCONOS Y TEXTOS PARA EL MENÚ LATERAL */}
              <Link href="/" onClick={() => setSidebarAbierto(false)} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800 text-slate-400 transition-all">
                <span className="text-xl">💍</span>
                {sidebarAbierto && <span>Inventario</span>}
              </Link>
              <Link href="/ventas" onClick={() => setSidebarAbierto(false)} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800 text-slate-400 transition-all">
                <span className="text-xl">📊</span>
                {sidebarAbierto && <span>Ventas</span>}
              </Link>
              <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed transition-all">
                <span className="text-xl">💰</span>
                {sidebarAbierto && <span>Contabilidad</span>}
              </button>
            </nav>
            
            {/* CRÉDITOS ABAJO */}
            {sidebarAbierto && (
              <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-600">
                Desarrollado por Tí
              </div>
            )}
          </aside>

          {/* CONTENIDO PRINCIPAL (Donde viven tus otras páginas) */}
          <main className="flex-1 overflow-y-auto w-full relative">
            
            {/* BOTÓN HAMBURGUESA PARA MÓVIL (Solo visible en pantallas pequeñas) */}
            <div className="md:hidden sticky top-0 p-4 bg-gray-50 z-30 flex items-center border-b shadow-sm">
              <button 
                onClick={() => setSidebarAbierto(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg shadow-md font-bold text-sm"
              >
                ☰ Menú
              </button>
            </div>

            <div className="p-0"> {/* Children maneja su propio padding */}
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}