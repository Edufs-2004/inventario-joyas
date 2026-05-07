"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { RegistroVenta, VarianteStock, Modelo } from '../../types/database'
import Link from 'next/link'

type VentaCompleta = RegistroVenta & {
  variantes_stock: VarianteStock & {
    modelos: Modelo
  }
}

const ESTADOS = ['Negociando', 'Guardado', 'Por enviar', 'Vendido']

export default function PaginaVentas() {
  const [ventas, setVentas] = useState<VentaCompleta[]>([])
  const [cargando, setCargando] = useState(true)
  
  const [ventaEditando, setVentaEditando] = useState<VentaCompleta | null>(null)
  const [formVenta, setFormVenta] = useState<Partial<RegistroVenta>>({})
  const [guardando, setGuardando] = useState(false)

  const cargarVentas = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('registro_ventas')
      .select(`*, variantes_stock (*, modelos (*))`)
      .order('fecha_inicio', { ascending: false })

    if (!error && data) setVentas(data as any)
    setCargando(false)
  }

  useEffect(() => {
    cargarVentas()
  }, [])

  const guardarEdicionVenta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ventaEditando) return
    setGuardando(true)

    const esNuevaVentaCerrada = formVenta.estado === 'Vendido' && ventaEditando.estado !== 'Vendido'
    const fechaCierre = esNuevaVentaCerrada ? new Date().toISOString() : formVenta.fecha_cierre

    // 1. Actualizar la venta
    const { error } = await supabase
      .from('registro_ventas')
      .update({
        estado: formVenta.estado,
        precio_final_efectivo: formVenta.precio_final_efectivo ? Number(formVenta.precio_final_efectivo) : null,
        nombre_cliente: formVenta.nombre_cliente,
        direccion_envio: formVenta.direccion_envio,
        comuna: formVenta.comuna,
        telefono_contacto: formVenta.telefono_contacto,
        notas_internas: formVenta.notas_internas,
        fecha_cierre: fechaCierre
      })
      .eq('id', ventaEditando.id)

    // 2. Descontar el stock si la venta se cerró
    if (!error && esNuevaVentaCerrada && ventaEditando.variantes_stock) {
      const stockActual = ventaEditando.variantes_stock.stock
      await supabase
        .from('variantes_stock')
        .update({ stock: Math.max(0, stockActual - 1) })
        .eq('id', ventaEditando.variantes_stock.id)
    }

    setGuardando(false)

    if (error) {
      alert("Error al actualizar la venta: " + error.message)
    } else {
      setVentaEditando(null)
      cargarVentas()
    }
  }

  const calcularGanancia = () => {
    if (!formVenta.precio_final_efectivo || !ventaEditando) return null
    return Number(formVenta.precio_final_efectivo) - ventaEditando.costo_historico
  }

  return (
    <main className="p-4 md:p-10 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Panel de Ventas 📊</h1>
        <Link href="/" className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-slate-800 text-sm">
          ⬅ Volver al Inventario
        </Link>
      </div>

      {cargando ? (
        <div className="text-center p-10 font-bold text-gray-500">Cargando tablero...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 snap-x h-[75vh]">
          {ESTADOS.map(estado => {
            const ventasColumna = ventas.filter(v => v.estado === estado)
            return (
              <div key={estado} className="bg-gray-200/60 rounded-xl p-3 min-w-[280px] md:min-w-[320px] max-w-[320px] flex flex-col snap-center border shadow-inner">
                <div className="flex justify-between items-center mb-4 px-2">
                  <h2 className="font-bold text-gray-700 uppercase text-sm">{estado}</h2>
                  <span className="bg-white px-2 py-1 rounded-full text-xs font-bold text-gray-500">{ventasColumna.length}</span>
                </div>
                <div className="flex flex-col gap-3 overflow-y-auto pr-1 flex-1">
                  {ventasColumna.map(venta => (
                    <div key={venta.id} onClick={() => {setVentaEditando(venta); setFormVenta(venta)}} className="bg-white p-3 rounded-lg shadow-sm border cursor-pointer hover:border-amber-400 group">
                      <div className="flex gap-3 items-start">
                        {venta.variantes_stock?.modelos?.foto_presentacion ? (
                          <img src={venta.variantes_stock.modelos.foto_presentacion} alt="Joya" className="w-12 h-12 object-cover rounded bg-gray-50 border" />
                        ) : <div className="w-12 h-12 bg-amber-50 rounded border flex items-center justify-center text-xl">💍</div>}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 text-sm truncate">{venta.variantes_stock?.modelos?.nombre || 'Desconocido'}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">Talla: <span className="font-bold text-gray-700">{venta.variantes_stock?.medida}</span></p>
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-green-600 font-bold text-sm">${venta.precio_final_efectivo || venta.precio_lista_historico}</span>
                            {venta.nombre_cliente && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded truncate max-w-[80px]">👤 {venta.nombre_cliente}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {ventasColumna.length === 0 && <div className="border-2 border-dashed border-gray-300 rounded-lg h-24 flex items-center justify-center text-gray-400 text-xs">Sin ventas</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {ventaEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-amber-400">Detalle de Venta</h2>
                <p className="text-xs text-slate-300 mt-1">ID: {ventaEditando.id.split('-')[0]}</p>
              </div>
              <button onClick={() => setVentaEditando(null)} className="text-slate-400 hover:text-white text-2xl">✖</button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
              <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 flex gap-4 items-center">
                {ventaEditando.variantes_stock?.modelos?.foto_presentacion ? (
                  <img src={ventaEditando.variantes_stock.modelos.foto_presentacion} alt="Joya" className="w-20 h-20 object-cover rounded border" />
                ) : <div className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center text-3xl">💍</div>}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg">{ventaEditando.variantes_stock?.modelos?.nombre}</h3>
                  <div className="flex gap-4 mt-1 text-sm">
                    <p className="text-gray-500">Talla: <span className="font-bold text-gray-800">{ventaEditando.variantes_stock?.medida}</span></p>
                    <p className="text-gray-500">Costo: <span className="font-bold text-red-600">${ventaEditando.costo_historico}</span></p>
                    <p className="text-gray-500">Precio Lista: <span className="font-bold text-blue-600">${ventaEditando.precio_lista_historico}</span></p>
                  </div>
                </div>
              </div>
              <form id="form-venta" onSubmit={guardarEdicionVenta} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <label className="block text-xs font-bold text-amber-800 uppercase mb-2">Estado del Proceso</label>
                    <select value={formVenta.estado} onChange={e => setFormVenta({...formVenta, estado: e.target.value as any})} className="w-full border-amber-300 rounded p-2 text-sm font-bold bg-white text-gray-800">
                      {ESTADOS.map(est => <option key={est} value={est}>{est}</option>)}
                    </select>
                  </div>
                  <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Precio Final Cerrado ($)</label>
                    <input type="number" value={formVenta.precio_final_efectivo || ''} onChange={e => setFormVenta({...formVenta, precio_final_efectivo: e.target.value ? Number(e.target.value) : null})} className="w-full border rounded p-2 text-lg font-bold text-green-600" />
                    {formVenta.precio_final_efectivo && (
                      <div className="mt-3 p-2 rounded bg-slate-50 border flex justify-between text-sm">
                        <span className="text-slate-500">Ganancia Estimada:</span>
                        <span className={`font-bold ${calcularGanancia()! > 0 ? 'text-green-600' : 'text-red-600'}`}>${calcularGanancia()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-3 bg-white p-4 rounded-xl border shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 uppercase border-b pb-2 mb-3">Datos Logísticos</h3>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase">Cliente</label><input type="text" value={formVenta.nombre_cliente || ''} onChange={e => setFormVenta({...formVenta, nombre_cliente: e.target.value})} className="w-full border-b p-1 text-sm bg-transparent" /></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase">Teléfono</label><input type="text" value={formVenta.telefono_contacto || ''} onChange={e => setFormVenta({...formVenta, telefono_contacto: e.target.value})} className="w-full border-b p-1 text-sm bg-transparent" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-500 uppercase">Dirección</label><input type="text" value={formVenta.direccion_envio || ''} onChange={e => setFormVenta({...formVenta, direccion_envio: e.target.value})} className="w-full border-b p-1 text-sm bg-transparent" /></div>
                    <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-500 uppercase">Comuna</label><input type="text" value={formVenta.comuna || ''} onChange={e => setFormVenta({...formVenta, comuna: e.target.value})} className="w-full border-b p-1 text-sm bg-transparent" /></div>
                  </div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mt-2">Notas</label><textarea value={formVenta.notas_internas || ''} onChange={e => setFormVenta({...formVenta, notas_internas: e.target.value})} rows={2} className="w-full border rounded p-2 text-sm mt-1" /></div>
                </div>
              </form>
            </div>
            <div className="bg-gray-100 p-4 flex justify-end gap-3 border-t">
              <button onClick={() => setVentaEditando(null)} className="px-6 py-2 bg-white border rounded-lg font-bold text-gray-600 text-sm">Cerrar</button>
              <button type="submit" form="form-venta" disabled={guardando} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 text-sm">
                {guardando ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}