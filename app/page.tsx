import { supabase } from '../lib/supabase'
import FormularioJoya from '../components/FormularioJoya'
import TablaInventario from '../components/TablaInventario'

export default async function Home() {
  // 1. Vamos a Supabase a buscar TODAS las joyas ordenadas
  const { data: inventario, error } = await supabase
    .from('modelos')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    return <div className="p-10 text-red-500">Error al cargar la base de datos</div>
  }

  // 2. Armamos la página con nuestros bloques de Lego
  return (
    <main className="p-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Inventario de Joyas 💍
      </h1>

      {/* Botón flotante para agregar productos */}
      <FormularioJoya />

      {/* Le pasamos la lista de Supabase a la nueva tabla inteligente */}
      <TablaInventario inventarioInicial={inventario || []} />
      
    </main>
  )
}