"use client"

import { useState } from 'react'

export default function GeneradorCatalogo({ inventario }: { inventario: any[] }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroCat, setFiltroCat] = useState<string>('')
  const [seleccionados, setSeleccionados] = useState<any[]>([])
  const [compartiendo, setCompartiendo] = useState(false)

  // Solo mostrar joyas que SÍ tengan foto de venta
  const joyasConFoto = inventario.filter(j => j.foto_venta)
  const categoriasUnicas = Array.from(new Set(joyasConFoto.map(j => j.categoria))).filter(Boolean) as string[]

  // Filtrado
  const filtradas = joyasConFoto.filter(j => {
    const pasaBusqueda = j.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const pasaCat = filtroCat === '' || j.categoria === filtroCat
    return pasaBusqueda && pasaCat
  })

  // Seleccionar / Deseleccionar
  const toggleSeleccion = (joya: any) => {
    if (seleccionados.find(s => s.id === joya.id)) {
      setSeleccionados(seleccionados.filter(s => s.id !== joya.id))
    } else {
      setSeleccionados([...seleccionados, joya])
    }
  }

  // LA MAGIA: Compartir nativo o descargar
  const compartirCatalogo = async () => {
    setCompartiendo(true)
    try {
      // 1. Convertir las URLs de las fotos en archivos reales (Blobs)
      const archivos = await Promise.all(
        seleccionados.map(async (item, index) => {
          const respuesta = await fetch(item.foto_venta)
          const blob = await respuesta.blob()
          // Asignar un nombre limpio al archivo
          return new File([blob], `catalogo_${index + 1}.jpg`, { type: blob.type })
        })
      )

      // 2. Armar un texto bonito con los precios (buscando el precio más bajo de sus tallas)
      let textoMensaje = "¡Hola! Te comparto estas opciones de SC Joyas:\n\n"
      seleccionados.forEach(item => {
        const precios = item.variantes_stock?.map((v: any) => v.precio_venta) || []
        const precioMin = precios.length > 0 ? Math.min(...precios) : 0
        textoMensaje += `💍 ${item.nombre}`
        if (precioMin > 0) textoMensaje += ` (Desde $${precioMin})`
        textoMensaje += "\n"
      })

      // 3. Intentar usar la API Nativa del Teléfono (WhatsApp, Instagram, etc)
      if (navigator.canShare && navigator.canShare({ files: archivos })) {
        await navigator.share({
          files: archivos,
          title: 'Catálogo SC Joyas',
          text: textoMensaje
        })
      } else {
        // Fallback para PC viejo: Descargar una por una
        alert("Tu navegador no soporta compartir directamente. Se descargarán las fotos.")
        archivos.forEach(archivo => {
          const url = URL.createObjectURL(archivo)
          const a = document.createElement('a')
          a.href = url
          a.download = archivo.name
          a.click()
          URL.revokeObjectURL(url)
        })
        // Copiar texto al portapapeles
        navigator.clipboard.writeText(textoMensaje)
        alert("¡Texto con precios copiado al portapapeles!")
      }
    } catch (error) {
      console.error("Error al compartir:", error)
      alert("Hubo un error al procesar las imágenes.")
    }
    setCompartiendo(false)
  }

  return (
    <div className="w-full">
      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar por Nombre</label>
          <input 
            type="text" 
            placeholder="Ej: Anillo Solitario..." 
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
        <div className="sm:w-1/3">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Filtrar Categoría</label>
          <select 
            value={filtroCat} 
            onChange={e => setFiltroCat(e.target.value)}
            className="w-full border p-2 rounded-lg text-sm bg-white outline-none"
          >
            <option value="">Todas las categorías</option>
            {categoriasUnicas.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* GRILLA DE FOTOS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtradas.length === 0 ? (
          <p className="col-span-full text-center py-10 text-gray-400">No se encontraron joyas con foto de venta.</p>
        ) : (
          filtradas.map(joya => {
            const seleccionado = seleccionados.find(s => s.id === joya.id)
            return (
              <div 
                key={joya.id} 
                onClick={() => toggleSeleccion(joya)}
                className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${seleccionado ? 'border-amber-500 shadow-md transform scale-[0.98]' : 'border-transparent hover:border-gray-300'}`}
              >
                {/* Checkmark gigante si está seleccionado */}
                {seleccionado && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold z-10 shadow">
                    ✓
                  </div>
                )}
                
                <img src={joya.foto_venta} alt={joya.nombre} className={`w-full h-40 object-cover ${seleccionado ? 'opacity-90' : ''}`} />
                
                <div className="p-2 bg-white">
                  <p className="text-xs font-bold text-gray-800 truncate">{joya.nombre}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* BARRA FLOTANTE INFERIOR (Solo aparece si hay selecciones) */}
      {seleccionados.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-700 shadow-2xl z-50 flex justify-between items-center animate-slide-up md:pl-24">
          <div className="text-white">
            <span className="font-bold text-amber-400 text-lg">{seleccionados.length}</span>
            <span className="text-sm ml-2">seleccionados</span>
          </div>
          
          <button 
            onClick={compartirCatalogo}
            disabled={compartiendo}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center gap-2 transition-colors disabled:bg-emerald-800"
          >
            {compartiendo ? (
              <span className="animate-pulse">Procesando...</span>
            ) : (
              <>
                <span className="text-xl">📲</span> Enviar / Descargar
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}