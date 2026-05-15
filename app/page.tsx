import { supabase } from '../lib/supabase'
import FormularioJoya from '../components/FormularioJoya'
import TablaInventario from '../components/TablaInventario'

// 👇 ESTA LÍNEA ES VITAL PARA VERCEL (Apaga el caché y muestra datos en vivo) 👇
export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: inventario, error } = await supabase
    .from('modelos')
    .select('*, variantes_stock(peso, medida)')
    .order('created_at', { ascending: true })

  if (error) {
    return <div className="p-10 text-red-500">Error al cargar la base de datos</div>
  }

  return (
    <main className="p-4 md:p-10 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Inventario de Joyas 💍
        </h1>
      </div>

      <FormularioJoya />
      <TablaInventario inventarioInicial={inventario as any[]} />
    </main>
  )
}