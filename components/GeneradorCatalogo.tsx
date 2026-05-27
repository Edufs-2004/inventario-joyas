"use client"

import { useState } from 'react'

export default function GeneradorCatalogo({ inventario }: { inventario: any[] }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroCat, setFiltroCat] = useState<string>('')
  const [seleccionados, setSeleccionados] = useState<any[]>([])

  const joyasConFoto = inventario.filter(j => j.foto_venta)
  const categoriasUnicas = Array.from(new Set(joyasConFoto.map(j => j.categoria))).filter(Boolean) as string[]

  const filtradas = joyasConFoto.filter(j => {
    const pasaBusqueda = j.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const pasaCat = filtroCat === '' || j.categoria === filtroCat
    return pasaBusqueda && pasaCat
  })

  const toggleSeleccion = (joya: any) => {
    if (seleccionados.find(s => s.id === joya.id)) {
      setSeleccionados(seleccionados.filter(s => s.id !== joya.id))
    } else {
      setSeleccionados([...seleccionados, joya])
    }
  }

  const generarLinkYCompartir = async (tipo: 'completo' | 'seleccion') => {
    const baseUrl = window.location.origin
    let link = `${baseUrl}/c`
    let texto = "¡Hola! Te invito a ver nuestro catálogo completo de SC Joyas: \n\n"

    if (tipo === 'seleccion' && seleccionados.length > 0) {
      const ids = seleccionados.map(s => s.id).join(',')
      link = `${baseUrl}/c?ids=${ids}`
      texto = "¡Hola! Preparé esta selección exclusiva de joyas especialmente para ti. Míralas aquí: \n\n"
    }

    const mensajeFinal = `${texto}${link}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Catálogo SC Joyas',
          text: texto,
          url: link
        })
      } catch (err) {
        console.log("Se canceló el compartir", err)
      }
    } else {
      navigator.clipboard.writeText(mensajeFinal)
      alert("¡Enlace copiado! Ya puedes pegarlo en WhatsApp.")
    }
  }

  return (
    <div className="w-full">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar por Nombre</label>
          <input type="text" placeholder="Ej: Anillo Solitario..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
        </div>
        <div className="sm:w-1/3 w-full">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Filtrar Categoría</label>
          <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)} className="w-full border p-2 rounded-lg text-sm bg-white outline-none">
            <option value="">Todas las categorías</option>
            {categoriasUnicas.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <button onClick={() => generarLinkYCompartir('completo')} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold py-2 px-4 rounded-lg text-sm shadow transition-colors whitespace-nowrap">
          🔗 Compartir Catálogo Total
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtradas.length === 0 ? (
          <p className="col-span-full text-center py-10 text-gray-400">No se encontraron joyas con foto de venta.</p>
        ) : (
          filtradas.map(joya => {
            const seleccionado = seleccionados.find(s => s.id === joya.id)
            return (
              <div key={joya.id} onClick={() => toggleSeleccion(joya)} className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${seleccionado ? 'border-amber-500 shadow-md transform scale-[0.98]' : 'border-transparent hover:border-gray-300'}`}>
                {seleccionado && <div className="absolute top-2 right-2 bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold z-10 shadow">✓</div>}
                <img src={joya.foto_venta} alt={joya.nombre} className={`w-full h-40 object-cover ${seleccionado ? 'opacity-90' : ''}`} />
                <div className="p-2 bg-white">
                  <p className="text-xs font-bold text-gray-800 truncate">{joya.nombre}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {seleccionados.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-700 shadow-2xl z-50 flex justify-between items-center animate-slide-up md:pl-24">
          <div className="text-white">
            <span className="font-bold text-amber-400 text-lg">{seleccionados.length}</span>
            <span className="text-sm ml-2 hidden sm:inline">joyas seleccionadas</span>
          </div>
          <button onClick={() => generarLinkYCompartir('seleccion')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center gap-2 transition-colors">
            <span className="text-xl">📲</span> Enviar Selección
          </button>
        </div>
      )}
    </div>
  )
}