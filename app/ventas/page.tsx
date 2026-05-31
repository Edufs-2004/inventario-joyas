"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function VentasYGestionPage() {
  const [pestaña, setPestaña] = useState<'ventas' | 'taller'>('ventas')
  
  const [ventas, setVentas] = useState<any[]>([])
  const [cargandoVentas, setCargandoVentas] = useState(true)

  // ESTADO PARA LA FICHA DEL CLIENTE
  const [ventaSeleccionada, setVentaSeleccionada] = useState<any | null>(null)
  const [guardandoFicha, setGuardandoFicha] = useState(false)

  const [tareas, setTareas] = useState<any[]>([])
  const [modelosInventario, setModelosInventario] = useState<any[]>([])
  const [cargandoTareas, setCargandoTareas] = useState(true)
  
  const [nuevaTarea, setNuevaTarea] = useState({ joya_nombre: '', tipo_trabajo: 'Reparación' })
  const [busquedaJoya, setBusquedaJoya] = useState('')
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [guardandoTarea, setGuardandoTarea] = useState(false)

  useEffect(() => {
    cargarVentas()
    cargarTareas()
    cargarModelos()
  }, [])

  const cargarVentas = async () => {
    setCargandoVentas(true)
    const { data, error } = await supabase
      .from('registro_ventas')
      .select('*, variantes_stock(medida, modelos(nombre))')
      .order('fecha_inicio', { ascending: false })
    
    if (error) alert("Error leyendo ventas: " + error.message)
    if (data) setVentas(data)
    setCargandoVentas(false)
  }

  const actualizarEstadoVenta = async (id: string, nuevoEstado: string) => {
    const actualizacion: any = { estado: nuevoEstado }
    if (nuevoEstado === 'Vendido' || nuevoEstado === 'Cancelado') {
      actualizacion.fecha_cierre = new Date().toISOString()
    }
    await supabase.from('registro_ventas').update(actualizacion).eq('id', id)
    cargarVentas()
  }

  const guardarFichaCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardandoFicha(true)
    
    const { error } = await supabase.from('registro_ventas').update({
      nombre_cliente: ventaSeleccionada.nombre_cliente,
      direccion_envio: ventaSeleccionada.direccion_envio,
      comuna: ventaSeleccionada.comuna,
      telefono_contacto: ventaSeleccionada.telefono_contacto,
      notas_internas: ventaSeleccionada.notas_internas,
      precio_final_efectivo: ventaSeleccionada.precio_final_efectivo ? Number(ventaSeleccionada.precio_final_efectivo) : null
    }).eq('id', ventaSeleccionada.id)

    setGuardandoFicha(false)
    if (error) {
      alert("Error guardando ficha: " + error.message)
    } else {
      setVentaSeleccionada(null)
      cargarVentas()
    }
  }

  const eliminarVenta = async (id: string) => {
    if(!window.confirm('¿Borrar esta venta por completo?')) return
    await supabase.from('registro_ventas').delete().eq('id', id)
    cargarVentas()
  }

  const cargarModelos = async () => {
    const { data } = await supabase.from('modelos').select('id, nombre, foto_presentacion').order('created_at', { ascending: false })
    if (data) setModelosInventario(data)
  }

  const cargarTareas = async () => {
    setCargandoTareas(true)
    const { data, error } = await supabase.from('tareas_taller').select('*').order('created_at', { ascending: false })
    if(error) alert("Error taller: " + error.message)
    if (data) setTareas(data)
    setCargandoTareas(false)
  }

  const agregarTarea = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaTarea.joya_nombre) return alert("Por favor, selecciona o escribe una joya.")
    setGuardandoTarea(true)
    await supabase.from('tareas_taller').insert([{ joya_nombre: nuevaTarea.joya_nombre, tipo_trabajo: nuevaTarea.tipo_trabajo, estado: 'Pendiente' }])
    setNuevaTarea({ joya_nombre: '', tipo_trabajo: 'Reparación' }); setBusquedaJoya(''); setGuardandoTarea(false)
    cargarTareas()
  }

  const moverTarea = async (id: string, nuevoEstado: string) => {
    if (nuevoEstado === 'Finalizado') {
      if(window.confirm('¿Marcar como finalizado? Esto borrará la tarea.')) {
        await supabase.from('tareas_taller').delete().eq('id', id)
      }
    } else {
      await supabase.from('tareas_taller').update({ estado: nuevoEstado }).eq('id', id)
    }
    cargarTareas()
  }

  return (
    <div className="p-4 md:p-10 bg-gray-50 min-h-screen relative">
      <div className="mb-6"><h1 className="text-3xl font-bold text-gray-800">Panel de Gestión 📋</h1><p className="text-gray-500 mt-1">Controla tus ventas, despachos y reparaciones del taller.</p></div>

      <div className="flex gap-4 mb-8 border-b pb-2 overflow-x-auto">
        <button onClick={() => setPestaña('ventas')} className={`px-6 py-2 rounded-t-lg font-bold transition-colors whitespace-nowrap ${pestaña === 'ventas' ? 'bg-slate-900 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>💰 Negociaciones y Despachos</button>
        <button onClick={() => setPestaña('taller')} className={`px-6 py-2 rounded-t-lg font-bold transition-colors whitespace-nowrap ${pestaña === 'taller' ? 'bg-amber-500 text-slate-900' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>🛠️ Cola de Taller</button>
      </div>

      {pestaña === 'ventas' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto pb-32">
          {cargandoVentas ? <p className="p-10 text-center text-gray-500">Cargando ventas...</p> : (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-sm uppercase whitespace-nowrap"><th className="p-4 border-b">Fecha</th><th className="p-4 border-b">Joya</th><th className="p-4 border-b">Cliente / Comuna</th><th className="p-4 border-b text-center">Estado Flujo</th><th className="p-4 border-b text-right">Acciones</th></tr>
              </thead>
              <tbody>
                {ventas.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-gray-400">No hay ventas registradas.</td></tr> : ventas.map(v => {
                  return (
                  <tr key={v.id} className="hover:bg-gray-50 border-b">
                    <td className="p-4 text-sm">
                      {v.fecha_cierre ? (
                        <span className="text-emerald-600 font-bold" title="Cerrada">C: {new Date(v.fecha_cierre).toLocaleDateString('es-CL')}</span>
                      ) : (
                        <span className="text-gray-500" title="Iniciada">I: {new Date(v.fecha_inicio).toLocaleDateString('es-CL')}</span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {v.variantes_stock?.modelos?.nombre || 'Joya Eliminada'} <span className="text-xs text-gray-400 font-normal ml-1">({v.variantes_stock?.medida || '-'})</span>
                    </td>
                    <td className="p-4 text-sm">
                      {v.nombre_cliente ? <span className="font-bold">{v.nombre_cliente}</span> : <span className="text-gray-400 italic">Sin datos</span>}
                      {v.comuna && <span className="block text-xs text-gray-500">{v.comuna}</span>}
                    </td>
                    <td className="p-4 text-center">
                      <select 
                        value={v.estado || 'Negociando'} 
                        onChange={(e) => actualizarEstadoVenta(v.id, e.target.value)} 
                        className={`text-xs font-bold px-3 py-1.5 rounded-full outline-none cursor-pointer border ${
                          v.estado === 'Vendido' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 
                          v.estado === 'Por enviar' ? 'bg-blue-100 text-blue-800 border-blue-300' : 
                          v.estado === 'Guardado' ? 'bg-purple-100 text-purple-800 border-purple-300' : 
                          v.estado === 'Cancelado' ? 'bg-red-100 text-red-800 border-red-300' : 
                          'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="Negociando">💬 Negociando</option>
                        <option value="Guardado">📦 Guardado</option>
                        <option value="Por enviar">🚚 Por enviar</option>
                        <option value="Vendido">✅ Vendido</option>
                        <option value="Cancelado">❌ Cancelado</option>
                      </select>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => setVentaSeleccionada(v)} className="bg-slate-900 text-white hover:bg-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">📝 Ficha Logística</button>
                      <button onClick={() => eliminarVenta(v.id)} className="text-red-500 hover:text-red-700 text-xs font-bold px-2">Borrar</button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MODAL: FICHA LOGÍSTICA DEL CLIENTE */}
      {ventaSeleccionada && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-amber-400">📦 Logística y Cierre de Trato</h2>
              <button onClick={() => setVentaSeleccionada(null)} className="text-slate-400 hover:text-white text-2xl">✖</button>
            </div>
            <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
              <form id="form-ficha" onSubmit={guardarFichaCliente} className="space-y-6">
                
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <h3 className="font-bold text-gray-700 border-b pb-2 mb-4 text-sm uppercase">Datos del Cliente y Despacho</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Nombre Completo</label><input type="text" value={ventaSeleccionada.nombre_cliente || ''} onChange={e => setVentaSeleccionada({...ventaSeleccionada, nombre_cliente: e.target.value})} className="w-full border p-2 rounded text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder="Ej: Juan Pérez" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Teléfono / WhatsApp</label><input type="text" value={ventaSeleccionada.telefono_contacto || ''} onChange={e => setVentaSeleccionada({...ventaSeleccionada, telefono_contacto: e.target.value})} className="w-full border p-2 rounded text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder="+56 9..." /></div>
                    <div className="sm:col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">Dirección de Envío</label><input type="text" value={ventaSeleccionada.direccion_envio || ''} onChange={e => setVentaSeleccionada({...ventaSeleccionada, direccion_envio: e.target.value})} className="w-full border p-2 rounded text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder="Calle, Número, Depto..." /></div>
                    <div className="sm:col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">Comuna</label><input type="text" value={ventaSeleccionada.comuna || ''} onChange={e => setVentaSeleccionada({...ventaSeleccionada, comuna: e.target.value})} className="w-full border p-2 rounded text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder="Ej: Puente Alto" /></div>
                  </div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
                  <h3 className="font-bold text-emerald-800 border-b border-emerald-200 pb-2 mb-4 text-sm uppercase">Cierre Financiero</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-emerald-700 mb-1">Precio Catálogo (Referencia)</label>
                      <input type="text" readOnly value={`$${ventaSeleccionada.precio_lista_historico}`} className="w-full border p-2 rounded text-sm bg-gray-100 text-gray-500 cursor-not-allowed font-bold" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-700 mb-1">Precio Final Pactado ($)</label>
                      <input type="number" value={ventaSeleccionada.precio_final_efectivo || ''} onChange={e => setVentaSeleccionada({...ventaSeleccionada, precio_final_efectivo: e.target.value})} className="w-full border border-emerald-300 p-2 rounded text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-bold bg-white text-emerald-700" placeholder="Monto real cobrado" />
                      <p className="text-[10px] text-emerald-600 mt-1">Este monto será el que vaya a la contabilidad.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase border-b pb-2">Notas Internas</label>
                  <textarea value={ventaSeleccionada.notas_internas || ''} onChange={e => setVentaSeleccionada({...ventaSeleccionada, notas_internas: e.target.value})} className="w-full border p-2 rounded text-sm outline-none focus:ring-2 focus:ring-amber-500 mt-2 min-h-[80px]" placeholder="Ej: Se envía por Starken el martes. Cliente pide cajita azul..." />
                </div>

              </form>
            </div>
            <div className="bg-gray-100 p-4 border-t flex justify-end gap-3 shrink-0">
              <button onClick={() => setVentaSeleccionada(null)} className="px-4 py-2 bg-white border rounded shadow-sm text-sm font-bold text-gray-600">Cancelar</button>
              <button type="submit" form="form-ficha" disabled={guardandoFicha} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-md text-sm font-bold">
                {guardandoFicha ? 'Guardando...' : '💾 Guardar Ficha'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== PESTAÑA TALLER (Queda igual) ===================== */}
      {pestaña === 'taller' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <form onSubmit={agregarTarea} className="bg-amber-50 p-6 rounded-2xl shadow-sm border border-amber-200">
              <h3 className="font-bold text-amber-800 border-b border-amber-200 pb-2 mb-4">➕ Enviar al Taller</h3>
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-amber-700 uppercase mb-1">Nombre de la Joya</label>
                  <input type="text" required placeholder="Buscar joya..." value={busquedaJoya} onChange={e => {setBusquedaJoya(e.target.value); setNuevaTarea({...nuevaTarea, joya_nombre: e.target.value}); setMostrarDropdown(true)}} onFocus={() => setMostrarDropdown(true)} onBlur={() => setTimeout(() => setMostrarDropdown(false), 200)} className="w-full bg-white border-none p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 shadow-inner" />
                  {mostrarDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                      {modelosInventario.filter(m => m.nombre.toLowerCase().includes(busquedaJoya.toLowerCase())).map(m => (
                        <div key={m.id} onClick={() => {setBusquedaJoya(m.nombre); setNuevaTarea({...nuevaTarea, joya_nombre: m.nombre}); setMostrarDropdown(false)}} className="flex items-center gap-3 p-3 hover:bg-amber-50 cursor-pointer border-b last:border-0 transition-colors">
                          {m.foto_presentacion ? <img src={m.foto_presentacion} alt="mini" className="w-10 h-10 object-cover rounded shadow-sm border border-gray-200" /> : <span className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded text-xl shadow-sm border border-gray-200">💎</span>}
                          <span className="text-sm font-bold text-gray-700">{m.nombre}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-700 uppercase mb-1">Trabajo a realizar</label>
                  <select value={nuevaTarea.tipo_trabajo} onChange={e => setNuevaTarea({...nuevaTarea, tipo_trabajo: e.target.value})} className="w-full border-none p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"><option value="Reparación">🛠️ Reparación / Ajuste</option><option value="Limpieza">✨ Limpieza / Pulido</option><option value="Fabricación">💍 Fabricación Nueva</option></select>
                </div>
                <button type="submit" disabled={guardandoTarea} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow transition-colors mt-2">{guardandoTarea ? 'Añadiendo...' : 'Añadir a la Cola'}</button>
              </div>
            </form>
          </div>
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-2 sm:p-4">
            {cargandoTareas ? <p className="text-center py-10 text-gray-500">Cargando taller...</p> : tareas.length === 0 ? <div className="text-center py-16 text-gray-400"><span className="text-4xl block mb-2">✨</span><p className="font-bold">No hay trabajos pendientes.</p></div> : (
              <div className="space-y-3">
                {tareas.map(t => (
                  <div key={t.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border ${t.estado === 'Enviado' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'} shadow-sm gap-4`}>
                    <div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${t.tipo_trabajo === 'Limpieza' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>{t.tipo_trabajo}</span><span className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString('es-CL')}</span></div><h4 className="font-bold text-gray-800 text-lg">{t.joya_nombre}</h4></div>
                    <div className="flex w-full sm:w-auto gap-2">
                      <button onClick={() => moverTarea(t.id, 'Pendiente')} className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold transition-all ${t.estado === 'Pendiente' ? 'bg-amber-500 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>🕒 Pendiente</button>
                      <button onClick={() => moverTarea(t.id, 'Enviado')} className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold transition-all ${t.estado === 'Enviado' ? 'bg-blue-500 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>🚚 Enviado</button>
                      <button onClick={() => moverTarea(t.id, 'Finalizado')} className="flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white transition-all">✅ Finalizar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}