from rest_framework.permissions import BasePermission

class EsRefugio(BasePermission):
    
    message = 'Solo los usuarios de tipo Refugio pueden acceder a esta sección.'

    def has_permission(self, request, view):
        
        
        
        print("=============================================")
        print(f"🕵️  [Permiso EsRefugio] Verificando usuario...")
        
        if not request.user:
            print("   ❌ Error: request.user no existe.")
            print("=============================================")
            return False
            
        print(f"   👤 Usuario: {request.user.username} (ID: {request.user.id})")
        print(f"   🏷️  Tipo Usuario (en BD): '{request.user.tipo_usuario}'")
        
        
        es_refugio = request.user.is_authenticated and request.user.tipo_usuario == 'REFUGIO'
        
        if es_refugio:
            print("    Resultado: PERMITIDO (Es Refugio)")
        else:
            print("    Resultado: DENEGADO (No es Refugio)")
            
        print("=============================================")
        

        return es_refugio