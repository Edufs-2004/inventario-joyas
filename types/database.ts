export type Modelo = {
  id: string;
  nombre: string;
  categoria: string;
  tipo: string | null;
  diametro: string | null;
  foto_peso: string | null;         // NUEVA
  foto_presentacion: string | null; // NUEVA
  foto_venta: string | null;        // NUEVA
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

// NUEVA: Molde para poder tener infinitas gemas
export type GemaJoya = {
  id: string;
  modelo_id: string;
  nombre: string;
  medida: string;
};