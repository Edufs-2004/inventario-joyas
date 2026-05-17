import { supabase } from '../../lib/supabase'
import GeneradorCatalogo from '../../components/GeneradorCatalogo'

export const dynamic = 'force-dynamic'

export default async function CatalogoPage() {
  // Traemos el inventario, pero solo necesitamos datos básicos y los precios
  const { data: inventario, error } = await supabase
    .from('modelos')
    .select('id, nombre, categoria, tipo, foto_venta, variantes_stock(precio_venta)')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-10 text-red-500">Error al cargar el inventario para el catálogo.</div>
  }

  return (
    <main className="p-4 md:p-10 bg-gray-50 min-h-screen pb-32">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Armar Catálogo 📱
        </h1>
        <p className="text-sm text-gray-500 mt-1">Selecciona las fotos de venta que quieres enviar al cliente.</p>
      </div>

      <GeneradorCatalogo inventario={inventario || []} />
    </main>
  )
}