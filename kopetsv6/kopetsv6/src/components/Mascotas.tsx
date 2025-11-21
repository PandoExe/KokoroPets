import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Plus, Search, Edit, Trash2, Check, Syringe, Send, Loader2, Upload, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { ScrollArea } from './ui/scroll-area'

import {
  mascotaService,
  tipoAnimalService,
  razaService,
  tipoVacunaService,
  vacunaMascotaService,
} from '../services/api'

interface TipoAnimalAPI {
  id: number
  nombre: string
}

interface RazaAPI {
  id: number
  nombre: string
}

interface TipoVacunaAPI {
  id: number
  nombre: string
}

interface VacunaAPI {
  id: number
  tipo_vacuna: number
  tipo_vacuna_nombre: string
  fecha_aplicacion: string
}

interface MascotaAPI {
  id: number
  nombre: string
  edad: 'CACHORRO' | 'JOVEN' | 'ADULTO' | 'SENIOR'
  tipo_animal: number
  tipo_animal_nombre: string
  raza: number | null
  raza_nombre: string | null
  sexo: 'MACHO' | 'HEMBRA'
  esterilizado: boolean
  desparasitado: boolean
  microchip: boolean
  descripcion: string
  necesidades_especiales: string
  tamano: '' | 'PEQUENO' | 'MEDIANO' | 'GRANDE' | 'GIGANTE'
  color: string
  nivel_energia: '' | 'BAJA' | 'MEDIA' | 'ALTA'
  nivel_cuidado: '' | 'BAJO' | 'MEDIO' | 'ALTO'
  apto_ninos: boolean
  apto_apartamento: boolean
  sociable_perros: boolean
  sociable_gatos: boolean
  foto_principal: string
  foto_2: string
  foto_3: string
  estado: 'DISPONIBLE' | 'RESERVADO' | 'ADOPTADO' | 'BORRADOR'
  vacunas_aplicadas: VacunaAPI[]
}

interface MascotaForm {
  id?: number
  nombre: string
  edad: MascotaAPI['edad'] | ''
  tipo_animal: string  // ID as string
  raza: string  // ID as string
  sexo: MascotaAPI['sexo']
  esterilizado: boolean
  desparasitado: boolean
  microchip: boolean
  descripcion: string
  necesidades_especiales: string
  tamano: MascotaAPI['tamano']
  color: string
  nivel_energia: MascotaAPI['nivel_energia']
  nivel_cuidado: MascotaAPI['nivel_cuidado']
  apto_ninos: boolean
  apto_apartamento: boolean
  sociable_perros: boolean
  sociable_gatos: boolean
  foto_principal: File | null
  foto_2: File | null
  foto_3: File | null
  estado: MascotaAPI['estado']
}

const emptyForm: MascotaForm = {
  nombre: '',
  edad: '',
  tipo_animal: '',
  raza: '',
  sexo: 'MACHO',
  esterilizado: false,
  desparasitado: false,
  microchip: false,
  descripcion: '',
  necesidades_especiales: '',
  tamano: '',
  color: '',
  nivel_energia: '',
  nivel_cuidado: '',
  apto_ninos: false,
  apto_apartamento: false,
  sociable_perros: false,
  sociable_gatos: false,
  foto_principal: null,
  foto_2: null,
  foto_3: null,
  estado: 'DISPONIBLE',
}

const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ESin imagen%3C/text%3E%3C/svg%3E'

const procesarImagenSrc = (src: string | undefined) => {
  if (!src) return fallbackImage
  if (src.startsWith('http')) return src
  if (src.startsWith('data:')) return src

  if (src.startsWith('/media/')) return `http://localhost:8000${src}`
  return `data:image/jpeg;base64,${src}`
}

function useCatalogos(tipoAnimalId: number | null) {
  const [razas, setRazas] = useState<RazaAPI[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!tipoAnimalId) {
      setRazas([])
      return
    }

    setLoading(true)
    razaService
      .listar()
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.results ?? []
        const filtradas = lista.filter((r: any) => r.tipo_animal === tipoAnimalId)
        setRazas(filtradas)
      })
      .catch(() => {
        setRazas([])
      })
      .finally(() => setLoading(false))
  }, [tipoAnimalId])

  return { razas, loading }
}

const prettyFecha = (isoDate: string) => {
  try {
    const [y, m, d] = isoDate.split('-').map(Number)
    const date = new Date(y, (m || 1) - 1, d)
    return date.toLocaleDateString('es-CL')
  } catch {
    return isoDate
  }
}

export function Mascotas() {
  const [mascotas, setMascotas] = useState<MascotaAPI[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<MascotaForm>(emptyForm)
  const [isEditing, setIsEditing] = useState(false)

  const [tiposAnimales, setTiposAnimales] = useState<TipoAnimalAPI[]>([])
  const tipoAnimalSeleccionado = form.tipo_animal ? parseInt(form.tipo_animal) : null
  const { razas } = useCatalogos(tipoAnimalSeleccionado)

  const [previewFoto1, setPreviewFoto1] = useState<string>('')
  const [previewFoto2, setPreviewFoto2] = useState<string>('')
  const [previewFoto3, setPreviewFoto3] = useState<string>('')

  const [vacunasDialogOpen, setVacunasDialogOpen] = useState(false)
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState<MascotaAPI | null>(null)
  const [vacunasActuales, setVacunasActuales] = useState<VacunaAPI[]>([])
  const [tiposVacunas, setTiposVacunas] = useState<TipoVacunaAPI[]>([])
  const [vacForm, setVacForm] = useState({
    tipo_vacuna: '',
    fecha_aplicacion: new Date().toISOString().slice(0, 10)
  })
  const [loadingVacunas, setLoadingVacunas] = useState(false)

  useEffect(() => {
    loadAll()
    loadTiposAnimales()
  }, [])

  const loadTiposAnimales = async () => {
    try {
      const tipos = await tipoAnimalService.listar()
      setTiposAnimales(Array.isArray(tipos) ? tipos : tipos?.results ?? [])
    } catch {
      setTiposAnimales([])
    }
  }

  const loadAll = async () => {
    try {
      setLoading(true)
      const list = await mascotaService.listar()

      setMascotas(Array.isArray(list) ? list : list?.results ?? [])
    } catch (err) {
      toast.error('Error al cargar datos')
      setMascotas([])
    } finally {
      setLoading(false)
    }
  }

  const resetAndOpenNew = () => {
    setForm(emptyForm)
    setPreviewFoto1('')
    setPreviewFoto2('')
    setPreviewFoto3('')
    setIsEditing(false)
    setDialogOpen(true)
  }

  const handleEdit = (m: MascotaAPI) => {
    setForm({
      id: m.id,
      nombre: m.nombre,
      edad: m.edad,
      tipo_animal: String(m.tipo_animal),
      raza: m.raza ? String(m.raza) : '',
      sexo: m.sexo,
      esterilizado: m.esterilizado,
      desparasitado: m.desparasitado,
      microchip: m.microchip,
      descripcion: m.descripcion,
      necesidades_especiales: m.necesidades_especiales || '',
      tamano: m.tamano || '',
      color: m.color || '',
      nivel_energia: m.nivel_energia || '',
      nivel_cuidado: m.nivel_cuidado || '',
      apto_ninos: m.apto_ninos,
      apto_apartamento: m.apto_apartamento,
      sociable_perros: m.sociable_perros,
      sociable_gatos: m.sociable_gatos,
      foto_principal: null,
      foto_2: null,
      foto_3: null,
      estado: m.estado,
    })

    if (m.foto_principal) setPreviewFoto1(procesarImagenSrc(m.foto_principal))
    if (m.foto_2) setPreviewFoto2(procesarImagenSrc(m.foto_2))
    if (m.foto_3) setPreviewFoto3(procesarImagenSrc(m.foto_3))

    setIsEditing(true)
    setDialogOpen(true)
  }

  const onSubmitMascota = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.nombre || !form.edad || !form.tipo_animal) {
      toast.error('Completa Nombre, Edad y Tipo de Animal')
      return
    }

    const payload = {
      nombre: form.nombre,
      edad: form.edad,
      tipo_animal: form.tipo_animal,
      raza: form.raza,
      sexo: form.sexo,
      esterilizado: form.esterilizado,
      desparasitado: form.desparasitado,
      microchip: form.microchip,
      descripcion: form.descripcion,
      necesidades_especiales: form.necesidades_especiales,
      estado: form.estado,
      tamano: form.tamano,
      color: form.color,
      nivel_energia: form.nivel_energia,
      nivel_cuidado: form.nivel_cuidado,
      apto_ninos: form.apto_ninos,
      apto_apartamento: form.apto_apartamento,
      sociable_perros: form.sociable_perros,
      sociable_gatos: form.sociable_gatos,
      foto_principal: form.foto_principal,
      foto_2: form.foto_2,
      foto_3: form.foto_3,
    }

    try {
      if (isEditing && form.id) {
        await mascotaService.actualizar(form.id, payload)
        toast.success('Mascota actualizada')
      } else {
        await mascotaService.crear(payload)
        toast.success('Mascota creada')
      }
      setDialogOpen(false)
      loadAll()
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar')
    }
  }

  const handlePublicar = async (id: number) => {
    try {
      await mascotaService.publicar(id)
      toast.success('Mascota publicada')
      await loadAll()
    } catch {
      toast.error('Error al publicar')
    }
  }

  const handleDelete = async (id: number) => {
    toast('¿Estás seguro de eliminar esta mascota?', {
      description: 'Esta acción no se puede deshacer.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            await mascotaService.eliminar(id)
            toast.success('Mascota eliminada')
            loadAll()
          } catch {
            toast.error('Error al eliminar')
          }
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}
      }
    })
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>, fotoNumero: 1 | 2 | 3) => {
    const file = e.target.files?.[0]
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Selecciona una imagen válida')
        return
      }
      
      if (file.size > 150 * 1024 * 1024) {
        toast.error('La imagen no debe superar 150MB')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        if (fotoNumero === 1) {
          setPreviewFoto1(reader.result as string)
          setForm(prev => ({ ...prev, foto_principal: file }))
        } else if (fotoNumero === 2) {
          setPreviewFoto2(reader.result as string)
          setForm(prev => ({ ...prev, foto_2: file }))
        } else if (fotoNumero === 3) {
          setPreviewFoto3(reader.result as string)
          setForm(prev => ({ ...prev, foto_3: file }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const abrirModalVacunas = async (mascota: MascotaAPI) => {
    setMascotaSeleccionada(mascota)
    setVacunasActuales(mascota.vacunas_aplicadas || [])
    setVacForm({
      tipo_vacuna: '',
      fecha_aplicacion: new Date().toISOString().slice(0, 10)
    })
    
    try {
      const tipos = await tipoVacunaService.listar()
      setTiposVacunas(Array.isArray(tipos) ? tipos : tipos?.results ?? [])
    } catch {
      toast.error('Error al cargar tipos de vacunas')
      setTiposVacunas([])
    }
    
    setVacunasDialogOpen(true)
  }

  const onAgregarVacuna = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!mascotaSeleccionada || !vacForm.tipo_vacuna) {
      toast.error('Selecciona tipo de vacuna')
      return
    }

    setLoadingVacunas(true)
    try {
      const created = await vacunaMascotaService.crear({
        mascota: mascotaSeleccionada.id,
        tipo_vacuna: parseInt(vacForm.tipo_vacuna),
        fecha_aplicacion: vacForm.fecha_aplicacion,
      })

      setVacunasActuales(prev => [...prev, created])
      setVacForm({
        tipo_vacuna: '',
        fecha_aplicacion: new Date().toISOString().slice(0, 10)
      })
      toast.success('Vacuna agregada')
      loadAll()
    } catch (error: any) {
      toast.error(error?.message || 'Error al agregar vacuna')
    } finally {
      setLoadingVacunas(false)
    }
  }

  const onQuitarVacuna = async (id: number) => {
    toast('¿Estás seguro de eliminar esta vacuna?', {
      description: 'Esta acción no se puede deshacer.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          setLoadingVacunas(true)
          try {
            await vacunaMascotaService.eliminar(id)
            setVacunasActuales(prev => prev.filter(v => v.id !== id))
            toast.success('Vacuna eliminada')
            loadAll()
          } catch {
            toast.error('Error al eliminar vacuna')
          } finally {
            setLoadingVacunas(false)
          }
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}
      }
    })
  }

  const estadoBadgeVariant = (estado: MascotaAPI['estado']): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (estado) {
      case 'DISPONIBLE': return 'default'
      case 'BORRADOR': return 'secondary'
      case 'ADOPTADO': return 'outline'
      case 'RESERVADO': return 'destructive'
      default: return 'default'
    }
  }

  const mascotasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return mascotas
    return mascotas.filter((m) =>
      m.nombre.toLowerCase().includes(q) ||
      (m.raza_nombre || '').toLowerCase().includes(q) ||
      (m.tipo_animal_nombre || '').toLowerCase().includes(q)
    )
  }, [busqueda, mascotas])

  const grupos = useMemo(() => ({
    todas: mascotasFiltradas,
    disponibles: mascotasFiltradas.filter((m) => m.estado === 'DISPONIBLE'),
    reservadas: mascotasFiltradas.filter((m) => m.estado === 'RESERVADO'),
    borradores: mascotasFiltradas.filter((m) => m.estado === 'BORRADOR'),
    adoptadas: mascotasFiltradas.filter((m) => m.estado === 'ADOPTADO'),
  }), [mascotasFiltradas])

  const MascotaCard = ({ mascota }: { mascota: MascotaAPI }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={procesarImagenSrc(mascota.foto_principal)}
          alt={mascota.nombre}
          className="w-full h-full object-cover"
        />
      </div>

      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{mascota.nombre}</CardTitle>
          <Badge variant={estadoBadgeVariant(mascota.estado)}>{mascota.estado}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {mascota.tipo_animal_nombre || 'Animal'}
          {mascota.raza_nombre && ` • ${mascota.raza_nombre}`}
          • {mascota.edad}
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline">{mascota.sexo}</Badge>
            {mascota.esterilizado && (
              <Badge variant="outline">
                <Check className="w-3 h-3 mr-1" /> Esterilizado
              </Badge>
            )}
            {mascota.desparasitado && (
              <Badge variant="outline">
                <Check className="w-3 h-3 mr-1" /> Desparasitado
              </Badge>
            )}
            {mascota.microchip && (
              <Badge variant="outline">
                <Check className="w-3 h-3 mr-1" /> Microchip
              </Badge>
            )}
          </div>

          {mascota.vacunas_aplicadas && mascota.vacunas_aplicadas.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1">Vacunas:</p>
              <div className="flex flex-wrap gap-1">
                {mascota.vacunas_aplicadas.slice(0, 3).map(v => (
                  <Badge key={v.id} variant="secondary" className="text-xs">
                    <Syringe className="w-3 h-3 mr-1" />
                    {v.tipo_vacuna_nombre}
                  </Badge>
                ))}
                {mascota.vacunas_aplicadas.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{mascota.vacunas_aplicadas.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {mascota.tamano && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Tamaño:</span>
              <Badge variant="secondary">{mascota.tamano}</Badge>
            </div>
          )}
          {mascota.nivel_energia && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Energía:</span>
              <Badge variant="secondary">{mascota.nivel_energia}</Badge>
            </div>
          )}
          <p className="text-sm line-clamp-2">{mascota.descripcion}</p>
        </div>
      </CardContent>

      <CardFooter className="gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => abrirModalVacunas(mascota)}>
          <Syringe className="w-4 h-4 mr-1" /> Vacunas
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleEdit(mascota)}>
          <Edit className="w-4 h-4 mr-1" /> Editar
        </Button>
        {mascota.estado === 'BORRADOR' && (
          <Button size="sm" onClick={() => handlePublicar(mascota.id)}>
            <Send className="w-4 h-4 mr-1" /> Publicar
          </Button>
        )}
        <Button variant="destructive" size="sm" onClick={() => handleDelete(mascota.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de mascotas</h1>
          <p className="text-muted-foreground">Administra las mascotas disponibles para adopción</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetAndOpenNew}>
              <Plus className="w-4 h-4 mr-2" /> Agregar Mascota
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Editar Mascota' : 'Agregar Nueva Mascota'}</DialogTitle>
              <DialogDescription>
                Completa la información de la mascota.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 overflow-y-auto pr-4">
              <form onSubmit={onSubmitMascota} className="space-y-6 pb-4">
                
                <Accordion type="multiple" defaultValue={["basic", "phys", "care", "compatibility", "health", "photos"] as any}>
                  
                  <AccordionItem value="basic">
                    <AccordionTrigger className="text-lg font-medium">Información Básica</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nombre">Nombre *</Label>
                          <Input
                            id="nombre"
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Rango de Edad *</Label>
                          <Select value={form.edad} onValueChange={(v) => setForm({ ...form, edad: v as any })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CACHORRO">Cachorro</SelectItem>
                              <SelectItem value="JOVEN">Joven</SelectItem>
                              <SelectItem value="ADULTO">Adulto</SelectItem>
                              <SelectItem value="SENIOR">Senior</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Tipo de Animal *</Label>
                          <Select
                            value={form.tipo_animal}
                            onValueChange={(v) => setForm({ ...form, tipo_animal: v, raza: '' })}
                          >
                            <SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                            <SelectContent>
                              {tiposAnimales.map(t => (
                                <SelectItem key={t.id} value={String(t.id)}>
                                  {t.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Raza</Label>
                          <Select
                            value={form.raza}
                            onValueChange={(v) => setForm({ ...form, raza: v })}
                            disabled={!form.tipo_animal || razas.length === 0}
                          >
                            <SelectTrigger><SelectValue placeholder="Selecciona raza" /></SelectTrigger>
                            <SelectContent>
                              {razas.map(r => (
                                <SelectItem key={r.id} value={String(r.id)}>
                                  {r.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Sexo *</Label>
                          <Select value={form.sexo} onValueChange={(v) => setForm({ ...form, sexo: v as any })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MACHO">Macho</SelectItem>
                              <SelectItem value="HEMBRA">Hembra</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Estado *</Label>
                          <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v as any })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BORRADOR">Borrador</SelectItem>
                              <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                              <SelectItem value="RESERVADO">Reservado</SelectItem>
                              <SelectItem value="ADOPTADO">Adoptado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <Label>Descripción</Label>
                          <Textarea
                            value={form.descripcion}
                            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="phys">
                    <AccordionTrigger className="text-lg font-medium">Características Físicas</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tamaño</Label>
                          <Select value={form.tamano} onValueChange={(v) => setForm({ ...form, tamano: v as any })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PEQUENO">Pequeño</SelectItem>
                              <SelectItem value="MEDIANO">Mediano</SelectItem>
                              <SelectItem value="GRANDE">Grande</SelectItem>
                              <SelectItem value="GIGANTE">Gigante</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Color</Label>
                          <Input
                            value={form.color}
                            onChange={(e) => setForm({ ...form, color: e.target.value })}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="care">
                    <AccordionTrigger className="text-lg font-medium">Comportamiento y Cuidados</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nivel de Energía</Label>
                          <Select value={form.nivel_energia} onValueChange={(v) => setForm({ ...form, nivel_energia: v as any })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BAJA">Baja</SelectItem>
                              <SelectItem value="MEDIA">Media</SelectItem>
                              <SelectItem value="ALTA">Alta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Nivel de Cuidado</Label>
                          <Select value={form.nivel_cuidado} onValueChange={(v) => setForm({ ...form, nivel_cuidado: v as any })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BAJO">Bajo</SelectItem>
                              <SelectItem value="MEDIO">Medio</SelectItem>
                              <SelectItem value="ALTO">Alto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Compatibilidad */}
                  <AccordionItem value="compatibility">
                    <AccordionTrigger className="text-lg font-medium">Compatibilidad</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <Checkbox
                            checked={form.apto_ninos}
                            onCheckedChange={(c) => setForm({ ...form, apto_ninos: Boolean(c) })}
                          />
                          <label className="text-sm font-medium">Apto para Niños</label>
                        </div>

                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <Checkbox
                            checked={form.apto_apartamento}
                            onCheckedChange={(c) => setForm({ ...form, apto_apartamento: Boolean(c) })}
                          />
                          <label className="text-sm font-medium">Apto para Apartamento</label>
                        </div>

                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <Checkbox
                            checked={form.sociable_perros}
                            onCheckedChange={(c) => setForm({ ...form, sociable_perros: Boolean(c) })}
                          />
                          <label className="text-sm font-medium">Sociable con Perros</label>
                        </div>

                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <Checkbox
                            checked={form.sociable_gatos}
                            onCheckedChange={(c) => setForm({ ...form, sociable_gatos: Boolean(c) })}
                          />
                          <label className="text-sm font-medium">Sociable con Gatos</label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="health">
                    <AccordionTrigger className="text-lg font-medium">Salud</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <Checkbox
                            checked={form.esterilizado}
                            onCheckedChange={(c) => setForm({ ...form, esterilizado: Boolean(c) })}
                          />
                          <label className="text-sm font-medium">Esterilizado</label>
                        </div>

                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <Checkbox
                            checked={form.desparasitado}
                            onCheckedChange={(c) => setForm({ ...form, desparasitado: Boolean(c) })}
                          />
                          <label className="text-sm font-medium">Desparasitado</label>
                        </div>

                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <Checkbox
                            checked={form.microchip}
                            onCheckedChange={(c) => setForm({ ...form, microchip: Boolean(c) })}
                          />
                          <label className="text-sm font-medium">Microchip</label>
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <Label>Necesidades Especiales</Label>
                        <Textarea
                          value={form.necesidades_especiales}
                          onChange={(e) => setForm({ ...form, necesidades_especiales: e.target.value })}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="photos">
                    <AccordionTrigger className="text-lg font-medium">Fotos</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((num) => (
                          <div key={num} className="space-y-2">
                            <Label>{num === 1 ? 'Foto Principal' : `Foto ${num}`}</Label>
                            <div className="border-2 border-dashed rounded-lg p-4 hover:border-purple-500 transition-colors">
                              <input
                                type="file"
                                id={`foto${num}`}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFotoChange(e, num as 1 | 2 | 3)}
                              />
                              <label htmlFor={`foto${num}`} className="flex flex-col items-center gap-2 cursor-pointer">
                                {(num === 1 ? previewFoto1 : num === 2 ? previewFoto2 : previewFoto3) ? (
                                  <img
                                    src={num === 1 ? previewFoto1 : num === 2 ? previewFoto2 : previewFoto3}
                                    alt={`Preview ${num}`}
                                    className="w-full h-32 object-cover rounded"
                                  />
                                ) : (
                                  <>
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                    <span className="text-sm text-center">Subir foto</span>
                                  </>
                                )}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {isEditing ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={vacunasDialogOpen} onOpenChange={setVacunasDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vacunas de {mascotaSeleccionada?.nombre}</DialogTitle>
            <DialogDescription>
              Gestiona las vacunas aplicadas a esta mascota
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Vacunas registradas</Label>
              {vacunasActuales.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                  No hay vacunas registradas
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {vacunasActuales.map(v => (
                    <div key={v.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Syringe className="w-4 h-4 text-purple-500" />
                        <div>
                          <p className="font-medium text-sm">{v.tipo_vacuna_nombre}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {prettyFecha(v.fecha_aplicacion)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => onQuitarVacuna(v.id)}
                        disabled={loadingVacunas}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={onAgregarVacuna} className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <p className="font-medium text-sm">Agregar nueva vacuna</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Vacuna *</Label>
                  <Select
                    value={vacForm.tipo_vacuna}
                    onValueChange={(v) => setVacForm({ ...vacForm, tipo_vacuna: v })}
                    disabled={tiposVacunas.length === 0 || loadingVacunas}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona vacuna" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposVacunas.map(t => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Aplicación *</Label>
                  <Input
                    type="date"
                    value={vacForm.fecha_aplicacion}
                    onChange={(e) => setVacForm({ ...vacForm, fecha_aplicacion: e.target.value })}
                    disabled={loadingVacunas}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setVacunasDialogOpen(false)}>
                  Cerrar
                </Button>
                <Button type="submit" disabled={loadingVacunas || !vacForm.tipo_vacuna}>
                  {loadingVacunas ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Vacuna
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, raza o tipo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <Tabs defaultValue="todas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="todas">Todas ({grupos.todas.length})</TabsTrigger>
            <TabsTrigger value="disponibles">Disponibles ({grupos.disponibles.length})</TabsTrigger>
            <TabsTrigger value="reservadas">Reservadas ({grupos.reservadas.length})</TabsTrigger>
            <TabsTrigger value="borradores">Borradores ({grupos.borradores.length})</TabsTrigger>
            <TabsTrigger value="adoptadas">Adoptadas ({grupos.adoptadas.length})</TabsTrigger>
          </TabsList>

          {(['todas', 'disponibles', 'reservadas', 'borradores', 'adoptadas'] as const).map(tab => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {grupos[tab].length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No se encontraron mascotas
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grupos[tab].map((m) => (
                    <MascotaCard key={m.id} mascota={m} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}