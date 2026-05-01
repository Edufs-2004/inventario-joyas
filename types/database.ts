export type Modelo = {
  id: string;
  nombre: string;
  categoria: string;
  tipo: string | null;
  diametro: string | null;
  foto_peso: string | null;
  foto_presentacion: string | null;
  foto_venta: string | null;
  descripcion: string | null;
  imagen_url: string | null;
};

export type VarianteStock = {
  id: string;
  modelo_id: string;
  medida: string;
  stock: number;
  peso: number | null;
  costo: number;
  precio_venta: number;
};

export type GemaJoya = {
  id: string;
  modelo_id: string;
  nombre: string;
  medida: string;
};

// NUEVO: El molde para el embudo de ventas
export type RegistroVenta = {
  id: string;
  variante_id: string;
  estado: 'Negociando' | 'Guardado' | 'Por enviar' | 'Vendido';
  costo_historico: number;
  precio_lista_historico: number;
  precio_final_efectivo: number | null;
  nombre_cliente: string | null;
  direccion_envio: string | null;
  comuna: string | null;
  telefono_contacto: string | null;
  notas_internas: string | null;
  fecha_inicio: string;
  fecha_cierre: string | null;
};