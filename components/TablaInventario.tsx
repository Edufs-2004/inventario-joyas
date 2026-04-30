"use client"

import { useState } from 'react'
import { Modelo, VarianteStock, GemaJoya } from '../types/database'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { CATEGORIAS_JOYAS, MATERIALES_JOYAS } from '../lib/constantes'
import SubidorImagen from './SubidorImagen'

export default function TablaInventario({ inventarioInicial }: { inventarioInicial: Modelo[] }) {
  const [filtro, setFiltro] = useState('Todas')
  const [joyaSeleccionada, setJoyaSeleccionada] = useState<Modelo | null>(null)
  
  // ESTADOS MODO EDICIÓN MAESTRO
  const [modoEdicion, setModoEdicion] = useState(false)
  const [formEdit, setFormEdit] = useState<Partial<Modelo>>({})
  const [guardando, setGuardando] = useState(false)

  // ESTADOS DE TALLAS Y GEMAS
  const [variantes, setVariantes] = useState<VarianteStock[]>([])
  const [gemas, setGemas] = useState<GemaJoya[]>([])
  const [cargandoDatos, setCargandoDatos] = useState(false)
  
  // ESTADOS AGREGAR
  const [nuevaVariante, setNuevaVariante] = useState({ medida: '', stock: 1, peso: '', costo: '', precio_venta: '' })
  const [nuevaGema, setNuevaGema] = useState({ nombre: '', medida: '' })
  const [guardandoVariante, setGuardandoVariante] = useState(false)

  // ESTADOS EDITAR TALLAS
  const [idVarianteEditando, setIdVarianteEditando] = useState<string | null>(null)
  const [formVarianteEdit, setFormVarianteEdit] = useState<Partial<VarianteStock>>({})
  const [guardandoEdicionVariante, setGuardandoEdicionVariante] = useState(false)

  const router = useRouter()
  const joyasFiltradas = filtro === 'Todas' ? inventarioInicial : inventarioInicial.filter(j => j.categoria === filtro)
  const categoriasFiltro = ['Todas', ...CATEGORIAS_JOYAS]

  // ABRIR FICHA Y CARGAR DATOS
  const abrirFicha = async (joya: Modelo) => {
    setJoyaSeleccionada(joya)
    setFormEdit(joya)
    setModoEdicion(false)
    setIdVarianteEditando(null)
    setVariantes([])
    setGemas([])
    setCargandoDatos(true)
    
    const [reqVariantes, reqGemas] = await Promise.all([
      supabase.from('variantes_stock').select('*').eq('modelo_id', joya.id).order('created_at', { ascending: true }),
      supabase.from('gemas_joya').select('*').eq('modelo_id', joya.id)
    ])
    
    if (reqVariantes.data) setVariantes(reqVariantes.data)
    if (reqGemas.data) setGemas(reqGemas.data)
    setCargandoDatos(false)
  }

  // GUARDAR MAESTRO (INCLUYENDO FOTOS)
  const guardarEdicion = async () => {
    if (!joyaSeleccionada) return
    setGuardando(true)

    const { error } = await supabase.from('modelos').update({
      nombre: formEdit.nombre,
      categoria: formEdit.categoria,
      tipo: formEdit.tipo,
      diametro: formEdit.diametro,
      foto_presentacion: formEdit.foto_presentacion,
      foto_peso: formEdit.foto_peso,
      foto_venta: formEdit.foto_venta
    }).eq('id', joyaSeleccionada.id)

    setGuardando(false)

    if (error) alert("Error al editar: " + error.message)
    else {
      setModoEdicion(false)
      setJoyaSeleccionada(null) 
      router.refresh() 
    }
  }

  // GESTIÓN DE TALLAS (CREAR Y EDITAR)
  const agregarVariante = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joyaSeleccionada) return
    setGuardandoVariante(true)
    const { data, error } = await supabase.from('variantes_stock').insert([{
      modelo_id: joyaSeleccionada.id,
      medida: nuevaVariante.medida,
      stock: Number(nuevaVariante.stock),
      peso: nuevaVariante.peso ? Number(nuevaVariante.peso) : null,
      costo: Number(nuevaVariante.costo),
      precio_venta: Number(nuevaVariante.precio_venta)
    }]).select()

    if (error) alert("Error: " + error.message)
    else if (data) {
      setVariantes([...variantes, data[0]])
      setNuevaVariante({ medida: '', stock: 1, peso: '', costo: '', precio_venta: '' })
    }
    setGuardandoVariante(false)
  }

  const guardarEdicionVariante = async (id: string) => {
    setGuardandoEdicionVariante(true)
    const { data, error } = await supabase.from('variantes_stock').update({
      medida: formVarianteEdit.medida,
      peso: formVarianteEdit.peso ? Number(formVarianteEdit.peso) : null,
      costo: Number(formVarianteEdit.costo),
      precio_venta: Number(formVarianteEdit.precio_venta),
      stock: Number(formVarianteEdit.stock)
    }).eq('id', id).select()

    if (error) alert("Error: " + error.message)
    else if (data) {
      setVariantes(variantes.map(v => v.id === id ? data[0] : v))
      setIdVarianteEditando(null)
    }
    setGuardandoEdicionVariante(false)
  }

  // GESTIÓN DE GEMAS (CREAR Y ELIMINAR)
  const agregarGemaExtra = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joyaSeleccionada) return
    const { data, error } = await supabase.from('gemas_joya').insert([{ modelo_id: joyaSeleccionada.id, nombre: nuevaGema.nombre, medida: nuevaGema.medida }]).select()
    if (error) alert(error.message)
    else if (data) { setGemas([...gemas, data[0]]); setNuevaGema({ nombre: '', medida: '' }) }
  }

  const eliminarGema = async (idGema: string) => {
    const confirmar = window.confirm("¿Seguro que quieres borrar esta gema?")
    if (!confirmar) return
    const { error } = await supabase.from('gemas_joya').delete().eq('id', idGema)
    if (!error) setGemas(gemas.filter(g => g.id !== idGema))
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categoriasFiltro.map(cat => (
          <button key={cat} onClick={() => setFiltro(cat)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${filtro === cat ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-sm uppercase">
              <th className="p-4 border-b w-16">Foto</th>
              <th className="p-4 border-b">N°</th>
              <th className="p-4 border-b">Nombre</th>
              <th className="p-4 border-b">Categoría</th>
              <th className="p-4 border-b">Material</th>
            </tr>
          </thead>
          <tbody>
            {joyasFiltradas.map((joya, index) => (
              <tr key={joya.id} onClick={() => abrirFicha(joya)} className="hover:bg-amber-50 cursor-pointer transition-colors">
                <td className="p-3 border-b text-center">
                  {joya.foto_presentacion ? (
                    <img src={joya.foto_presentacion} alt="mini" className="w-10 h-10 object-cover rounded shadow-sm border" />
                  ) : <span className="text-2xl opacity-50">💎</span>}
                </td>
                <td className="p-4 border-b font-bold text-amber-600">{index + 1}</td>
                <td className="p-4 border-b font-medium text-gray-900">{joya.nombre}</td>
                <td className="p-4 border-b text-gray-600"><span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-semibold border border-gray-200">{joya.categoria}</span></td>
                <td className="p-4 border-b text-gray-600">{joya.tipo || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {joyaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh]">
            
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-amber-400">{modoEdicion ? 'Editando Producto' : joyaSeleccionada.nombre}</h2>
                {!modoEdicion && (
                  <div className="flex gap-3 mt-2 text-sm text-slate-300">
                    <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{joyaSeleccionada.categoria}</span>
                    <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{joyaSeleccionada.tipo}</span>
                  </div>
                )}
              </div>
              <button onClick={() => setJoyaSeleccionada(null)} className="text-slate-400 hover:text-white text-3xl">✖</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              
              {modoEdicion ? (
                /* =================== MODO EDICIÓN MAESTRO =================== */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm border">
                    <h3 className="font-bold text-gray-800 border-b pb-2">Modificar Datos Principales</h3>
                    <div>
                      <label className="block text-sm font-bold text-gray-500 uppercase">Nombre</label>
                      <input type="text" value={formEdit.nombre} onChange={e => setFormEdit({...formEdit, nombre: e.target.value})} className="w-full border p-2 rounded mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-500 uppercase">Categoría</label>
                        <select value={formEdit.categoria} onChange={e => setFormEdit({...formEdit, categoria: e.target.value})} className="w-full border p-2 rounded mt-1 bg-white">
                          {CATEGORIAS_JOYAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-500 uppercase">Material</label>
                        <select value={formEdit.tipo || ''} onChange={e => setFormEdit({...formEdit, tipo: e.target.value})} className="w-full border p-2 rounded mt-1 bg-white">
                          {MATERIALES_JOYAS.map(mat => <option key={mat} value={mat}>{mat}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-500 uppercase">Diámetro / Base</label>
                      <input type="text" value={formEdit.diametro || ''} onChange={e => setFormEdit({...formEdit, diametro: e.target.value})} className="w-full border p-2 rounded mt-1" />
                    </div>
                  </div>

                  <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm border">
                    <h3 className="font-bold text-gray-800 border-b pb-2">Modificar / Agregar Fotos</h3>
                    <SubidorImagen titulo="📸 1. Foto de Presentación" urlActual={formEdit.foto_presentacion} alSubir={(url) => setFormEdit({...formEdit, foto_presentacion: url})} />
                    <SubidorImagen titulo="⚖️ 2. Foto en la Pesa" urlActual={formEdit.foto_peso} alSubir={(url) => setFormEdit({...formEdit, foto_peso: url})} />
                    <SubidorImagen titulo="🎨 3. Foto de Venta (Canva)" urlActual={formEdit.foto_venta} alSubir={(url) => setFormEdit({...formEdit, foto_venta: url})} />
                  </div>
                </div>
              ) : (
                /* =================== MODO VISTA FICHA =================== */
                <>
                  <div className="mb-8 bg-white p-4 rounded-xl shadow-sm border">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex justify-between items-center">
                      <span>📸 Registro Fotográfico</span>
                      <button onClick={() => setModoEdicion(true)} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded shadow hover:bg-blue-700">
                        ✏️ Editar Datos o Subir Fotos
                      </button>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded bg-gray-100 flex flex-col items-center justify-between p-2">
                        <span className="text-xs font-bold text-gray-500 mb-2 uppercase">Presentación</span>
                        {joyaSeleccionada.foto_presentacion ? (
                          <><img src={joyaSeleccionada.foto_presentacion} alt="Presentación" className="w-full h-48 object-contain bg-white border rounded" /><a href={joyaSeleccionada.foto_presentacion} target="_blank" download className="mt-2 text-blue-600 font-bold text-sm hover:underline">📥 Descargar</a></>
                        ) : <span className="h-48 flex items-center text-gray-400">Sin foto</span>}
                      </div>
                      <div className="border rounded bg-gray-100 flex flex-col items-center justify-between p-2">
                        <span className="text-xs font-bold text-gray-500 mb-2 uppercase">Registro en Pesa</span>
                        {joyaSeleccionada.foto_peso ? (
                          <><img src={joyaSeleccionada.foto_peso} alt="Peso" className="w-full h-48 object-contain bg-white border rounded" /><a href={joyaSeleccionada.foto_peso} target="_blank" download className="mt-2 text-blue-600 font-bold text-sm hover:underline">📥 Descargar</a></>
                        ) : <span className="h-48 flex items-center text-gray-400">Sin foto</span>}
                      </div>
                      <div className="border rounded bg-amber-50 flex flex-col items-center justify-between p-2 border-amber-200">
                        <span className="text-xs font-bold text-amber-700 mb-2 uppercase">Material de Venta</span>
                        {joyaSeleccionada.foto_venta ? (
                          <><img src={joyaSeleccionada.foto_venta} alt="Venta" className="w-full h-48 object-contain bg-white border rounded" /><a href={joyaSeleccionada.foto_venta} target="_blank" download className="mt-2 text-amber-600 font-bold text-sm hover:underline">📥 Descargar</a></>
                        ) : <span className="h-48 flex items-center text-amber-400 text-sm">Falta foto</span>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ZONA GEMAS */}
                    <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-sm border h-fit">
                      <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">💎 Gemas Registradas</h3>
                      {cargandoDatos ? <p className="text-sm text-gray-500">Cargando...</p> : (
                        <ul className="space-y-2 mb-4">
                          {gemas.length === 0 ? <p className="text-sm text-gray-400 italic">No tiene gemas.</p> : 
                            gemas.map(g => (
                              <li key={g.id} className="flex justify-between items-center p-2 bg-amber-50 rounded border border-amber-100 text-sm">
                                <div><span className="font-bold text-amber-900 block">{g.nombre}</span><span className="text-amber-700 text-xs">{g.medida}</span></div>
                                <button onClick={() => eliminarGema(g.id)} className="text-red-500 hover:text-red-700 font-bold px-2">✖</button>
                              </li>
                            ))
                          }
                        </ul>
                      )}
                      <form onSubmit={agregarGemaExtra} className="mt-4 pt-3 border-t flex flex-col gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Añadir Gema</span>
                        <div className="flex gap-2">
                          <input type="text" required value={nuevaGema.nombre} onChange={e => setNuevaGema({...nuevaGema, nombre: e.target.value})} placeholder="Gema" className="w-full border p-1.5 text-xs rounded" />
                          <input type="text" required value={nuevaGema.medida} onChange={e => setNuevaGema({...nuevaGema, medida: e.target.value})} placeholder="mm" className="w-16 border p-1.5 text-xs rounded" />
                          <button type="submit" className="bg-amber-600 text-white px-2 py-1.5 rounded text-xs font-bold hover:bg-amber-700">+</button>
                        </div>
                      </form>
                    </div>

                    {/* ZONA TALLAS Y STOCK */}
                    <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border h-fit">
                      <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">📦 Control de Variantes y Stock</h3>
                      <div className="overflow-x-auto mb-6">
                        <table className="w-full text-left text-sm border min-w-full">
                          <thead className="bg-gray-100 text-gray-600">
                            <tr>
                              <th className="p-2 border-b">Talla</th>
                              <th className="p-2 border-b">Peso</th>
                              <th className="p-2 border-b">Costo</th>
                              <th className="p-2 border-b">Precio</th>
                              <th className="p-2 border-b text-center">Stock</th>
                              <th className="p-2 border-b text-center">Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cargandoDatos ? <tr><td colSpan={6} className="p-4 text-center">Cargando...</td></tr> : 
                              variantes.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-gray-400">Sin tallas registradas.</td></tr> : 
                              variantes.map(v => (
                                <tr key={v.id} className="hover:bg-gray-50">
                                  {idVarianteEditando === v.id ? (
                                    <>
                                      <td className="p-1 border-b"><input type="text" value={formVarianteEdit.medida} onChange={e => setFormVarianteEdit({...formVarianteEdit, medida: e.target.value})} className="w-full border p-1 rounded text-xs" /></td>
                                      <td className="p-1 border-b"><input type="number" step="0.01" value={formVarianteEdit.peso || ''} onChange={e => setFormVarianteEdit({...formVarianteEdit, peso: Number(e.target.value)})} className="w-full border p-1 rounded text-xs" /></td>
                                      <td className="p-1 border-b"><input type="number" value={formVarianteEdit.costo} onChange={e => setFormVarianteEdit({...formVarianteEdit, costo: Number(e.target.value)})} className="w-full border p-1 rounded text-xs" /></td>
                                      <td className="p-1 border-b"><input type="number" value={formVarianteEdit.precio_venta} onChange={e => setFormVarianteEdit({...formVarianteEdit, precio_venta: Number(e.target.value)})} className="w-full border p-1 rounded text-xs" /></td>
                                      <td className="p-1 border-b"><input type="number" value={formVarianteEdit.stock} onChange={e => setFormVarianteEdit({...formVarianteEdit, stock: Number(e.target.value)})} className="w-full border p-1 rounded text-xs text-center" /></td>
                                      <td className="p-1 border-b text-center space-x-2">
                                        <button onClick={() => guardarEdicionVariante(v.id)} disabled={guardandoEdicionVariante} className="text-green-600 hover:text-green-800 font-bold">💾</button>
                                        <button onClick={() => setIdVarianteEditando(null)} className="text-red-600 hover:text-red-800 font-bold">✖</button>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="p-2 border-b font-bold">{v.medida}</td>
                                      <td className="p-2 border-b">{v.peso ? `${v.peso}g` : '-'}</td>
                                      <td className="p-2 border-b text-red-600">${v.costo}</td>
                                      <td className="p-2 border-b text-green-600 font-bold">${v.precio_venta}</td>
                                      <td className="p-2 border-b text-center"><span className="px-2 py-1 bg-slate-100 rounded-full font-bold">{v.stock}</span></td>
                                      <td className="p-2 border-b text-center">
                                        <button onClick={() => { setIdVarianteEditando(v.id); setFormVarianteEdit(v); }} className="text-blue-500 hover:text-blue-700 text-xs font-bold underline">Editar</button>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))
                            }
                          </tbody>
                        </table>
                      </div>

                      <form onSubmit={agregarVariante} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase">➕ Ingresar Nueva Talla</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div><label className="block text-xs text-slate-500 mb-1">Talla</label><input type="text" required value={nuevaVariante.medida} onChange={e => setNuevaVariante({...nuevaVariante, medida: e.target.value})} className="w-full border p-2 rounded text-sm" /></div>
                          <div><label className="block text-xs text-slate-500 mb-1">Peso (g)</label><input type="number" step="0.01" value={nuevaVariante.peso} onChange={e => setNuevaVariante({...nuevaVariante, peso: e.target.value})} className="w-full border p-2 rounded text-sm" /></div>
                          <div><label className="block text-xs text-slate-500 mb-1">Costo ($)</label><input type="number" required value={nuevaVariante.costo} onChange={e => setNuevaVariante({...nuevaVariante, costo: e.target.value})} className="w-full border p-2 rounded text-sm" /></div>
                          <div><label className="block text-xs text-slate-500 mb-1">Precio ($)</label><input type="number" required value={nuevaVariante.precio_venta} onChange={e => setNuevaVariante({...nuevaVariante, precio_venta: e.target.value})} className="w-full border p-2 rounded text-sm" /></div>
                          <div><label className="block text-xs text-slate-500 mb-1">Stock</label><input type="number" required min="1" value={nuevaVariante.stock} onChange={e => setNuevaVariante({...nuevaVariante, stock: Number(e.target.value)})} className="w-full border p-2 rounded text-sm" /></div>
                        </div>
                        <div className="mt-3 text-right"><button type="submit" disabled={guardandoVariante} className="px-4 py-2 bg-slate-900 text-white rounded text-sm hover:bg-slate-800">Agregar Stock</button></div>
                      </form>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* BARRA INFERIOR DE GUARDADO (SOLO EN MODO EDICIÓN) */}
            {modoEdicion && (
              <div className="bg-gray-100 p-4 flex justify-end gap-3 border-t">
                <button onClick={() => setModoEdicion(false)} className="px-6 py-2 bg-white border rounded shadow-sm font-bold text-gray-600">Cancelar</button>
                <button onClick={guardarEdicion} disabled={guardando} className="px-6 py-2 bg-green-600 text-white rounded shadow-sm font-bold hover:bg-green-700">💾 Guardar Cambios Generales</button>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  )
}