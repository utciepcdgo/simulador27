Tienes toda la razón. Una disculpa por la omisión. Al abstraer, dejé fuera las estructuras de datos estáticas (el catálogo) y el modelo de estado dinámico que acordamos para las coaliciones, los cuales son el verdadero "motor" de esta herramienta.

Aquí tienes la **versión 2.0 y definitiva del Technical Brief (PRD)**, exhaustiva y con todas las interfaces, configuraciones de bloques y modelos de estado exactamente como los definimos. Este documento está listo para ser el *prompt* maestro de cualquier agente de desarrollo.

---

# 📄 TECHNICAL BRIEF V2.0: Simulador de Postulaciones Electorales ("Laboratorio Lógico")

## 1. CONTEXTO Y OBJETIVO

Desarrollo de una Aplicación Web de Página Única (SPA) para simular y validar legalmente la postulación de candidaturas electorales (15 distritos de Mayoría Relativa y 5 escaños de Representación Proporcional) en Durango.
**Restricción absoluta:** El sistema NO captura nombres; trabaja con "Tokens" anónimos basados en atributos jurídicos para evaluar paridad, bloques y cuotas de inclusión.

## 2. STACK TECNOLÓGICO

* **Lenguaje:** TypeScript (Tipado estricto para modelos jurídicos).
* **Frontend:** React.js con gestor de estado global (Zustand o Redux).
* **UI/Estilos:** Tailwind CSS + `shadcn/ui` (Cards, Badges, AlertDialog, Tabs, Select, Toast).
* **Interactividad D&D:** `dnd-kit` (con desactivación condicional vía *media queries* para vista móvil).

## 3. MODELO DE DATOS ESTÁTICO (EL "CEREBRO" PRECONFIGURADO)

El sistema NO calcula la rentabilidad al vuelo. Consume un catálogo estático preaprobado por el Consejo General del IEPC, el cual define los 3 bloques de competitividad por partido.

```typescript
// 1. Estructura del Catálogo Base
interface CatalogoPartido {
  id_partido: string;           // Ej. "PAN"
  nombre_partido: string;
  distritos: DistritoEstatico[];
}

// 2. Configuración inmutable de Competitividad
interface DistritoEstatico {
  id_distrito: number;          // 1 al 15
  numero_romano: string;        // "I" al "XV"
  cabecera: string;             // Ej. "Mezquital"
  bloque: "Alta" | "Media" | "Baja"; 
  posicion_rentabilidad: number; // 1 al 15 (Ordenados por votación histórica)
  requiere_indigena: boolean;    // true exclusivamente para el Distrito XV
}

```

## 4. MODELO DE ESTADO DINÁMICO (LA INTERACCIÓN DEL USUARIO)

Cuando el usuario interactúa, los datos estáticos se transforman en el estado global interactivo.

```typescript
// 3. Estado del Distrito en el Tablero de Juego (Se llena en la Fase 1 y 2)
interface DistritoActivo extends DistritoEstatico {
  bloque_coalicion: "Alta" | "Media" | "Baja"; // Recalculado si es alianza
  partido_siglado: string | null;              // Atribuido mediante Drag & Drop (Fase 1)
  formula_asignada: TokenFormula | null;       // Atribuido mediante Drag & Drop (Fase 2)
}

// 4. Estructura del Token (Fórmula Anónima)
interface TokenFormula {
  propietario: PerfilCandidato;
  suplente: PerfilCandidato;
}

// 5. Atributos Jurídicos del Perfil
interface PerfilCandidato {
  genero: "Mujer" | "Hombre" | "No Binario";
  esJoven: boolean; // <= 30 años cumplidos al día de la elección
  accionAfirmativa: "Ninguna" | "Indígena" | "Discapacidad" | "Diversidad Sexual" | "Migrante";
}

```

## 5. ARQUITECTURA DE INTERFAZ (UI/UX) Y FLUJOS

### Fase 1: Armador de Convenios de Coalición ("Mesa de Negociación")

* **Vista Desktop (Drag & Drop):** Una bandeja superior (*Bandeja de salida*) muestra 15 cajas compactas numeradas con romanos (I al XV). El área inferior se divide en $N$ columnas vacías (donde $N$ es el número de partidos aliados). El usuario arrastra una caja distrital hacia una columna para asignar el `partido_siglado`.
* **Vista Mobile (Selects):** El motor D&D se desactiva. Aparece una lista vertical de 15 distritos con un menú desplegable (`Select` de *shadcn*) al lado de cada uno para asignar el partido.

### Fase 2: Tablero Lógico de Postulaciones

* **Área de Trabajo:** Tablero Kanban de 3 columnas/filas (Bloques: 🟢 Alta, 🟡 Media, 🔴 Baja).
* **Componente Card Distrital:** Cada distrito activo muestra un `Badge` en la esquina superior indicando el partido que lo sigla (según lo definido en Fase 1), y dos *drop zones* vacías (Propietario y Suplente).

## 6. MOTOR DE VALIDACIÓN Y REGLAS DE UI ("Efecto Rebote")

El motor evalúa las reglas en tiempo real. En caso de coalición, ejecuta doble validación: **Global** (la alianza) e **Individual** (los distritos de un solo `partido_siglado`).

Si una regla se rompe, se dispara:

1. **Efecto Rebote visual:** El Token regresa a su origen.
2. **AlertDialog (Pop-up):** Cita textualmente la ley infringida.

### Matriz de Reglas a Evaluar:

**A. Construcción de Tokens (Homogeneidad)**

* Si Propietaria es Mujer -> Suplente debe ser obligatoriamente Mujer.

**B. Mayoría Relativa (MR - Los 15 Distritos)**

* **Paridad General:** Al menos 50% de fórmulas encabezadas por mujeres (Mínimo 8).
* **Paridad de Bloques:** Cada bloque debe tener estructura 3-2 o 2-3 (géneros).
* **Liderazgo de Bloque:** Al menos uno de los tres bloques debe estar encabezado por una mujer (evaluando el distrito con `posicion_rentabilidad`: 1, 6 u 11).
* **Blindaje en Rentabilidad Baja:** Si `posicion_rentabilidad` es 14 o 15, bloqueo absoluto para postular fórmulas de Mujeres.
* **Cuotas:** Al menos 1 fórmula `esJoven === true` en los 15 distritos; y al menos 1 fórmula `Indígena` en el Distrito XV.

**C. Representación Proporcional (RP - Lista "A" 5 Posiciones)**

* *Nota:* La Lista "A" se construye de manera **individual por partido**, basándose en el desempeño de Mayoría Relativa de ese partido en específico.
* **Alternancia (Cremallera):** Los géneros se intercalan verticalmente sin excepción.
* **Encabezado Compensatorio:**
* Si MR Individual > 50% Hombres -> Posición 1 de RP = Bloqueada para Mujer.
* Si MR Individual > 50% Mujeres -> Posición 1 de RP = Bloqueada para Hombre.


* **Acciones Afirmativas:** Al menos un perfil con `accionAfirmativa` distinta a "Ninguna" en las posiciones 1, 2 o 3.