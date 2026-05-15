"use client"

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { CATEGORIAS_JOYAS, MATERIALES_JOYAS } from '../lib/constantes'
import SubidorImagen from './SubidorImagen'

export default function FormularioJoya() {
  const [abierto, setAbierto] = useState(false)
  
  // DATOS PRINCIPALES
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS_JOYAS[0])
  const [tipo, setTipo] = useState(MATERIALES_JOYAS[0])
  const [diametro, setDiametro] = useState('') 
  
  // FOTOS
  const [fotoPeso, setFotoPeso] = useState<string | null>(null)
  const [fotoPresentacion, setFotoPresentacion] = useState<string | null>(null)
  const [fotoVenta, setFotoVenta] = useState<string | null>(null)

  // GEMAS
  const [gemas, setGemas] = useState<{nombre: string, medida: string}[]>([])
  const [gemaTempNombre, setGemaTempNombre] = useState('')
  const [gemaTempMedida, setGemaTempMedida] = useState('')

  // SISTEMA MULTI-TALLAS
  type TallaTemp = { medida: string, peso: string, costo: string, precioVenta: string, stock: number }
  const [tallas, setTallas] = useState<TallaTemp[]>([])
  const [tallaTemp, setTallaTemp] = useState<TallaTemp>({ medida: '', peso: '', costo: '', precioVenta: '', stock: 1 })

  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  const agregarGemaTemporal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!gemaTempNombre || !gemaTempMedida) return
    setGemas([...gemas, { nombre: gemaTempNombre, medida: gemaTempMedida }])
    setGemaTempNombre('')
    setGemaTempMedida('')
  }
  const eliminarGemaTemporal = (index: number) => setGemas(gemas.filter((_, i) => i !== index))

  const agregarTallaTemporal = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!tallaTemp.medida || !tallaTemp.costo || !tallaTemp.precioVenta) {
      alert("La talla, costo y precio de venta son obligatorios para agregar stock.")
      return
    }
    setTallas([...tallas, tallaTemp])
    setTallaTemp({ medida: '', peso: '', costo: '', precioVenta: '', stock: 1 })
  }
  const eliminarTallaTemporal = (index: number) => setTallas(tallas.filter((_, i) => i !== index))

  const guardarJoya = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)

    const { data: modeloData, error: errorModelo } = await supabase
      .from('modelos')
      .insert([{ nombre, categoria, tipo, diametro: diametro || null, foto_presentacion: fotoPresentacion, foto_peso: fotoPeso, foto_venta: fotoVenta }])
      .select()

    if (errorModelo) {
      alert("Error al guardar producto: " + errorModelo.message)
      setCargando(false)
      return
    }

    const modeloId = modeloData[0].id

    if (gemas.length > 0) {
      const gemasInsert = gemas.map(g => ({ modelo_id: modeloId, nombre: g.nombre, medida: g.medida }))
      await supabase.from('gemas_joya').insert(gemasInsert)
    }

    if (tallas.length > 0) {
      const tallasInsert = tallas.map(t => ({
        modelo_id: modeloId,
        medida: t.medida,
        peso: t.peso ? Number(t.peso) : null,
        costo: Number(t.costo),
        precio_venta: Number(t.precioVenta),
        stock: Number(t.stock)
      }))
      await supabase.from('variantes_stock').insert(tallasInsert)
    }

    // Limpiar y cerrar
    setNombre(''); setCategoria(CATEGORIAS_JOYAS[0]); setTipo(MATERIALES_JOYAS[0]); setDiametro('')
    setFotoPeso(null); setFotoPresentacion(null); setFotoVenta(null)
    setGemas([]); setTallas([])
    setAbierto(false)
    setCargando(false)
    
    router.refresh()
  }

  return (
    <>
      {/* BOTÓN FLOTANTE PERMANENTE */}
      <div className="fixed bottom-6 right-6 z-[100]">
        <button 
          onClick={() => setAbierto(true)} 
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-14 w-14 md:w-auto md:h-auto md:py-3 md:px-5 rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2 transform transition-all hover:scale-105 border-2 border-slate-700"
        >
          <span className="text-2xl md:text-xl leading-none">➕</span> 
          <span className="hidden md:inline pr-2 whitespace-nowrap">Nueva Joya</span>
        </button>
      </div>

      {abierto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
            
            <div className="bg-slate-900 p-4 sm:p-6 text-white flex justify-between items-center shrink-0">
              <h2 className="text-xl sm:text-2xl font-bold text-amber-400">💍 Registrar Nueva Joya</h2>
              <button onClick={() => setAbierto(false)} className="text-slate-400 hover:text-white text-2xl sm:text-3xl">✖</button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto bg-gray-50 flex-1">
              <form id="form-joya" onSubmit={guardarJoya} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 border-b pb-2 mb-4 text-sm uppercase">1. Datos Principales</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Nombre del Modelo</label>
                        <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} className="w-full border p-2 rounded mt-1 text-sm" placeholder="Ej: Anillo Solitario" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase">Categoría</label>
                          <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full border p-2 rounded mt-1 text-sm bg-white">
                            {CATEGORIAS_JOYAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase">Material</label>
                          <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full border p-2 rounded mt-1 text-sm bg-white">
                            {MATERIALES_JOYAS.map(mat => <option key={mat} value={mat}>{mat}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Diámetro / Tamaño Base</label>
                        <input type="text" value={diametro} onChange={e => setDiametro(e.target.value)} className="w-full border p-2 rounded mt-1 text-sm" placeholder="Ej: 15mm (Opcional)" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-xl shadow-sm border border-amber-200">
                    <h3 className="font-bold text-amber-800 border-b border-amber-200 pb-2 mb-4 text-sm uppercase">2. Tallas y Stock Inicial</h3>
                    <div className="grid grid-cols-2 sm:flex gap-2 items-end mb-4">
                      <div className="flex-1"><label className="block text-[10px] font-bold text-amber-700 uppercase">Talla</label><input type="text" value={tallaTemp.medida} onChange={e => setTallaTemp({...tallaTemp, medida: e.target.value})} className="w-full border border-amber-300 p-1.5 rounded text-sm" placeholder="Ej: 16" /></div>
                      <div className="w-16"><label className="block text-[10px] font-bold text-amber-700 uppercase">Peso(g)</label><input type="number" step="0.01" value={tallaTemp.peso} onChange={e => setTallaTemp({...tallaTemp, peso: e.target.value})} className="w-full border border-amber-300 p-1.5 rounded text-sm" placeholder="2.5" /></div>
                      <div className="flex-1"><label className="block text-[10px] font-bold text-amber-700 uppercase">Costo($)</label><input type="number" value={tallaTemp.costo} onChange={e => setTallaTemp({...tallaTemp, costo: e.target.value})} className="w-full border border-amber-300 p-1.5 rounded text-sm" placeholder="10000" /></div>
                      <div className="flex-1"><label className="block text-[10px] font-bold text-green-700 uppercase">Precio($)</label><input type="number" value={tallaTemp.precioVenta} onChange={e => setTallaTemp({...tallaTemp, precioVenta: e.target.value})} className="w-full border border-green-300 bg-green-50 p-1.5 rounded text-sm" placeholder="25000" /></div>
                      <div className="w-16"><label className="block text-[10px] font-bold text-amber-700 uppercase">Stock</label><input type="number" min="1" value={tallaTemp.stock} onChange={e => setTallaTemp({...tallaTemp, stock: Number(e.target.value)})} className="w-full border border-amber-300 p-1.5 rounded text-sm text-center" /></div>
                      <button type="button" onClick={agregarTallaTemporal} className="bg-amber-600 text-white w-full sm:w-10 h-[34px] rounded font-bold hover:bg-amber-700 col-span-2 sm:col-span-1">➕</button>
                    </div>
                    <ul className="space-y-2">
                      {tallas.length === 0 ? <p className="text-xs text-amber-600/70 italic text-center py-2">No has agregado tallas. Agrega al menos una arriba 👆</p> : 
                        tallas.map((t, index) => (
                          <li key={index} className="flex justify-between items-center p-2 bg-white rounded border border-amber-100 text-xs shadow-sm overflow-x-auto">
                            <div className="flex gap-4 min-w-max">
                              <span><strong>Talla:</strong> {t.medida}</span>
                              <span className="text-gray-500"><strong>Peso:</strong> {t.peso || '-'}g</span>
                              <span className="text-red-600"><strong>Costo:</strong> ${t.costo}</span>
                              <span className="text-green-600"><strong>Precio:</strong> ${t.precioVenta}</span>
                              <span className="text-blue-600 font-bold">Stock: {t.stock}</span>
                            </div>
                            <button type="button" onClick={() => eliminarTallaTemporal(index)} className="text-red-500 hover:text-red-700 font-bold px-2">✖</button>
                          </li>
                        ))
                      }
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 border-b pb-2 mb-4 text-sm uppercase">3. Gemas (Opcional)</h3>
                    <div className="flex gap-2 mb-3">
                      <input type="text" value={gemaTempNombre} onChange={e => setGemaTempNombre(e.target.value)} placeholder="Tipo de Gema" className="w-full border p-2 text-sm rounded bg-gray-50" />
                      <input type="text" value={gemaTempMedida} onChange={e => setGemaTempMedida(e.target.value)} placeholder="Tamaño" className="w-24 border p-2 text-sm rounded bg-gray-50" />
                      <button type="button" onClick={agregarGemaTemporal} className="bg-slate-600 text-white px-3 py-2 rounded text-sm font-bold hover:bg-slate-700">+</button>
                    </div>
                    <ul className="space-y-2">
                      {gemas.map((g, index) => (
                        <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded border text-sm">
                          <span><strong className="text-gray-700">{g.nombre}</strong> <span className="text-gray-500">({g.medida})</span></span>
                          <button type="button" onClick={() => eliminarGemaTemporal(index)} className="text-red-500 hover:text-red-700 font-bold px-2">✖</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-full">
                    <h3 className="font-bold text-gray-800 border-b pb-2 mb-4 text-sm uppercase">4. Registro Fotográfico</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <SubidorImagen titulo="📸 1. Foto de Presentación (Ficha)" urlActual={fotoPresentacion} alSubir={setFotoPresentacion} />
                      <SubidorImagen titulo="⚖️ 2. Foto en la Pesa (Interna)" urlActual={fotoPeso} alSubir={setFotoPeso} />
                      <SubidorImagen titulo="🎨 3. Foto de Venta (Editada)" urlActual={fotoVenta} alSubir={setFotoVenta} />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <div className="bg-gray-100 border-t p-4 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setAbierto(false)} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-100 font-bold text-sm">Cancelar</button>
              <button type="submit" form="form-joya" disabled={cargando} className="px-6 py-2 bg-slate-900 text-white rounded-lg shadow-sm hover:bg-slate-800 font-bold text-sm disabled:bg-slate-400">
                {cargando ? 'Guardando...' : '💾 Guardar Joya y Stock'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}