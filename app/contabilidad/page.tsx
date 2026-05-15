"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { RegistroVenta, VarianteStock, Modelo } from '../../types/database'



type VentaCerrada = RegistroVenta & {
  variantes_stock: VarianteStock & {
    modelos: Modelo
  }
}

export default function PaginaContabilidad() {
  const [ventas, setVentas] = useState<VentaCerrada[]>([])
  const [cargando, setCargando] = useState(true)

  const cargarVentasCerradas = async () => {
    setCargando(true)
    // Solo traemos las ventas que ya están en estado "Vendido"
    const { data, error } = await supabase
      .from('registro_ventas')
      .select(`*, variantes_stock (*, modelos (*))`)
      .eq('estado', 'Vendido')
      .order('fecha_cierre', { ascending: false })

    if (!error && data) setVentas(data as any)
    setCargando(false)
  }

  useEffect(() => {
    cargarVentasCerradas()
  }, [])

  // Cálculos de utilidades
  const totalIngresos = ventas.reduce((sum, v) => sum + (v.precio_final_efectivo || 0), 0)
  const totalCostosJoya = ventas.reduce((sum, v) => sum + v.costo_historico, 0)
  const totalCostosEnvio = ventas.reduce((sum, v) => sum + (v.costo_envio || 0), 0)
  const utilidadNeta = totalIngresos - (totalCostosJoya + totalCostosEnvio)

  return (
    <main className="p-4 md:p-10 bg-gray-50 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Contabilidad y Finanzas 💰</h1>

      {cargando ? (
        <div className="text-center p-10 font-bold text-gray-500">Calculando números...</div>
      ) : (
        <>
          {/* TARJETAS RESUMEN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-gray-500 text-sm font-bold uppercase">Total Ingresos</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">${totalIngresos}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-gray-500 text-sm font-bold uppercase">Costos Totales (Joyas + Envío)</h3>
              <p className="text-3xl font-bold text-red-500 mt-2">-${totalCostosJoya + totalCostosEnvio}</p>
            </div>
            <div className={`p-6 rounded-xl shadow-sm border ${utilidadNeta >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <h3 className={`text-sm font-bold uppercase ${utilidadNeta >= 0 ? 'text-green-700' : 'text-red-700'}`}>Utilidad Neta</h3>
              <p className={`text-3xl font-bold mt-2 ${utilidadNeta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${utilidadNeta}
              </p>
            </div>
          </div>

          {/* TABLA DE BOLETAS / REGISTRO HISTÓRICO */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-sm uppercase">
                  <th className="p-4 border-b">Fecha Cierre</th>
                  <th className="p-4 border-b">Joya</th>
                  <th className="p-4 border-b">Cliente</th>
                  <th className="p-4 border-b text-right">Costo Base</th>
                  <th className="p-4 border-b text-right">Costo Envío</th>
                  <th className="p-4 border-b text-right font-bold text-slate-900">Venta Final</th>
                  <th className="p-4 border-b text-right font-bold text-green-700">Utilidad</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => {
                  const costoBase = venta.costo_historico;
                  const envio = venta.costo_envio || 0;
                  const ventaFinal = venta.precio_final_efectivo || 0;
                  const utilidad = ventaFinal - (costoBase + envio);
                  const fecha = venta.fecha_cierre ? new Date(venta.fecha_cierre).toLocaleDateString() : '-';

                  return (
                    <tr key={venta.id} className="hover:bg-gray-50 transition-colors border-b last:border-0">
                      <td className="p-4 text-sm text-gray-500">{fecha}</td>
                      <td className="p-4">
                        <span className="font-bold text-gray-800 block text-sm">{venta.variantes_stock?.modelos?.nombre}</span>
                        <span className="text-xs text-gray-400">Talla: {venta.variantes_stock?.medida}</span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{venta.nombre_cliente || '-'}</td>
                      <td className="p-4 text-right text-sm text-red-500">-${costoBase}</td>
                      <td className="p-4 text-right text-sm text-orange-500">{envio > 0 ? `-$${envio}` : '-'}</td>
                      <td className="p-4 text-right font-bold text-slate-800">${ventaFinal}</td>
                      <td className={`p-4 text-right font-bold ${utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {utilidad >= 0 ? '+' : ''}${utilidad}
                      </td>
                    </tr>
                  )
                })}
                {ventas.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-400">Aún no hay ventas concretadas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  )
}

// Versión final 2.0 - [Pon la hora actual]