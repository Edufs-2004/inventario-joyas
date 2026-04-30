import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: 'Sistema de Inventario - Joyería',
  description: 'Panel de administración interno',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="flex h-screen bg-gray-100 font-sans">
        
        {/* Menú Lateral (Sidebar) */}
        <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-2xl font-bold tracking-wider text-amber-400">
              💎 JOYERÍA
            </h2>
            <p className="text-slate-400 text-sm mt-1">Panel de Control</p>
          </div>
          
          <nav className="flex flex-col p-4 gap-2 flex-1">
            <Link 
              href="/" 
              className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-3"
            >
              📦 Inventario
            </Link>
            <Link 
              href="#" 
              className="p-3 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center gap-3"
            >
              💰 Ventas (Pronto)
            </Link>
          </nav>
          
          <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
            Desarrollado por ti 🚀
          </div>
        </aside>

        {/* Contenido Principal (Aquí es donde Next.js inyecta tu tabla) */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </body>
    </html>
  )
}