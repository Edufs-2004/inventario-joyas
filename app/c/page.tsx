import { supabase } from '../../lib/supabase'
import CatalogoPublico from '../../components/CatalogoPublico' 

export const dynamic = 'force-dynamic'

export default async function CatalogPage() {
  const { data, error } = await supabase
    .from('modelos')
    .select('id, nombre, categoria, foto_venta, variantes_stock(precio_venta)')
    .order('created_at', { ascending: false })

  if (error) return <div className="p-10 text-center text-red-500 font-bold">Error cargando el catálogo.</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <CatalogoPublico inventario={data || []} />
    </div>
  )
}