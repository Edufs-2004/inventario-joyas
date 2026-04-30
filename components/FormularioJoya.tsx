"use client"

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { CATEGORIAS_JOYAS, MATERIALES_JOYAS } from '../lib/constantes'
import SubidorImagen from './SubidorImagen'

export default function FormularioJoya() {
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS_JOYAS[0])
  const [tipo, setTipo] = useState(MATERIALES_JOYAS[0])
  const [diametro, setDiametro] = useState('') 
  
  // ESTADOS PARA LAS 3 FOTOS
  const [fotoPeso, setFotoPeso] = useState<string | null>(null)
  const [fotoPresentacion, setFotoPresentacion] = useState<string | null>(null)
  const [fotoVenta, setFotoVenta] = useState<string | null>(null)

  // ESTADOS PARA MÚLTIPLES GEMAS
  const [gemas, setGemas] = useState<{nombre: string, medida: string}[]>([])
  const [gemaTempNombre, setGemaTempNombre] = useState('')
  const [gemaTempMedida, setGemaTempMedida] = useState('')

  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  const agregarGemaTemporal = () => {
    if (!gemaTempNombre || !gemaTempMedida) return
    setGemas([...gemas, { nombre: gemaTempNombre, medida: gemaTempMedida }])
    setGemaTempNombre('')
    setGemaTempMedida('')
  }

  const quitarGemaTemporal = (index: number) => {
    setGemas(gemas.filter((_, i) => i !== index))
  }

  const guardarJoya = async (e: React.FormEvent) => {
    e.preventDefault() 
    setCargando(true)

    // 1. Guardar la Joya Maestra y pedir que nos devuelva el ID creado
    const { data: modeloData, error: modeloError } = await supabase
      .from('modelos')
      .insert([{ 
        nombre, categoria, tipo, diametro, 
        foto_peso: fotoPeso, foto_presentacion: fotoPresentacion, foto_venta: fotoVenta
      }])
      .select()

    if (modeloError) {
      alert("Error al guardar producto: " + modeloError.message)
      setCargando(false)
      return
    }

    // 2. Si hay gemas, las guardamos asociadas al ID de la joya que se acaba de crear
    if (gemas.length > 0 && modeloData) {
      const idJoyaNueva = modeloData[0].id
      const gemasParaBase = gemas.map(g => ({
        modelo_id: idJoyaNueva,
        nombre: g.nombre,
        medida: g.medida
      }))

      const { error: gemasError } = await supabase.from('gemas_joya').insert(gemasParaBase)
      if (gemasError) alert("El producto se guardó, pero hubo error con las gemas: " + gemasError.message)
    }

    // 3. Limpiar y cerrar
    setCargando(false)
    setAbierto(false)
    setNombre(''); setCategoria(CATEGORIAS_JOYAS[0]); setTipo(MATERIALES_JOYAS[0]); setDiametro('')
    setFotoPeso(null); setFotoPresentacion(null); setFotoVenta(null)
    setGemas([])
    router.refresh() 
  }

  return (
    <>
      <button onClick={() => setAbierto(true)} className="mb-6 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
        + Agregar Producto
      </button>

      {abierto && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b bg-slate-900 text-white flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold text-amber-400">💍 Registrar Nueva Joya</h2>
              <button onClick={() => setAbierto(false)} className="text-gray-400 hover:text-white">✖</button>
            </div>
            
            <form onSubmit={guardarJoya} className="p-6 overflow-y-auto flex-1 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* COLUMNA IZQUIERDA: DATOS BÁSICOS */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 border-b pb-2">Datos Principales</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre del producto</label>
                    <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Categoría</label>
                      <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white">
                        {CATEGORIAS_JOYAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Material Base</label>
                      <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white">
                        {MATERIALES_JOYAS.map(mat => <option key={mat} value={mat}>{mat}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Diámetro / Medida Base</label>
                    <input type="text" value={diametro} onChange={(e) => setDiametro(e.target.value)} placeholder="Ej: 15mm o Ajustable" className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" />
                  </div>

                  {/* SECCIÓN GEMAS MÚLTIPLES */}
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mt-4">
                    <h4 className="text-sm font-bold text-amber-900 mb-2">💎 Gemas (Opcional)</h4>
                    <div className="flex gap-2 items-end mb-3">
                      <div className="flex-1">
                        <label className="block text-xs text-amber-800">Nombre</label>
                        <input type="text" value={gemaTempNombre} onChange={e => setGemaTempNombre(e.target.value)} placeholder="Ej: Rubí" className="w-full border p-1.5 rounded text-sm" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-amber-800">Medida (mm)</label>
                        <input type="text" value={gemaTempMedida} onChange={e => setGemaTempMedida(e.target.value)} placeholder="Ej: 5mm" className="w-full border p-1.5 rounded text-sm" />
                      </div>
                      <button type="button" onClick={agregarGemaTemporal} className="bg-amber-600 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-amber-700">Añadir</button>
                    </div>
                    {gemas.length > 0 && (
                      <ul className="text-sm border border-amber-300 rounded overflow-hidden">
                        {gemas.map((g, i) => (
                          <li key={i} className="flex justify-between items-center bg-white p-2 border-b last:border-0">
                            <span><b>{g.nombre}</b> ({g.medida})</span>
                            <button type="button" onClick={() => quitarGemaTemporal(i)} className="text-red-500 hover:text-red-700 font-bold">✖</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* COLUMNA DERECHA: FOTOS */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 border-b pb-2">Registro Fotográfico</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <SubidorImagen titulo="📸 1. Foto de Presentación (Ficha)" urlActual={fotoPresentacion} alSubir={setFotoPresentacion} />
                    <SubidorImagen titulo="⚖️ 2. Foto en la Pesa (Interna)" urlActual={fotoPeso} alSubir={setFotoPeso} />
                    <SubidorImagen titulo="🎨 3. Foto de Venta (Editada Canva)" urlActual={fotoVenta} alSubir={setFotoVenta} />
                  </div>
                </div>

              </div>

              <div className="border-t mt-6 pt-4 flex justify-end gap-3 sticky bottom-0 bg-gray-50">
                <button type="button" onClick={() => setAbierto(false)} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-100 font-bold">Cancelar</button>
                <button type="submit" disabled={cargando} className="px-6 py-2 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 font-bold disabled:bg-slate-400">
                  {cargando ? 'Guardando en la nube...' : '💾 Registrar Joya Definitiva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}