"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function ContabilidadPage() {
  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1)
  const [anioActual, setAnioActual] = useState(new Date().getFullYear())
  
  const [ventas, setVentas] = useState<any[]>([])
  const [gastos, setGastos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  const [nuevoGasto, setNuevoGasto] = useState({ fecha: new Date().toISOString().split('T')[0], categoria: 'Taller y Reparación', descripcion: '', monto: '' })
  const [guardando, setGuardando] = useState(false)

  const cargarDatos = async () => {
    setCargando(true)
    
    // Solo cargamos ventas Finalizadas / Vendidas para el conteo real
    const [reqVentas, reqGastos] = await Promise.all([
      supabase.from('registro_ventas').select('*, variantes_stock(modelos(nombre))').in('estado', ['Vendido', 'Finalizada', 'vendida']),
      supabase.from('gastos').select('*').order('fecha', { ascending: false })
    ])

    if (reqVentas.error) alert("Error leyendo ventas: " + reqVentas.error.message)
    if (reqGastos.error) alert("Error leyendo gastos: " + reqGastos.error.message)

    const ventasDelMes = (reqVentas.data || []).filter(v => {
      // MAGIA ZONA HORARIA: Forzamos la lectura según la hora de Santiago, Chile para no perder días.
      const fechaBase = v.fecha_cierre || v.fecha_inicio
      const dateObj = new Date(fechaBase)
      const mesRegistro = parseInt(dateObj.toLocaleString('es-CL', { month: 'numeric', timeZone: 'America/Santiago' }))
      const anioRegistro = parseInt(dateObj.toLocaleString('es-CL', { year: 'numeric', timeZone: 'America/Santiago' }))
      return mesRegistro === mesActual && anioRegistro === anioActual
    })

    const gastosDelMes = (reqGastos.data || []).filter(g => {
      const [year, month] = g.fecha.split('-')
      return Number(month) === mesActual && Number(year) === anioActual
    })

    setVentas(ventasDelMes)
    setGastos(gastosDelMes)
    setCargando(false)
  }

  useEffect(() => { cargarDatos() }, [mesActual, anioActual])

  const registrarGasto = async (e: React.FormEvent) => {
    e.preventDefault(); setGuardando(true)
    const { error } = await supabase.from('gastos').insert([{ fecha: nuevoGasto.fecha, categoria: nuevoGasto.categoria, descripcion: nuevoGasto.descripcion, monto: Number(nuevoGasto.monto) }])
    setGuardando(false)
    if (!error) { setNuevoGasto({ ...nuevoGasto, descripcion: '', monto: '' }); cargarDatos(); }
  }

  const eliminarGasto = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas borrar este registro?")) return
    await supabase.from('gastos').delete().eq('id', id)
    cargarDatos()
  }

  // CÁLCULOS (Usando precio_final si existe, si no, usa el precio_lista)
  const totalIngresos = ventas.reduce((acc, v) => acc + (v.precio_final_efectivo || v.precio_lista_historico || 0), 0)
  const costoMercaderia = ventas.reduce((acc, v) => acc + (v.costo_historico || 0), 0)
  const totalGastosOperativos = gastos.reduce((acc, g) => acc + Number(g.monto), 0)
  const utilidadBruta = totalIngresos - costoMercaderia
  const utilidadNeta = utilidadBruta - totalGastosOperativos

  // CREACIÓN DE PDF PROFESIONAL NATIVO
  const generarPDF = () => {
    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const nombreMes = nombresMeses[mesActual - 1];

    let tablaVentasHTML = ''
    ventas.forEach(v => {
      const fecha = new Date(v.fecha_cierre || v.fecha_inicio).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })
      const nombreJoya = v.variantes_stock?.modelos?.nombre || 'Joya sin nombre'
      const monto = (v.precio_final_efectivo || v.precio_lista_historico || 0).toLocaleString('es-CL')
      tablaVentasHTML += `<tr><td>${fecha}</td><td>${nombreJoya} (Ref: ${v.id.split('-')[0]})</td><td class="monto ingreso">$${monto}</td></tr>`
    })

    let tablaGastosHTML = ''
    gastos.forEach(g => {
      const fecha = new Date(g.fecha).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })
      const monto = Number(g.monto).toLocaleString('es-CL')
      tablaGastosHTML += `<tr><td>${fecha}</td><td>${g.categoria} - ${g.descripcion}</td><td class="monto egreso">-$${monto}</td></tr>`
    })

    const ventana = window.open('', '_blank')
    if(!ventana) {
      alert("Por favor, permite las ventanas emergentes (pop-ups) en tu navegador para ver el PDF.")
      return;
    }

    ventana.document.write(`
      <html>
        <head>
          <title>Reporte_SCJoyas_${nombreMes}_${anioActual}</title>
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #334155; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { color: #0f172a; margin: 0; font-size: 28px; }
            p { margin: 5px 0; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
            th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
            th { background-color: #f8fafc; color: #0f172a; font-weight: bold; }
            .monto { text-align: right; font-weight: bold; }
            .ingreso { color: #059669; }
            .egreso { color: #e11d48; }
            .resumen { background: #f1f5f9; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .resumen-item { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 16px; }
            .total-final { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #cbd5e1; font-size: 20px; font-weight: 900; color: #0f172a; }
            .firma { margin-top: 80px; text-align: center; border-top: 1px solid #cbd5e1; width: 250px; padding-top: 10px; margin-left: auto; margin-right: auto;}
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SC Joyas - Reporte Financiero</h1>
            <p>Periodo contable: <strong>${nombreMes} ${anioActual}</strong></p>
            <p>Fecha de emisión: ${new Date().toLocaleDateString('es-CL')}</p>
          </div>

          <h3>Ingresos por Ventas (Cerradas)</h3>
          <table>
            <thead><tr><th style="width: 20%;">Fecha</th><th>Descripción</th><th style="width: 25%;">Monto Pagado</th></tr></thead>
            <tbody>${tablaVentasHTML || '<tr><td colspan="3" style="text-align:center;">Sin ingresos registrados.</td></tr>'}</tbody>
          </table>

          <h3>Egresos Operativos (Taller y Sueldos)</h3>
          <table>
            <thead><tr><th style="width: 20%;">Fecha</th><th>Categoría / Detalle</th><th style="width: 25%;">Monto Saliente</th></tr></thead>
            <tbody>${tablaGastosHTML || '<tr><td colspan="3" style="text-align:center;">Sin egresos registrados.</td></tr>'}</tbody>
          </table>

          <div class="resumen">
            <h3>Resumen del Periodo</h3>
            <div class="resumen-item"><span>Ingresos Brutos:</span><span class="ingreso">$${totalIngresos.toLocaleString('es-CL')}</span></div>
            <div class="resumen-item"><span>(-) Costo de Mercadería Vendida:</span><span class="egreso">-$${costoMercaderia.toLocaleString('es-CL')}</span></div>
            <div class="resumen-item"><span>(-) Gastos y Taller:</span><span class="egreso">-$${totalGastosOperativos.toLocaleString('es-CL')}</span></div>
            <div class="total-final">
              <span>UTILIDAD NETA LÍQUIDA:</span>
              <span style="color: ${utilidadNeta >= 0 ? '#059669' : '#e11d48'};">$${utilidadNeta.toLocaleString('es-CL')}</span>
            </div>
          </div>

          <div class="firma">
            <p>Firma Administrador</p>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `)
    ventana.document.close()
  }

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div><h1 className="text-3xl font-extrabold text-slate-800">Cierre Contable 💰</h1><p className="text-slate-500 text-sm mt-1">Control de taller, sueldos y utilidad real.</p></div>
        <div className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-200 w-full md:w-auto">
          <select value={mesActual} onChange={e => setMesActual(Number(e.target.value))} className="bg-white border p-2 rounded-lg text-sm outline-none font-bold text-slate-700 flex-1">{['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
          <select value={anioActual} onChange={e => setAnioActual(Number(e.target.value))} className="bg-white border p-2 rounded-lg text-sm outline-none font-bold text-slate-700 w-24"><option value={2024}>2024</option><option value={2025}>2025</option><option value={2026}>2026</option></select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Ingresos (Ventas)</p><p className="text-2xl font-black text-slate-800">${totalIngresos.toLocaleString('es-CL')}</p></div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Costo de Joyas</p><p className="text-2xl font-black text-red-500">-${costoMercaderia.toLocaleString('es-CL')}</p></div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Taller y Gastos</p><p className="text-2xl font-black text-red-500">-${totalGastosOperativos.toLocaleString('es-CL')}</p></div>
        <div className={`p-5 rounded-2xl shadow-md border ${utilidadNeta >= 0 ? 'bg-emerald-500 border-emerald-600' : 'bg-red-500 border-red-600'} text-white`}><p className="text-sm font-bold text-emerald-100 uppercase tracking-wider mb-1">Utilidad Neta del Mes</p><p className="text-3xl font-black">${utilidadNeta.toLocaleString('es-CL')}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <form onSubmit={registrarGasto} className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white">
            <h3 className="text-lg font-bold text-amber-400 mb-4 border-b border-slate-700 pb-2">➕ Registrar Trabajo o Gasto</h3>
            <div className="space-y-4">
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha</label><input type="date" required value={nuevoGasto.fecha} onChange={e => setNuevoGasto({...nuevoGasto, fecha: e.target.value})} className="w-full bg-slate-800 border-none p-3 rounded-xl text-sm outline-none text-white focus:ring-2 focus:ring-amber-500" /></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Categoría</label><select value={nuevoGasto.categoria} onChange={e => setNuevoGasto({...nuevoGasto, categoria: e.target.value})} className="w-full bg-slate-800 border-none p-3 rounded-xl text-sm outline-none text-white focus:ring-2 focus:ring-amber-500"><option value="Taller y Reparación">🛠️ Taller y Reparación</option><option value="Limpieza">✨ Limpieza de Joyas</option><option value="Sueldos">👥 Sueldos</option><option value="Insumos">📦 Insumos</option><option value="Otro">📝 Otro</option></select></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descripción</label><input type="text" required placeholder="Ej: Arreglo eslabón..." value={nuevoGasto.descripcion} onChange={e => setNuevoGasto({...nuevoGasto, descripcion: e.target.value})} className="w-full bg-slate-800 border-none p-3 rounded-xl text-sm outline-none text-white focus:ring-2 focus:ring-amber-500" /></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Costo Total ($)</label><input type="number" required placeholder="15000" value={nuevoGasto.monto} onChange={e => setNuevoGasto({...nuevoGasto, monto: e.target.value})} className="w-full bg-slate-800 border-none p-3 rounded-xl text-sm outline-none text-white focus:ring-2 focus:ring-amber-500 font-bold" /></div>
              <button type="submit" disabled={guardando} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold py-3 rounded-xl shadow-lg transition-colors mt-2">{guardando ? 'Guardando...' : 'Registrar Salida'}</button>
            </div>
          </form>
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6 border-b pb-4"><h3 className="text-lg font-bold text-slate-800">Detalle de Salidas</h3><button onClick={generarPDF} className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold py-2 px-6 rounded-lg text-sm transition-colors shadow-md">📑 Generar Reporte PDF</button></div>
          <div className="overflow-x-auto">
            {cargando ? <p className="text-center py-10 text-gray-500 font-bold">Calculando...</p> : gastos.length === 0 ? <p className="text-center py-10 text-gray-400 font-bold">No hay trabajos registrados este mes.</p> : (
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider"><th className="p-3 border-b rounded-tl-xl">Fecha</th><th className="p-3 border-b">Categoría</th><th className="p-3 border-b">Descripción</th><th className="p-3 border-b text-right">Monto</th><th className="p-3 border-b text-center rounded-tr-xl">Acción</th></tr></thead>
                <tbody>{gastos.map(g => (<tr key={g.id} className="hover:bg-slate-50 border-b"><td className="p-3 text-sm text-gray-600">{new Date(g.fecha).toLocaleDateString('es-CL')}</td><td className="p-3"><span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-1 rounded">{g.categoria}</span></td><td className="p-3 text-sm text-slate-800">{g.descripcion}</td><td className="p-3 text-sm font-bold text-red-600 text-right">-${Number(g.monto).toLocaleString('es-CL')}</td><td className="p-3 text-center"><button onClick={() => eliminarGasto(g.id)} className="text-red-400 hover:text-red-600 font-bold text-xs bg-red-50 p-2 rounded-lg">Borrar</button></td></tr>))}</tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}