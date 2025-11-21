import { createContext, useContext, useState, ReactNode } from 'react';

interface Fundacion {
  id: number;
  nombre: string;
  fotoPerfil: string;
  fotoPortada: string;
  descripcion: string;
  ubicacion: string;
}

interface Mascota {
  id: number;
  nombre: string;
  edad: number;
  tipoAnimal: string;
  raza: string;
  sexo: 'macho' | 'hembra';
  esterilizado: boolean;
  vacunas: {
    rabia: boolean;
    parvovirus: boolean;
    moquillo: boolean;
    hepatitis: boolean;
    quintuple: boolean;
    triplefelina: boolean;
    leucemia: boolean;
    otras: string;
  };
  descripcion: string;
  fotos: string[];
  estado: 'disponible' | 'adoptado' | 'borrador';
  fundacionId: number;
}

interface SolicitudAdopcion {
  id: number;
  mascotaId: number;
  usuarioId: number;
  fundacionId: number;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fecha: string;
  nombreMascota: string;
  nombreFundacion: string;
}

interface Donacion {
  id: number;
  fundacionId: number;
  monto: number;
  tipo: 'unico' | 'mensual';
  fecha: string;
  donante: string;
}

interface Resena {
  id: number;
  fundacionId: number;
  usuarioNombre: string;
  calificacion: number;
  comentario: string;
  fecha: string;
}

interface AppContextType {
  fundaciones: Fundacion[];
  mascotas: Mascota[];
  solicitudesAdopcion: SolicitudAdopcion[];
  donaciones: Donacion[];
  resenas: Resena[];
  actualizarFundacion: (fundacion: Fundacion) => void;
  agregarMascota: (mascota: Mascota) => void;
  actualizarMascota: (mascota: Mascota) => void;
  agregarSolicitudAdopcion: (solicitud: SolicitudAdopcion) => void;
  actualizarSolicitudAdopcion: (id: number, estado: 'aprobada' | 'rechazada') => void;
  agregarDonacion: (donacion: Donacion) => void;
  agregarResena: (resena: Resena) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [fundaciones, setFundaciones] = useState<Fundacion[]>([
    {
      id: 1,
      nombre: 'Huellita de Amor',
      fotoPerfil: '',
      fotoPortada: '',
      descripcion: 'Fundación dedicada al rescate y adopción de mascotas en Tongoy, La Serena, Chile.',
      ubicacion: 'Tongoy, La Serena, Chile'
    }
  ]);

  const [mascotas, setMascotas] = useState<Mascota[]>([
    {
      id: 1,
      nombre: 'Max',
      edad: 3,
      tipoAnimal: 'Perro',
      raza: 'Golden Retriever',
      sexo: 'macho',
      esterilizado: true,
      vacunas: {
        rabia: true,
        parvovirus: true,
        moquillo: true,
        hepatitis: true,
        quintuple: true,
        triplefelina: false,
        leucemia: false,
        otras: ''
      },
      descripcion: 'Max es un perro muy juguetón y cariñoso, perfecto para familias con niños.',
      fotos: [
        'https://images.unsplash.com/photo-1738959921784-8e1b93054929?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZG9nJTIwcGV0fGVufDF8fHx8MTc1OTk5MTk1NHww&ixlib=rb-4.1.0&q=80&w=1080'
      ],
      estado: 'disponible',
      fundacionId: 1
    }
  ]);

  const [solicitudesAdopcion, setSolicitudesAdopcion] = useState<SolicitudAdopcion[]>([]);
  const [donaciones, setDonaciones] = useState<Donacion[]>([
    {
      id: 1,
      fundacionId: 1,
      monto: 25000,
      tipo: 'mensual',
      fecha: '2024-10-01',
      donante: 'María González'
    },
    {
      id: 2,
      fundacionId: 1,
      monto: 50000,
      tipo: 'unico',
      fecha: '2024-10-05',
      donante: 'Carlos Ruiz'
    },
    {
      id: 3,
      fundacionId: 1,
      monto: 15000,
      tipo: 'unico',
      fecha: '2024-10-10',
      donante: 'Ana Martínez'
    },
    {
      id: 4,
      fundacionId: 1,
      monto: 25000,
      tipo: 'mensual',
      fecha: '2024-09-01',
      donante: 'María González'
    },
    {
      id: 5,
      fundacionId: 1,
      monto: 100000,
      tipo: 'unico',
      fecha: '2024-09-15',
      donante: 'Empresa Tech Solutions'
    },
    {
      id: 6,
      fundacionId: 1,
      monto: 30000,
      tipo: 'mensual',
      fecha: '2024-08-01',
      donante: 'Pedro López'
    },
    {
      id: 7,
      fundacionId: 1,
      monto: 25000,
      tipo: 'mensual',
      fecha: '2024-08-01',
      donante: 'María González'
    },
    {
      id: 8,
      fundacionId: 1,
      monto: 20000,
      tipo: 'unico',
      fecha: '2024-08-20',
      donante: 'Laura Sánchez'
    },
    {
      id: 9,
      fundacionId: 1,
      monto: 75000,
      tipo: 'unico',
      fecha: '2024-07-10',
      donante: 'Fundación Ayuda Local'
    },
    {
      id: 10,
      fundacionId: 1,
      monto: 25000,
      tipo: 'mensual',
      fecha: '2024-07-01',
      donante: 'María González'
    }
  ]);
  const [resenas, setResenas] = useState<Resena[]>([
    {
      id: 1,
      fundacionId: 1,
      usuarioNombre: 'María González',
      calificacion: 5,
      comentario: '¡Excelente fundación! El proceso fue muy transparente y profesional.',
      fecha: '2024-10-15'
    },
    {
      id: 2,
      fundacionId: 1,
      usuarioNombre: 'Carlos Ruiz',
      calificacion: 5,
      comentario: 'Adopté a Luna hace 3 meses y estoy muy feliz. Gran seguimiento post-adopción.',
      fecha: '2024-09-22'
    }
  ]);

  const actualizarFundacion = (fundacion: Fundacion) => {
    setFundaciones(prev => prev.map(f => f.id === fundacion.id ? fundacion : f));
  };

  const agregarMascota = (mascota: Mascota) => {
    setMascotas(prev => [...prev, mascota]);
  };

  const actualizarMascota = (mascota: Mascota) => {
    setMascotas(prev => prev.map(m => m.id === mascota.id ? mascota : m));
  };

  const agregarSolicitudAdopcion = (solicitud: SolicitudAdopcion) => {
    setSolicitudesAdopcion(prev => [...prev, solicitud]);
  };

  const actualizarSolicitudAdopcion = (id: number, estado: 'aprobada' | 'rechazada') => {
    setSolicitudesAdopcion(prev => 
      prev.map(s => s.id === id ? { ...s, estado } : s)
    );
  };

  const agregarDonacion = (donacion: Donacion) => {
    setDonaciones(prev => [...prev, donacion]);
  };

  const agregarResena = (resena: Resena) => {
    setResenas(prev => [...prev, resena]);
  };

  return (
    <AppContext.Provider
      value={{
        fundaciones,
        mascotas,
        solicitudesAdopcion,
        donaciones,
        resenas,
        actualizarFundacion,
        agregarMascota,
        actualizarMascota,
        agregarSolicitudAdopcion,
        actualizarSolicitudAdopcion,
        agregarDonacion,
        agregarResena,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
