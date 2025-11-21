import { useState } from 'react';
import { LoginDobleFactor } from './components/LoginDobleFactor';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardUsuario } from './components/usuario/DashboardUsuario';
import { Toaster } from './components/ui/sonner';
import { AppProvider } from './context/AppContext';

type TipoUsuario = 'fundacion' | 'usuario';

export default function App() {
  const [autenticado, setAutenticado] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>('fundacion');

  const handleAutenticado = (tipo: TipoUsuario) => {
    setTipoUsuario(tipo);
    setAutenticado(true);
  };

  const handleCerrarSesion = () => {
    setAutenticado(false);
    setTipoUsuario('fundacion');
  };

  if (!autenticado) {
    return (
      <>
        <LoginDobleFactor onAutenticado={handleAutenticado} />
        <Toaster />
      </>
    );
  }

  return (
    <AppProvider>
      {tipoUsuario === 'fundacion' ? (
        <DashboardLayout onCerrarSesion={handleCerrarSesion} />
      ) : (
        <DashboardUsuario onCerrarSesion={handleCerrarSesion} />
      )}
      <Toaster />
    </AppProvider>
  );
}
