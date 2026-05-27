"use client"

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function CatalogoPublico({ inventario }: { inventario: any[] }) {
  const searchParams = useSearchParams()
  const idsParam = searchParams.get('ids')

  const [busqueda, setBusqueda] = useState('')
  const [filtroCat, setFiltroCat] = useState('')

  // 1. Solo mostramos joyas con foto de venta
  let joyasMostrar = inventario.filter(j => j.foto_venta)

  // 2. Si el link trae IDs específicos, filtramos para mostrar solo esos
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
      {/* ENCABEZADO ELEGANTE */}
      <div className="text-center py-12 px-4 bg-slate-900 text-white shadow-xl mb-8 md:rounded-b-[3rem]">
        <h1 className="text-4xl md:text-5xl font-extrabold text-amber-400 mb-3 tracking-wide">SC Joyas</h1>
        <p className="text-slate-300 text-sm md:text-base font-light tracking-widest uppercase">
          {idsParam ? 'Selección Exclusiva Para Ti' : 'Catálogo Oficial'}
        </p>
      </div>

      <div className="px-4">
        {/* FILTROS MINIMALISTAS */}
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

        {/* GRILLA DE CATÁLOGO (IMÁGENES GRANDES Y PRECIO DE VENTA) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtradas.length === 0 ? (
            <p className="col-span-full text-center py-20 text-gray-400 text-lg">No hay joyas para mostrar.</p>
          ) : (
            filtradas.map(joya => {
              // Buscar el precio más bajo entre sus tallas disponibles
              const precios = joya.variantes_stock?.map((v: any) => v.precio_venta) || []
              const precioMin = precios.length > 0 ? Math.min(...precios) : 0

              return (
                <div key={joya.id} className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
                  <div className="relative aspect-square">
                    <img 
                      src={joya.foto_venta} 
                      alt={joya.nombre} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 text-center">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block mb-1">
                      {joya.categoria}
                    </span>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{joya.nombre}</h2>
                    <p className="text-2xl font-extrabold text-emerald-600">
                      {precioMin > 0 ? `$${precioMin.toLocaleString('es-CL')}` : 'Consultar'}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}