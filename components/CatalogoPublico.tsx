"use client"

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function CatalogoPublico({ inventario }: { inventario: any[] }) {
  const searchParams = useSearchParams()
  const idsParam = searchParams.get('ids')

  const [busqueda, setBusqueda] = useState('')
  const [filtroCat, setFiltroCat] = useState('')
  
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null)

  let joyasMostrar = inventario.filter(j => j.foto_venta)

  if (idsParam) {
    const idsPermitidos = idsParam.split(',')
    joyasMostrar = joyasMostrar.filter(j => idsPermitidos.includes(j.id.toString()))
  }

  const categoriasUnicas = Array.from(new Set(joyasMostrar.map(j => j.categoria))).filter(Boolean) as string[]

  const filtradas = joyasMostrar.filter(j => {
    const pasaBusqueda = j.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const pasaCat = filtroCat === '' || j.categoria === filtroCat
    return pasaBusqueda && pasaCat
  })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center py-12 px-4 bg-slate-900 text-white shadow-xl mb-8 md:rounded-b-[3rem]">
        <h1 className="text-4xl md:text-5xl font-extrabold text-amber-400 mb-3 tracking-wide">SC Joyas</h1>
        <p className="text-slate-300 text-sm md:text-base font-light tracking-widest uppercase">
          {idsParam ? 'Selección Exclusiva Para Ti' : 'Catálogo Oficial'}
        </p>
      </div>

      <div className="px-4">
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col sm:flex-row gap-2">
          <input 
            type="text" 
            placeholder="🔍 Buscar joya..." 
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="flex-1 bg-gray-50 border-none p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400"
          />
          <select 
            value={filtroCat} 
            onChange={e => setFiltroCat(e.target.value)}
            className="sm:w-1/3 bg-gray-50 border-none p-3 rounded-xl text-sm outline-none cursor-pointer focus:ring-2 focus:ring-amber-400"
          >
            <option value="">🏷️ Todas las categorías</option>
            {categoriasUnicas.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtradas.length === 0 ? (
            <p className="col-span-full text-center py-20 text-gray-400 text-lg">No hay joyas para mostrar.</p>
          ) : (
            filtradas.map(joya => {
              const precios = joya.variantes_stock?.map((v: any) => v.precio_venta) || []
              const precioMin = precios.length > 0 ? Math.min(...precios) : 0

              const letra = joya.categoria ? joya.categoria.charAt(0).toUpperCase() : 'J'
              const costoBase = joya.variantes_stock?.[0]?.costo || '000'
              const codigoProducto = `${letra}${costoBase}`

              const tallasDisponibles = joya.variantes_stock
                ?.filter((v: any) => v.stock > 0)
                .map((v: any) => v.medida)
                .join(' - ')

              const listaGemas = joya.gemas_joya?.map((g: any) => g.nombre).join(', ')

              return (
                <div key={joya.id} className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-shadow duration-300 flex flex-col">
                  
                  {/* CORRECCIÓN: Agregado overflow-hidden al contenedor principal */}
                  <div 
                    className="relative aspect-square cursor-pointer group overflow-hidden"
                    onClick={() => setImagenAmpliada(joya.foto_venta)}
                  >
                    <img 
                      src={joya.foto_venta} 
                      alt={joya.nombre} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* CORRECCIÓN: Usando opacity-0 nativo para evitar el cuadro negro en celulares */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="text-white bg-black/60 px-4 py-2 rounded-full font-bold text-sm shadow-lg backdrop-blur-sm">
                        🔍 Ver completa
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded shadow-inner uppercase tracking-wider">
                        REF: {codigoProducto}
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded uppercase tracking-wider">
                        {joya.categoria}
                      </span>
                    </div>
                    
                    <h2 className="text-lg font-bold text-gray-800 mb-3">{joya.nombre}</h2>
                    
                    <div className="space-y-2 mb-4 flex-1">
                      {tallasDisponibles ? (
                        <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                          <strong>📏 Tallas:</strong> <span className="font-medium">{tallasDisponibles}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100 font-bold">
                          🚫 Temporalmente Agotado
                        </p>
                      )}
                      
                      {listaGemas && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                          <strong>💎 Gemas:</strong> <span className="font-medium text-slate-800">{listaGemas}</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-auto border-t border-gray-100 pt-4 text-center">
                      <p className="text-2xl font-black text-emerald-600">
                        {precioMin > 0 ? `$${precioMin.toLocaleString('es-CL')}` : 'Consultar'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {imagenAmpliada && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-2 sm:p-6 backdrop-blur-sm cursor-zoom-out animate-fade-in"
          onClick={() => setImagenAmpliada(null)}
        >
          <button 
            className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white/50 hover:text-white text-4xl sm:text-5xl font-bold transition-colors z-50"
            onClick={(e) => { e.stopPropagation(); setImagenAmpliada(null); }}
          >
            ✖
          </button>
          <img 
            src={imagenAmpliada} 
            alt="Foto Completa" 
            className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
          />
        </div>
      )}
    </div>
  )
}