## ARQUITECTURA DE AUTENTICACIÓN - ANGULAR + FASTAPI

### 📋 ÍNDICE

1. [Estructura de Carpetas](#estructura-de-carpetas)
2. [Flujo de Autenticación](#flujo-de-autenticación)
3. [Servicios Core](#servicios-core)
4. [Seguridad y Guards](#seguridad-y-guards)
5. [Manejo de Estado](#manejo-de-estado)
6. [Integración con FastAPI](#integración-con-fastapi)
7. [Mejores Prácticas](#mejores-prácticas)

---

## Estructura de Carpetas

```
src/app/
├── core/                          # Servicios singleton, guards, interceptores
│   ├── auth/
│   │   ├── auth.service.ts        # Servicio principal de autenticación
│   │   ├── storage.service.ts     # Abstracción de localStorage
│   │   └── jwt.service.ts         # Decodificación y validación de JWT
│   ├── guards/
│   │   └── auth.guard.ts          # Guards de rutas protegidas
│   ├── interceptors/
│   │   └── jwt.interceptor.ts     # Agrega token JWT a requests
│   ├── models/
│   │   └── auth.models.ts         # Interfaces y tipos de autenticación
│   └── utils/
│       └── validation.utils.ts    # Validadores reutilizables
│
├── features/                      # Módulos de negocio
│   ├── auth/
│   │   ├── pages/
│   │   │   ├── login/
│   │   │   │   ├── login.component.ts
│   │   │   │   ├── login.component.html
│   │   │   │   └── login.component.css
│   │   │   └── register/
│   │   │       ├── register.component.ts
│   │   │       ├── register.component.html
│   │   │       └── register.component.css
│   │   ├── models/
│   │   │   └── register.model.ts   # Modelos específicos del registro
│   │   ├── auth.routes.ts         # Rutas del módulo auth
│   │   └── components/            # Componentes reutilizables (future)
│   └── dashboard/
│       ├── dashboard.component.ts
│       ├── dashboard.component.html
│       └── dashboard.component.css
│
├── environments/                   # Configuración por ambiente
│   ├── environment.ts             # Desarrollo
│   └── environment.prod.ts        # Producción
│
├── app.routes.ts                  # Rutas principales
├── app.config.ts                  # Configuración global
└── app.ts                         # Root component
```

---

## Flujo de Autenticación

### LOGIN FLOW

```
┌─────────────────────────────────────────────────────┐
│  Usuario ingresa credenciales en LoginComponent     │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ Validación local    │
        │ (Formulario)        │
        └─────────┬───────────┘
                  │
                  ▼
       ┌──────────────────────┐
       │ AuthService.login()  │ ◄─── HTTP POST /api/taller/login
       │ (Observable)         │
       └─────────┬────────────┘
                 │
           ┌─────┴─────┐
           │           │
        SUCCESS     ERROR
           │           │
           ▼           ▼
    ┌────────────┐  ┌──────────────┐
    │ Token + User  │  │ Mostrar Error│
    │ en Storage  │  │ setError()   │
    │ (localStorage)│  │              │
    └────┬───────┘  └──────────────┘
         │
         ▼
    ┌──────────────────┐
    │ Update Auth State│
    │ (BehaviorSubject)│
    └────┬───────────┘
         │
         ▼
    ┌──────────────────┐
    │ Navigate to      │
    │ /dashboard       │
    └──────────────────┘
```

### REGISTRO FLOW

```
┌──────────────────────────────────────┐
│  Usuario completa formulario         │
│  (3 pasos)                           │
└──────────┬───────────────────────────┘
           │
           ▼
   ┌───────────────────┐
   │ Validación Global │
   │ (Campos + Custom) │
   └───────┬───────────┘
           │
           ▼
  ┌────────────────────────┐
  │ AuthService.register() │  ◄─── HTTP POST /api/taller/register
  │ (Observable)           │
  └────────┬───────────────┘
           │
        ┌──┴──┐
    SUCCESS   ERROR
        │       │
        ▼       ▼
   ┌───────┐┌──────────┐
   │Success││Error Msg │
   │Message││(mostrar)│
   └───┬──┘└─────────┘
       │
       ▼
   ┌──────────────┐
   │Redirect Login│ (después 2s)
   └──────────────┘
```

---

## Servicios Core

### AuthService - Centro Neurálgico

**Responsabilidades:**
- Orquestar login/register/logout
- Mantener estado reactivo (BehaviorSubject)
- Manejo de errores
- Validación de tokens

**Patrón principal:**
```typescript
// Estado reactivo
private authState = new BehaviorSubject<AuthState>({...})
public auth$ = this.authState.asObservable();

// Observable selectors
isAuthenticated$() → Observable<boolean>
currentUser$() → Observable<CurrentUser | null>
loading$() → Observable<boolean>
error$() → Observable<string | null>
```

### StorageService - Persistencia

**Responsabilidades:**
- Guardar/obtener token
- Guardar/obtener usuario actual
- Limpiar sesión (logout)

**Ventajas:**
- Abstracción sobre localStorage
- Fácil migración a sessionStorage o métodos más seguros
- Manejo centralizado de errores

### JwtService - Decodificación

**Responsabilidades:**
- Decodificar JWT
- Validar expiración
- Calcular tiempo restante

**Por qué sin dependencias externas:**
- Angular 21+ incluye atob/btoa nativos
- Ahorra dependencia extra (jwt-decode)
- Compatible con SSR

---

## Seguridad y Guards

### Interceptor JWT

```
Request HTTP
   │
   ▼
┌──────────────────┐
│ JwtInterceptor   │
│ - Lee token      │
│ - Agrega header  │
│   Authorization  │
└────┬─────────────┘
     │
     ▼
  Backend
     │
     ├─ 200 OK ──────────────► Siguiente paso
     │
     └─ 401 Unauthorized ────► logout() + Redirige /login
```

**Ventajas:**
- Automático para todos los requests
- No requiere agregar token manualmente en cada servicio
- Manejo centralizado de 401s

### Guards de Rutas

```typescript
// AuthGuard - Protege rutas que requieren autenticación
canActivate: [authGuard]

// NoAuthGuard - Previene que usuarios autenticados accedan a login/register
canActivate: [noAuthGuard]
```

---

## Manejo de Estado

### Patrón: BehaviorSubject + Observable

```typescript
// Estado centralizado
authState: BehaviorSubject<AuthState>

// Acceso reactivo
auth$.subscribe(state => {
  state.isAuthenticated   // boolean
  state.currentUser       // CurrentUser | null
  state.token             // string | null
  state.loading           // boolean
  state.error             // string | null
})

// Selectores específicos
authService.isAuthenticated$() // Observable<boolean>
authService.currentUser$()     // Observable<CurrentUser | null>
```

**Ventajas:**
- Reactividad sin NgRx (más simple)
- Un único source of truth
- Fácil de debuggear

**Cuándo usar NgRx:**
- Si tienes múltiples features con estado complejo
- Cuando necesites devtools/time-travel debugging
- Equipos grandes con muchos desarrolladores

---

## Integración con FastAPI

### Request/Response Mapping

**Register:**
```typescript
// Frontend FormGroup
{
  nombre_contacto: "Juan",
  email: "juan@taller.com",
  password: "Segura1234",
  ...
}
     │
     ▼
// TallerRegisterRequest (modelo)
// Se mapea 1:1 con backend

// Backend devuelve:
{
  success: true,
  message: "Taller registrado"
}
```

**Login:**
```typescript
// Frontend FormGroup
{
  email: "juan@taller.com",
  password: "Segura1234"
}
     │
     ▼
// LoginRequest

// Backend devuelve:
{
  success: true,
  access_token: "eyJ0eXAiOiJKV1QiLCJhbGc...",
  user: {
    usuario_id: 1,
    nombre: "Juan",
    email: "juan@taller.com",
    estado: true,
    rol_id: 2,
    taller_id: 1,
    razon_social: "Mi Taller"
  }
}
```

### Headers HTTP

```
Authorization: Bearer <token>
Content-Type: application/json
```

El interceptor agrega automáticamente el header `Authorization`.

---

## Mejores Prácticas

### 1. **Separación de Responsabilidades**

✓ **BIEN:**
```
AuthService       → Lógica de negocio
StorageService    → Persistencia
JwtService        → Decodificación
Componentes       → Presentación
```

✗ **MAL:**
```
Todo en el componente
Lógica HTTP directa en componentes
```

### 2. **Validación Multicapa**

```
Frontend UI Validation      (errores de formato)
    │
Form Group Validation       (validadores custom)
    │
Request a Backend           (validación final + reglas de negocio)
    │
API Response Validation     (parsear respuesta correctamente)
```

### 3. **Unsubscribe Pattern**

```typescript
private destroy$ = new Subject<void>();

ngOnInit() {
  this.authService.loading$()
    .pipe(takeUntil(this.destroy$))  // ◄─ Unsubscribe automático
    .subscribe(...)
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

✓ Previene memory leaks
✓ Mejor que `.unsubscribe()` manual

### 4. **Manejo de Errores Clara**

```typescript
// Definir tipos de error
enum AuthErrorType {
  INVALID_CREDENTIALS,
  EMAIL_ALREADY_REGISTERED,
  NETWORK_ERROR,
  SERVER_ERROR,
  ...
}

// Parsear y categorizar
if (error.status === 400 && error.detail.includes('correo')) {
  return AuthErrorType.EMAIL_ALREADY_REGISTERED;
}
```

### 5. **Configuración por Ambiente**

```
environment.ts    → Desarrollo (localhost:8000)
environment.prod.ts → Producción (https://api.asistencia-vehicular.com)
```

Se selecciona automáticamente según `ng build` vs `ng build --configuration production`.

### 6. **Componentes Standalone**

```typescript
@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...],
  ...
})
```

✓ No requieren módulos (NgModule)
✓ Más simple y moderno
✓ Angular 14+ default

### 7. **Formularios Reactivos**

```typescript
// Ventajas sobre Template-driven:
- Más control
- Testeable
- Validadores custom
- Mejor performance en formularios complejos
- Sincronización de campos
```

---

## Testing (Próximas mejoras)

```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  it('should login and store token', () => {...})
  it('should handle invalid credentials', () => {...})
  it('should auto-logout on token expiration', () => {...})
})

// login.component.spec.ts
describe('LoginComponent', () => {
  it('should validate email format', () => {...})
  it('should disable submit on invalid form', () => {...})
})
```

---

## Migración Futura: NgRx

Si necesitas estado más complejo:

```typescript
// actions
register.action.ts
login.action.ts

// reducers
auth.reducer.ts

// effects
auth.effects.ts
  - Efectos secundarios (HTTP calls)
  - Notificaciones
  - Redirecciones

// selectors
auth.selector.ts
  - Reusable selectors
  - Memoized
```

---

## Checklist de Seguridad

- [x] JWT token en localStorage (seguro si HTTPS + CSP)
- [x] Token incluido en header Authorization
- [x] Validación de tokens expirados
- [x] Logout al recibir 401
- [x] Guards de rutas protegidas
- [x] Validación de formularios
- [x] HTTPS en producción
- [x] Configuración CORS en backend

---

## Próximos Pasos

1. **Dashboard Completo**
   - Solicitudes de incidentes
   - Detalle del incidente
   - Gestión de técnicos

2. **Notificaciones en Tiempo Real**
   - WebSocket/SignalR
   - Alertas de nuevas solicitudes

3. **Mapas y Geolocalización**
   - Google Maps/Leaflet
   - Ubicación de técnicos en vivo

4. **Sistema de Reportes**
   - Gráficos de desempeño
   - Historial de servicios

5. **Análisis IA**
   - Visualización de resultados IA
   - Categorización de incidentes

---

## Referencias Útiles

- [Angular Docs](https://angular.dev)
- [RxJS Documentation](https://rxjs.dev)
- [JWT Introduction](https://jwt.io/introduction)
- [OWASP Security Guidelines](https://owasp.org)
- [FastAPI Docs](https://fastapi.tiangolo.com)
