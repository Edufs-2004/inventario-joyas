"use client"

import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  titulo: string;
  urlActual?: string | null;
  alSubir: (url: string) => void;
}

export default function SubidorImagen({ titulo, urlActual, alSubir }: Props) {
  const [imagenData, setImagenData] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [exito, setExito] = useState(!!urlActual)

  // 1. Leer la foto del PC/Celular y mostrarla en pantalla
  const manejarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evento) => {
      setImagenData(evento.target?.result as string)
      setExito(false)
    }
    reader.readAsDataURL(file)
  }

  // 2. Magia del Canvas: Rotar 90 grados
  const rotarImagen = () => {
    if (!imagenData) return
    const img = new Image()
    img.src = imagenData
    img.onload = () => {
      const canvas = document.createElement('canvas')
      // Invertimos ancho y alto para el giro
      canvas.width = img.height
      canvas.height = img.width
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      // Movemos el centro y giramos
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((90 * Math.PI) / 180)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      
      // Estandarizamos a JPG con 80% de calidad para no saturar el Storage
      setImagenData(canvas.toDataURL('image/jpeg', 0.8))
    }
  }

  // 3. Subir el resultado a Supabase Storage
  const guardarEnNube = async () => {
    if (!imagenData) return
    setSubiendo(true)

    // Convertimos el texto (Base64) a un Archivo (Blob) real
    const res = await fetch(imagenData)
    const blob = await res.blob()
    
    // Generamos un nombre único para que no se sobreescriban
    const nombreUnico = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`

    const { data, error } = await supabase.storage
      .from('joyas')
      .upload(nombreUnico, blob, { contentType: 'image/jpeg' })

    if (error) {
      alert("Error al subir foto: " + error.message)
      setSubiendo(false)
      return
    }

    // Pedimos el Link Público de la foto y se lo mandamos al Formulario Principal
    const { data: { publicUrl } } = supabase.storage.from('joyas').getPublicUrl(nombreUnico)
    alSubir(publicUrl)
    setExito(true)
    setSubiendo(false)
  }

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
      <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">{titulo}</label>
      
      {/* Si hay una imagen (o recién seleccionada o ya subida), la mostramos */}
      {(imagenData || urlActual) && (
        <div className="mb-3 relative w-full h-48 bg-gray-100 rounded border overflow-hidden flex justify-center items-center">
          <img 
            src={imagenData || urlActual || ''} 
            alt="Vista previa" 
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}

      {/* Controles */}
      {!exito ? (
        <div className="flex flex-col gap-2">
          <input 
            type="file" 
            accept="image/*" 
            onChange={manejarArchivo}
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
          />
          
          {imagenData && (
            <div className="flex gap-2 mt-2">
              <button 
                type="button" 
                onClick={rotarImagen}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded shadow-sm hover:bg-gray-300 transition-colors text-sm font-bold"
              >
                🔄 Rotar
              </button>
              <button 
                type="button" 
                onClick={guardarEnNube}
                disabled={subiendo}
                className="flex-1 bg-amber-500 text-white py-2 rounded shadow-sm hover:bg-amber-600 transition-colors text-sm font-bold disabled:bg-amber-300"
              >
                {subiendo ? 'Subiendo...' : '☁️ Confirmar Foto'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-2 bg-green-50 text-green-700 font-bold rounded border border-green-200 text-sm">
          ✅ Foto guardada en la nube
        </div>
      )}
    </div>
  )
}