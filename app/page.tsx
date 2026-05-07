import { supabase } from '../lib/supabase'
import FormularioJoya from '../components/FormularioJoya'
import TablaInventario from '../components/TablaInventario'
import Link from 'next/link'

export default async function Home() {
  // Vamos a Supabase a buscar TODAS las joyas ordenadas
  const { data: inventario, error } = await supabase
    .from('modelos')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    return <div className="p-10 text-red-500">Error al cargar la base de datos</div>
  }

  return (
    <main className="p-4 md:p-10 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Inventario de Joyas 💍
        </h1>
        
        {/* EL BOTÓN MÁGICO PARA IR AL TABLERO DE VENTAS */}
        <Link 
          href="/ventas" 
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors flex items-center gap-2"
        >
          📊 Ver Panel de Ventas
        </Link>
      </div>

      <FormularioJoya />
      <TablaInventario inventarioInicial={inventario || []} />
    </main>
  )
}