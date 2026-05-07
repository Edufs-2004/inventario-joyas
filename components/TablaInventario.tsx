"use client"

import { useState } from 'react'
import { Modelo, VarianteStock, GemaJoya } from '../types/database'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { CATEGORIAS_JOYAS, MATERIALES_JOYAS } from '../lib/constantes'
import SubidorImagen from './SubidorImagen'

export default function TablaInventario({ inventarioInicial }: { inventarioInicial: Modelo[] }) {
  const [filtro, setFiltro] = useState('Todas')
  
  // ESTADO PARA EL MENÚ LATERAL (NUEVO)
  const [sidebarAbierto, setSidebarAbierto] = useState(false)

  // ESTADOS FICHA PRINCIPAL
  const [joyaSeleccionada, setJoyaSeleccionada] = useState<Modelo | null>(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [formEdit, setFormEdit] = useState<Partial<Modelo>>({})
  const [guardando, setGuardando] = useState(false)

  const [variantes, setVariantes] = useState<VarianteStock[]>([])
  const [gemas, setGemas] = useState<GemaJoya[]>([])
  const [cargandoDatos, setCargandoDatos] = useState(false)
  
  const [nuevaVariante, setNuevaVariante] = useState({ medida: '', stock: 1, peso: '', costo: '', precio_venta: '' })
  const [nuevaGema, setNuevaGema] = useState({ nombre: '', medida: '' })
  const [guardandoVariante, setGuardandoVariante] = useState(false)

  const [idVarianteEditando, setIdVarianteEditando] = useState<string | null>(null)
  const [formVarianteEdit, setFormVarianteEdit] = useState<Partial<VarianteStock>>({})
  const [guardandoEdicionVariante, setGuardandoEdicionVariante] = useState(false)

  // ESTADOS PARA EL MODAL DE VENTA RÁPIDA
  const [joyaParaVender, setJoyaParaVender] = useState<Modelo | null>(null)
  const [tallasParaVender, setTallasParaVender] = useState<VarianteStock[]>([])
  const [cargandoTallasVenta, setCargandoTallasVenta] = useState(false)

  const router = useRouter()
  const joyasFiltradas = filtro === 'Todas' ? inventarioInicial : inventarioInicial.filter(j => j.categoria === filtro)
  const categoriasFiltro = ['Todas', ...CATEGORIAS_JOYAS]

  // ABRIR FICHA DETALLADA (CLICK EN LA FILA)
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

  // ABRIR MODAL RÁPIDO DE VENTA (CLICK EN BOTÓN VENDER)
  const abrirModalVenta = async (e: React.MouseEvent, joya: Modelo) => {
    e.stopPropagation() 
    setJoyaParaVender(joya)
    setTallasParaVender([])
    setCargandoTallasVenta(true)

    const { data } = await supabase.from('variantes_stock').select('*').eq('modelo_id', joya.id).order('created_at', { ascending: true })
    if (data) setTallasParaVender(data)
    setCargandoTallasVenta(false)
  }

  // EJECUTAR LA VENTA
  const iniciarVenta = async (v: VarianteStock) => {
    if (v.stock < 1) {
      alert("¡No hay stock de esta talla!")
      return
    }
    const confirmar = window.confirm(`¿Iniciar venta de talla ${v.medida} a $${v.precio_venta}?`)
    if (!confirmar) return

    const { error } = await supabase.from('registro_ventas').insert([{
      variante_id: v.id,
      estado: 'Negociando',
      costo_historico: v.costo,
      precio_lista_historico: v.precio_venta
    }])

    if (error) alert("Error al iniciar venta: " + error.message)
    else {
      alert("✅ Venta en proceso (Negociando).")
      setJoyaParaVender(null) 
    }
  }

  // GUARDAR EDICIÓN MAESTRA
  const guardarEdicion = async () => {
    if (!joyaSeleccionada) return
    setGuardando(true)
    const { error } = await supabase.from('modelos').update({
      nombre: formEdit.nombre, categoria: formEdit.categoria, tipo: formEdit.tipo, diametro: formEdit.diametro,
      foto_presentacion: formEdit.foto_presentacion, foto_peso: formEdit.foto_peso, foto_venta: formEdit.foto_venta
    }).eq('id', joyaSeleccionada.id)
    setGuardando(false)
    if (error) alert("Error al editar: " + error.message)
    else { setModoEdicion(false); setJoyaSeleccionada(null); router.refresh(); }
  }

  const agregarVariante = async (e: React.FormEvent) => {
    e.preventDefault(); if (!joyaSeleccionada) return; setGuardandoVariante(true)
    const { data, error } = await supabase.from('variantes_stock').insert([{ modelo_id: joyaSeleccionada.id, medida: nuevaVariante.medida, stock: Number(nuevaVariante.stock), peso: nuevaVariante.peso ? Number(nuevaVariante.peso) : null, costo: Number(nuevaVariante.costo), precio_venta: Number(nuevaVariante.precio_venta) }]).select()
    if (error) alert(error.message)
    else if (data) { setVariantes([...variantes, data[0]]); setNuevaVariante({ medida: '', stock: 1, peso: '', costo: '', precio_venta: '' }) }
    setGuardandoVariante(false)
  }

  const guardarEdicionVariante = async (id: string) => {
    setGuardandoEdicionVariante(true)
    const { data, error } = await supabase.from('variantes_stock').update({ medida: formVarianteEdit.medida, peso: formVarianteEdit.peso ? Number(formVarianteEdit.peso) : null, costo: Number(formVarianteEdit.costo), precio_venta: Number(formVarianteEdit.precio_venta), stock: Number(formVarianteEdit.stock) }).eq('id', id).select()
    if (error) alert(error.message)
    else if (data) { setVariantes(variantes.map(v => v.id === id ? data[0] : v)); setIdVarianteEditando(null) }
    setGuardandoEdicionVariante(false)
  }

  const agregarGemaExtra = async (e: React.FormEvent) => {
    e.preventDefault(); if (!joyaSeleccionada) return
    const { data, error } = await supabase.from('gemas_joya').insert([{ modelo_id: joyaSeleccionada.id, nombre: nuevaGema.nombre, medida: nuevaGema.medida }]).select()
    if (error) alert(error.message)
    else if (data) { setGemas([...gemas, data[0]]); setNuevaGema({ nombre: '', medida: '' }) }
  }

  const eliminarGema = async (idGema: string) => {
    if (!window.confirm("¿Borrar gema?")) return
    const { error } = await supabase.from('gemas_joya').delete().eq('id', idGema)
    if (!error) setGemas(gemas.filter(g => g.id !== idGema))
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden w-full relative">
      
      {/* CAPA OSCURA PARA MÓVIL CUANDO EL MENÚ ESTÁ ABIERTO */}
      {sidebarAbierto && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarAbierto(false)}
        />
      )}

      {/* MENÚ LATERAL (SIDEBAR) */}
      <aside className={`bg-slate-900 text-white transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-50 md:relative ${sidebarAbierto ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          {sidebarAbierto && <h2 className="font-bold text-amber-400 text-xl whitespace-nowrap">Eos Joyas</h2>}
          <button onClick={() => setSidebarAbierto(!sidebarAbierto)} className="p-2 hover:bg-slate-800 rounded-lg hidden md:block">
            {sidebarAbierto ? '⬅️' : '☰'}
          </button>
          <button onClick={() => setSidebarAbierto(false)} className="p-2 hover:bg-slate-800 rounded-lg md:hidden text-xl">
            ✖
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-4 mt-4">
          <button onClick={() => { router.push('/'); setSidebarAbierto(false); }} className="w-full flex items-center gap-4 p-3 rounded-xl bg-amber-500 text-white font-bold transition-all">
            <span className="text-xl">📦</span>
            {sidebarAbierto && <span>Inventario</span>}
          </button>
          <button onClick={() => { router.push('/ventas'); setSidebarAbierto(false); }} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800 text-slate-400 transition-all">
            <span className="text-xl">📊</span>
            {sidebarAbierto && <span>Panel de Ventas</span>}
          </button>
          <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed transition-all">
            <span className="text-xl">💰</span>
            {sidebarAbierto && <span>Contabilidad</span>}
          </button>
        </nav>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto w-full p-4 md:p-8">
        
        {/* BOTÓN HAMBURGUESA PARA MÓVIL */}
        <div className="md:hidden flex items-center mb-6">
          <button 
            onClick={() => setSidebarAbierto(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg shadow-md font-bold text-sm"
          >
            ☰ Menú
          </button>
        </div>

        {/* FILTROS (Deslizables en celular) */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {categoriasFiltro.map(cat => (
            <button key={cat} onClick={() => setFiltro(cat)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${filtro === cat ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* TABLA PRINCIPAL (Responsiva) */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-sm uppercase">
                <th className="p-3 md:p-4 border-b w-16 text-center">Foto</th>
                <th className="p-3 md:p-4 border-b w-12 text-center">N°</th>
                <th className="p-3 md:p-4 border-b">Nombre</th>
                <th className="p-3 md:p-4 border-b">Etiquetas</th>
                <th className="p-3 md:p-4 border-b hidden lg:table-cell">Diámetro</th>
                <th className="p-3 md:p-4 border-b hidden xl:table-cell text-center">Peso</th>
                <th className="p-3 md:p-4 border-b text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {joyasFiltradas.map((joya, index) => (
                <tr key={joya.id} onClick={() => abrirFicha(joya)} className="hover:bg-amber-50 cursor-pointer transition-colors border-b last:border-0">
                  <td className="p-2 md:p-3 text-center">
                    {joya.foto_presentacion ? (
                      <img src={joya.foto_presentacion} alt="mini" className="w-10 h-10 md:w-12 md:h-12 object-cover rounded shadow-sm border mx-auto" />
                    ) : <span className="text-xl md:text-2xl opacity-50">💎</span>}
                  </td>
                  
                  {/* N° DINÁMICO */}
                  <td className="p-3 md:p-4 text-center font-bold text-amber-600">
                    {index + 1}
                  </td>

                  <td className="p-3 md:p-4 font-bold text-gray-900 text-sm md:text-base">{joya.nombre}</td>
                  
                  {/* ETIQUETAS UNIFICADAS (Categoría y Material) */}
                  <td className="p-3 md:p-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-slate-200 text-slate-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-slate-300">
                        {joya.categoria}
                      </span>
                      {joya.tipo && (
                        <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-[10px] font-bold uppercase border border-amber-200">
                          {joya.tipo}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* DIÁMETRO */}
                  <td className="p-3 md:p-4 text-gray-600 hidden lg:table-cell text-sm">
                    {joya.diametro || '-'}
                  </td>

                  {/* PESO (Indicador de ver tallas) */}
                  <td className="p-3 md:p-4 text-gray-600 hidden xl:table-cell text-center">
                    <span className="text-[10px] text-gray-400 italic bg-gray-50 px-2 py-1 rounded border border-gray-200">Ver tallas</span>
                  </td>
                  
                  <td className="p-3 md:p-4 text-right">
                    <button onClick={(e) => abrirModalVenta(e, joya)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold shadow-sm transition-colors">
                      🤝 Vender
                    </button>
                  </td>
                </tr>
              ))}
              {joyasFiltradas.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">No hay productos.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: VENTA RÁPIDA (Se abre al apretar "🤝 Vender" en la tabla) */}
      {/* ========================================================================= */}
      {joyaParaVender && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-end sm:items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up sm:animate-none">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold text-amber-400 truncate pr-4">Vender: {joyaParaVender.nombre}</h2>
              <button onClick={() => setJoyaParaVender(null)} className="text-slate-400 hover:text-white text-2xl">✖</button>
            </div>
            
            <div className="p-4 bg-gray-50 max-h-[60vh] overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-600 uppercase mb-3">Selecciona la talla a vender:</h3>
              
              {cargandoTallasVenta ? (
                <p className="text-center text-gray-500 py-4">Buscando stock...</p>
              ) : tallasParaVender.length === 0 ? (
                <div className="text-center bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-red-600 font-bold mb-1">Sin Tallas</p>
                  <p className="text-xs text-red-500">Abre la ficha del producto para agregar stock primero.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tallasParaVender.map(talla => (
                    <div key={talla.id} className={`flex justify-between items-center p-3 rounded-xl border ${talla.stock > 0 ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">Talla {talla.medida}</p>
                        <p className="text-xs text-gray-500">Stock actual: {talla.stock} | Precio: <span className="text-green-600 font-bold">${talla.precio_venta}</span></p>
                      </div>
                      <button 
                        onClick={() => iniciarVenta(talla)}
                        disabled={talla.stock < 1}
                        className={`px-4 py-2 rounded-lg text-sm font-bold ${talla.stock > 0 ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-600 hover:text-white' : 'bg-gray-200 text-gray-400'}`}
                      >
                        {talla.stock > 0 ? 'Iniciar' : 'Agotado'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FICHA DETALLADA (Se abre al hacer click en la fila) */}
      {/* ========================================================================= */}
      {joyaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh]">
            
            <div className="bg-slate-900 p-4 sm:p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl sm:text-3xl font-bold text-amber-400 truncate max-w-[200px] sm:max-w-md">{modoEdicion ? 'Editando Producto' : joyaSeleccionada.nombre}</h2>
                {!modoEdicion && (
                  <div className="flex gap-2 mt-1 sm:mt-2 text-xs sm:text-sm text-slate-300">
                    <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{joyaSeleccionada.categoria}</span>
                  </div>
                )}
              </div>
              <button onClick={() => setJoyaSeleccionada(null)} className="text-slate-400 hover:text-white text-2xl sm:text-3xl">✖</button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-gray-50">
              
              {modoEdicion ? (
                /* MODO EDICIÓN */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm border">
                    <h3 className="font-bold text-gray-800 border-b pb-2">Modificar Datos Principales</h3>
                    <div><label className="block text-sm font-bold text-gray-500 uppercase">Nombre</label><input type="text" value={formEdit.nombre} onChange={e => setFormEdit({...formEdit, nombre: e.target.value})} className="w-full border p-2 rounded mt-1" /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-bold text-gray-500 uppercase">Categoría</label><select value={formEdit.categoria} onChange={e => setFormEdit({...formEdit, categoria: e.target.value})} className="w-full border p-2 rounded mt-1 bg-white">{CATEGORIAS_JOYAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                      <div><label className="block text-sm font-bold text-gray-500 uppercase">Material</label><select value={formEdit.tipo || ''} onChange={e => setFormEdit({...formEdit, tipo: e.target.value})} className="w-full border p-2 rounded mt-1 bg-white">{MATERIALES_JOYAS.map(mat => <option key={mat} value={mat}>{mat}</option>)}</select></div>
                    </div>
                    <div><label className="block text-sm font-bold text-gray-500 uppercase">Diámetro / Base</label><input type="text" value={formEdit.diametro || ''} onChange={e => setFormEdit({...formEdit, diametro: e.target.value})} className="w-full border p-2 rounded mt-1" /></div>
                  </div>

                  <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm border">
                    <h3 className="font-bold text-gray-800 border-b pb-2">Modificar / Agregar Fotos</h3>
                    <SubidorImagen titulo="📸 1. Foto de Presentación" urlActual={formEdit.foto_presentacion} alSubir={(url) => setFormEdit({...formEdit, foto_presentacion: url})} />
                    <SubidorImagen titulo="⚖️ 2. Foto en la Pesa" urlActual={formEdit.foto_peso} alSubir={(url) => setFormEdit({...formEdit, foto_peso: url})} />
                    <SubidorImagen titulo="🎨 3. Foto de Venta" urlActual={formEdit.foto_venta} alSubir={(url) => setFormEdit({...formEdit, foto_venta: url})} />
                  </div>
                </div>
              ) : (
                <>
                  {/* MODO VISTA FICHA */}
                  <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-2 gap-2">
                      <h3 className="text-lg font-bold text-gray-800">📸 Registro Fotográfico</h3>
                      <button onClick={() => setModoEdicion(true)} className="px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded shadow hover:bg-blue-700 w-full sm:w-auto">✏️ Editar Datos o Fotos</button>
                    </div>
                    
                    <div className="flex sm:grid sm:grid-cols-3 gap-4 overflow-x-auto pb-2 snap-x">
                      <div className="border rounded bg-gray-100 flex flex-col items-center justify-between p-2 min-w-[200px] snap-center"><span className="text-xs font-bold text-gray-500 mb-2 uppercase">Presentación</span>{joyaSeleccionada.foto_presentacion ? <><img src={joyaSeleccionada.foto_presentacion} alt="Presentación" className="w-full h-32 sm:h-48 object-contain bg-white border rounded" /><a href={joyaSeleccionada.foto_presentacion} target="_blank" download className="mt-2 text-blue-600 font-bold text-xs hover:underline">📥 Descargar</a></> : <span className="h-32 sm:h-48 flex items-center text-gray-400 text-xs">Sin foto</span>}</div>
                      <div className="border rounded bg-gray-100 flex flex-col items-center justify-between p-2 min-w-[200px] snap-center"><span className="text-xs font-bold text-gray-500 mb-2 uppercase">Pesa</span>{joyaSeleccionada.foto_peso ? <><img src={joyaSeleccionada.foto_peso} alt="Peso" className="w-full h-32 sm:h-48 object-contain bg-white border rounded" /><a href={joyaSeleccionada.foto_peso} target="_blank" download className="mt-2 text-blue-600 font-bold text-xs hover:underline">📥 Descargar</a></> : <span className="h-32 sm:h-48 flex items-center text-gray-400 text-xs">Sin foto</span>}</div>
                      <div className="border rounded bg-amber-50 flex flex-col items-center justify-between p-2 border-amber-200 min-w-[200px] snap-center"><span className="text-xs font-bold text-amber-700 mb-2 uppercase">Material Venta</span>{joyaSeleccionada.foto_venta ? <><img src={joyaSeleccionada.foto_venta} alt="Venta" className="w-full h-32 sm:h-48 object-contain bg-white border rounded" /><a href={joyaSeleccionada.foto_venta} target="_blank" download className="mt-2 text-amber-600 font-bold text-xs hover:underline">📥 Descargar</a></> : <span className="h-32 sm:h-48 flex items-center text-amber-400 text-xs">Falta foto</span>}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* GEMAS */}
                    <div className="xl:col-span-1 bg-white p-4 rounded-xl shadow-sm border h-fit">
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
                        <div className="flex gap-2">
                          <input type="text" required value={nuevaGema.nombre} onChange={e => setNuevaGema({...nuevaGema, nombre: e.target.value})} placeholder="Nueva Gema" className="w-full border p-2 text-xs rounded" />
                          <input type="text" required value={nuevaGema.medida} onChange={e => setNuevaGema({...nuevaGema, medida: e.target.value})} placeholder="mm" className="w-16 border p-2 text-xs rounded" />
                          <button type="submit" className="bg-amber-600 text-white px-3 py-2 rounded text-xs font-bold hover:bg-amber-700">+</button>
                        </div>
                      </form>
                    </div>

                    {/* TALLAS Y STOCK */}
                    <div className="xl:col-span-2 bg-white p-4 rounded-xl shadow-sm border h-fit">
                      <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">📦 Control de Variantes y Stock</h3>
                      <div className="overflow-x-auto mb-6 scrollbar-hide">
                        <table className="w-full min-w-[500px] text-left text-sm border">
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
                                        <button onClick={() => guardarEdicionVariante(v.id)} disabled={guardandoEdicionVariante} className="text-green-600 font-bold">💾</button>
                                        <button onClick={() => setIdVarianteEditando(null)} className="text-red-600 font-bold">✖</button>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="p-2 border-b font-bold">{v.medida}</td>
                                      <td className="p-2 border-b">{v.peso ? `${v.peso}g` : '-'}</td>
                                      <td className="p-2 border-b text-red-600">${v.costo}</td>
                                      <td className="p-2 border-b text-green-600 font-bold">${v.precio_venta}</td>
                                      <td className="p-2 border-b text-center"><span className={`px-2 py-1 rounded-full font-bold text-xs ${v.stock > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{v.stock}</span></td>
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

                      <form onSubmit={agregarVariante} className="bg-slate-50 p-3 sm:p-4 rounded-lg border border-slate-200">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-700 mb-2 uppercase">➕ Agregar Stock</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          <div><label className="block text-[10px] text-slate-500">Talla</label><input type="text" required value={nuevaVariante.medida} onChange={e => setNuevaVariante({...nuevaVariante, medida: e.target.value})} className="w-full border p-1.5 rounded text-xs" /></div>
                          <div><label className="block text-[10px] text-slate-500">Peso (g)</label><input type="number" step="0.01" value={nuevaVariante.peso} onChange={e => setNuevaVariante({...nuevaVariante, peso: e.target.value})} className="w-full border p-1.5 rounded text-xs" /></div>
                          <div><label className="block text-[10px] text-slate-500">Costo ($)</label><input type="number" required value={nuevaVariante.costo} onChange={e => setNuevaVariante({...nuevaVariante, costo: e.target.value})} className="w-full border p-1.5 rounded text-xs" /></div>
                          <div><label className="block text-[10px] text-slate-500">Precio ($)</label><input type="number" required value={nuevaVariante.precio_venta} onChange={e => setNuevaVariante({...nuevaVariante, precio_venta: e.target.value})} className="w-full border p-1.5 rounded text-xs" /></div>
                          <div><label className="block text-[10px] text-slate-500">Unidades</label><input type="number" required min="1" value={nuevaVariante.stock} onChange={e => setNuevaVariante({...nuevaVariante, stock: Number(e.target.value)})} className="w-full border p-1.5 rounded text-xs" /></div>
                        </div>
                        <div className="mt-3 text-right"><button type="submit" disabled={guardandoVariante} className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800">Guardar Talla</button></div>
                      </form>
                    </div>
                  </div>
                </>
              )}
            </div>

            {modoEdicion && (
              <div className="bg-gray-100 p-4 flex justify-end gap-3 border-t">
                <button onClick={() => setModoEdicion(false)} className="px-4 py-2 bg-white border rounded shadow-sm font-bold text-gray-600 text-sm">Cancelar</button>
                <button onClick={guardarEdicion} disabled={guardando} className="px-4 py-2 bg-green-600 text-white rounded shadow-sm font-bold hover:bg-green-700 text-sm">💾 Guardar Cambios</button>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  )
}