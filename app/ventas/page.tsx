"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function VentasYGestionPage() {
  const [pestaña, setPestaña] = useState<'ventas' | 'taller'>('ventas')
  
  // ESTADOS DE VENTAS
  const [ventas, setVentas] = useState<any[]>([])
  const [cargandoVentas, setCargandoVentas] = useState(true)

  // ESTADOS DEL TALLER
  const [tareas, setTareas] = useState<any[]>([])
  const [cargandoTareas, setCargandoTareas] = useState(true)
  const [nuevaTarea, setNuevaTarea] = useState({ joya_nombre: '', tipo_trabajo: 'Reparación' })
  const [guardandoTarea, setGuardandoTarea] = useState(false)

  useEffect(() => {
    cargarVentas()
    cargarTareas()
  }, [])

  // ===================== LÓGICA DE VENTAS =====================
  const cargarVentas = async () => {
    setCargandoVentas(true)
    const { data } = await supabase
      .from('registro_ventas')
      .select('*, variantes_stock(medida, modelos(nombre))')
      .order('created_at', { ascending: false })
    
    if (data) setVentas(data)
    setCargandoVentas(false)
  }

  const actualizarEstadoVenta = async (id: string, nuevoEstado: string) => {
    await supabase.from('registro_ventas').update({ estado: nuevoEstado }).eq('id', id)
    cargarVentas()
  }

  const eliminarVenta = async (id: string) => {
    if(!window.confirm('¿Borrar esta venta por completo?')) return
    await supabase.from('registro_ventas').delete().eq('id', id)
    cargarVentas()
  }

  // ===================== LÓGICA DEL TALLER =====================
  const cargarTareas = async () => {
    setCargandoTareas(true)
    const { data } = await supabase.from('tareas_taller').select('*').order('created_at', { ascending: false })
    if (data) setTareas(data)
    setCargandoTareas(false)
  }

  const agregarTarea = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardandoTarea(true)
    await supabase.from('tareas_taller').insert([{ joya_nombre: nuevaTarea.joya_nombre, tipo_trabajo: nuevaTarea.tipo_trabajo, estado: 'Pendiente' }])
    setNuevaTarea({ joya_nombre: '', tipo_trabajo: 'Reparación' })
    setGuardandoTarea(false)
    cargarTareas()
  }

  const moverTarea = async (id: string, nuevoEstado: string) => {
    if (nuevoEstado === 'Finalizado') {
      if(window.confirm('¿Marcar como finalizado? Esto borrará la tarea de la lista para no acumular basura.')) {
        await supabase.from('tareas_taller').delete().eq('id', id)
      }
    } else {
      await supabase.from('tareas_taller').update({ estado: nuevoEstado }).eq('id', id)
    }
    cargarTareas()
  }

  return (
    <div className="p-4 md:p-10 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Panel de Gestión 📋</h1>
        <p className="text-gray-500 mt-1">Controla tus ventas activas y las reparaciones del taller.</p>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="flex gap-4 mb-8 border-b pb-2 overflow-x-auto">
        <button onClick={() => setPestaña('ventas')} className={`px-6 py-2 rounded-t-lg font-bold transition-colors whitespace-nowrap ${pestaña === 'ventas' ? 'bg-slate-900 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
          💰 Negociaciones y Ventas
        </button>
        <button onClick={() => setPestaña('taller')} className={`px-6 py-2 rounded-t-lg font-bold transition-colors whitespace-nowrap ${pestaña === 'taller' ? 'bg-amber-500 text-slate-900' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
          🛠️ Cola de Taller
        </button>
      </div>

      {/* ========================================================= */}
      {/* PESTAÑA: VENTAS */}
      {/* ========================================================= */}
      {pestaña === 'ventas' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          {cargandoVentas ? <p className="p-10 text-center text-gray-500">Cargando ventas...</p> : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-sm uppercase whitespace-nowrap">
                  <th className="p-4 border-b">Fecha</th>
                  <th className="p-4 border-b">Joya</th>
                  <th className="p-4 border-b text-center">Talla</th>
                  <th className="p-4 border-b text-center">Precio Pactado</th>
                  <th className="p-4 border-b text-center">Estado</th>
                  <th className="p-4 border-b text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-gray-400">No hay ventas registradas.</td></tr> : ventas.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50 border-b">
                    <td className="p-4 text-sm text-gray-600">{new Date(v.created_at).toLocaleDateString('es-CL')}</td>
                    <td className="p-4 font-bold text-slate-800">{v.variantes_stock?.modelos?.nombre || 'Joya Eliminada'}</td>
                    <td className="p-4 text-center text-sm">{v.variantes_stock?.medida || '-'}</td>
                    <td className="p-4 text-center font-bold text-emerald-600">${v.precio_lista_historico}</td>
                    <td className="p-4 text-center">
                      <select 
                        value={v.estado} 
                        onChange={(e) => actualizarEstadoVenta(v.id, e.target.value)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full outline-none cursor-pointer ${v.estado === 'Finalizada' ? 'bg-emerald-100 text-emerald-800' : v.estado === 'Cancelado' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}
                      >
                        <option value="Negociando">🟠 Negociando</option>
                        <option value="Finalizada">✅ Finalizada</option>
                        <option value="Cancelado">❌ Cancelado</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => eliminarVenta(v.id)} className="text-red-500 hover:text-red-700 text-xs font-bold px-2">Borrar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA: TALLER */}
      {/* ========================================================= */}
      {pestaña === 'taller' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1">
            <form onSubmit={agregarTarea} className="bg-amber-50 p-6 rounded-2xl shadow-sm border border-amber-200">
              <h3 className="font-bold text-amber-800 border-b border-amber-200 pb-2 mb-4">➕ Enviar al Taller</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-amber-700 uppercase mb-1">Nombre de la Joya / Cliente</label>
                  <input type="text" required placeholder="Ej: Anillo de María..." value={nuevaTarea.joya_nombre} onChange={e => setNuevaTarea({...nuevaTarea, joya_nombre: e.target.value})} className="w-full border-none p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 shadow-inner" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-700 uppercase mb-1">Trabajo a realizar</label>
                  <select value={nuevaTarea.tipo_trabajo} onChange={e => setNuevaTarea({...nuevaTarea, tipo_trabajo: e.target.value})} className="w-full border-none p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 shadow-inner">
                    <option value="Reparación">🛠️ Reparación / Ajuste</option>
                    <option value="Limpieza">✨ Limpieza / Pulido</option>
                    <option value="Fabricación">💍 Fabricación Nueva</option>
                  </select>
                </div>
                <button type="submit" disabled={guardandoTarea} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow transition-colors mt-2">
                  {guardandoTarea ? 'Añadiendo...' : 'Añadir a la Cola'}
                </button>
              </div>
            </form>
            <div className="mt-4 p-4 bg-blue-50 text-blue-800 text-xs rounded-xl border border-blue-200">
              ℹ️ <strong>Nota:</strong> Cuando marques un trabajo como "Finalizado", se eliminará automáticamente de esta lista para mantener tu panel limpio.
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-2 sm:p-4">
            {cargandoTareas ? <p className="text-center py-10 text-gray-500">Cargando taller...</p> : tareas.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <span className="text-4xl block mb-2">✨</span>
                <p className="font-bold">No hay trabajos pendientes en el taller.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tareas.map(tarea => (
                  <div key={tarea.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border ${tarea.estado === 'Enviado' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'} shadow-sm gap-4`}>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${tarea.tipo_trabajo === 'Limpieza' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                          {tarea.tipo_trabajo}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(tarea.created_at).toLocaleDateString('es-CL')}</span>
                      </div>
                      <h4 className="font-bold text-gray-800 text-lg">{tarea.joya_nombre}</h4>
                    </div>

                    <div className="flex w-full sm:w-auto gap-2">
                      <button 
                        onClick={() => moverTarea(tarea.id, 'Pendiente')} 
                        className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold transition-all ${tarea.estado === 'Pendiente' ? 'bg-amber-500 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        🕒 Pendiente
                      </button>
                      <button 
                        onClick={() => moverTarea(tarea.id, 'Enviado')} 
                        className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold transition-all ${tarea.estado === 'Enviado' ? 'bg-blue-500 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        🚚 Enviado
                      </button>
                      <button 
                        onClick={() => moverTarea(tarea.id, 'Finalizado')} 
                        className="flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        ✅ Finalizar
                      </button>
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