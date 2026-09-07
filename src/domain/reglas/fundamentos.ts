/**
 * Fundamentos legales que el AlertDialog cita al rechazar un movimiento y que el
 * dictamen adjunta a cada regla.
 *
 * Las citas provienen del **Proyecto de Lineamientos para el Registro de
 * Candidaturas del PEL 2026-2027 de Durango** —«Lineamientos»— y de la Ley de
 * Instituciones y Procedimientos Electorales para el Estado de Durango
 * —«LIPEED»—, contrastadas artículo por artículo en
 * [docs/matriz-textos.md](../../../docs/matriz-textos.md).
 *
 * ADVERTENCIA: la referencia marcada con `PENDIENTE` no apunta a articulado
 * vigente y no debe inventarse. Un fundamento falso en un dictamen de
 * postulación es peor que uno ausente.
 *
 * Auditoría rápida de lo que falta: `grep -c PENDIENTE fundamentos.ts`
 */

export const FUNDAMENTOS = {
  homogeneidadGenero: `Artículo 53.2 de los Lineamientos. Las fórmulas se integran por una persona propietaria y una suplente del mismo género; cuando la fórmula esté encabezada por una mujer, en ningún momento el suplente podrá ser un hombre o una persona no binaria. Cuando la persona propietaria es hombre, la suplencia puede ser ocupada por una mujer o por una persona no binaria (artículo 53.1), y si es no binaria, la suplencia es libre (artículo 53.3).`,

  acreditacionCuota: `Artículo 5 fracción XV de los Lineamientos. Para que una fórmula cuente como postulada por una medida compensatoria, la persona propietaria y la suplente deben pertenecer a la misma, de modo que la sustitución no la vacíe. La fórmula que combina grupos distintos conserva plena validez y se registra sin medida compensatoria; lo único que no hace es acreditarla.`,

  convenio: `Artículo 9, numeral 1 de los Lineamientos. La coalición es total cuando abarca la totalidad de las candidaturas de mayoría relativa, parcial cuando abarca al menos el cincuenta por ciento y flexible cuando abarca al menos el veinticinco por ciento. Artículo 9, numeral 3: si el cálculo de ese porcentaje resulta en un número fraccionado, siempre se toma como cifra válida el número entero siguiente. En los distritos que el convenio no abarca, cada integrante realiza su postulación en lo individual y responde de ella con su propia competitividad.`,

  paridadGeneral: `Artículo 23, numeral 1 de los Lineamientos: se deberán postular candidaturas considerando por lo menos 50% de fórmulas del género femenino. Artículo 20, numeral 2, fracción I y II: en coalición total la paridad se verifica exclusivamente sobre el conjunto de la coalición y los partidos distribuyen los géneros libremente en los distritos que siglan; en coalición parcial o flexible el convenio debe ser paritario y, además, cada integrante garantiza su propia paridad global sumando lo que sigla más sus registros individuales. Artículo 20.3: la candidatura común exige las dos, la del convenio y la de cada partido.`,

  paridadBloques: `Artículo 26, numeral 3 de los Lineamientos: en cada bloque se deberán postular 3 fórmulas de candidaturas de un mismo género y 2 del otro. Artículo 28, numeral 3: en la postulación de diputaciones por el principio de mayoría relativa se deberá asegurar la integración paritaria en cada bloque. Artículo 22, numeral 1: los partidos no podrán postular menos mujeres de las que se establecen para cada bloque, aun cuando postulen más en cualquiera de los otros.`,

  liderazgoBloque: `Artículo 28, numeral 1 de los Lineamientos. En el caso de que se conformen los tres bloques de competitividad con los quince distritos del Estado, al menos uno de ellos deberá ser encabezado por una fórmula integrada por mujeres, evaluando el distrito de mayor porcentaje de votación de cada bloque. > La regla está condicionada a ese supuesto y no alcanza a los bloques parciales.`,

  mayoriaBloqueImpar: `Artículo 28, numeral 4 de los Lineamientos. En caso de conformar los tres bloques por un número impar de distritos cada uno, al menos dos de ellos deberán integrarse por mayoría de fórmulas encabezadas por mujeres. Artículo 28, numeral 5 de los Lineamientos: de los tres bloques que se conformen, en caso de que dos bloques o solo uno de ellos sean integrados por un número impar de distritos, al menos uno de dichos bloques deberá integrarse por mayoría de fórmulas encabezadas por mujeres.`,

  blindajeBaja: `Artículo 28, numeral 2 de los Lineamientos. En el tercer bloque de competitividad, en ningún caso se podrán postular candidaturas del género femenino en los dos últimos distritos de menor porcentaje de votación. Artículo 28, numeral 7: cuando los bloques se integren por dos distritos cada uno, la prohibición alcanza al último distrito del último bloque. Artículo 21, numeral 1: en ningún caso se admitirá postular candidaturas de forma exclusiva de mujeres en los distritos de menor votación, obligación que corresponde a cada partido en lo individual aun cuando compita en coalición o candidatura común.`,

  cuotaJoven: `Artículo 54, numeral 1 de los Lineamientos. Los partidos políticos, coaliciones o candidaturas comunes deberán presentar cuando menos una fórmula de mayoría relativa en la que tanto la persona propietaria como la suplente cuenten hasta con treinta años cumplidos al día de la elección. Al enlistar a las coaliciones y candidaturas comunes como sujetos obligados, una sola fórmula satisface la medida de toda la alianza dentro del convenio. Artículo 27, numeral 4, fracción V: en los distritos que cada partido postula en lo individual, la medida se cumple en proporción al número de distritos que integre cada bloque, y en lo que resulte aplicable.`,

  cuotaIndigena: `Artículo 56, numeral 1 de los Lineamientos: en el caso del distrito con mayor población indígena (Distrito XV), los partidos políticos **podrán** postular a una fórmula integrada por personas de origen étnico. Artículo 56, numeral 2: la postulación de fórmulas integradas por personas de origen étnico en distritos distintos al XV es igualmente optativa más no limitativa. No es un espacio reservado: el Distrito XV admite cualquier fórmula, y no postular ahí la medida no constituye incumplimiento.`,

  umbralRegistroRP: `Artículo 75, numeral 1, fracción I: Los partidos políticos, coaliciones o candidaturas comunes deberán registrar candidaturas de mayoría relativa en cuando menos once de los distritos electorales uninominales en que se divide el Estado para tener derecho a la asignación de diputaciones de representación proporcional. Postular no es siglar: el partido que firma un convenio postula en todos los distritos que el convenio abarca, con independencia de a quién se siglen. El siglado sirve al reparto de votos, al financiamiento y a la integración de la Lista "B", no al alcance territorial de la postulación.`,

  alternanciaRP: `Artículo 53, numeral 5 de los Lineamientos. La Lista "A" se integra de forma alternada entre ambos géneros, en orden de prelación y de manera sucesiva. Artículo 19.2: para efectos del cumplimiento de la regla de alternancia se considerará el género de la persona propietaria de la fórmula.`,

  encabezadoCompensatorioRP: `Artículos 53, numerales 6 y 7 de los Lineamientos. Si más del cincuenta por ciento de las postulaciones de mayoría relativa corresponde a hombres, la primera candidatura de representación proporcional deberá ser para una mujer, la segunda para un hombre, y así sucesivamente; si más del cincuenta por ciento corresponde a mujeres, la primera deberá ser para un hombre. En caso de equivalencia exacta del cincuenta por ciento para cada género, el partido determina libremente el género que encabeza su Lista "A".`,

  accionAfirmativaRP: `Artículo 55, numeral 1 de los Lineamientos. Los partidos políticos de manera individual deberán presentar al menos una fórmula dentro de los primeros tres lugares de su Lista "A" que corresponda a personas con discapacidad permanente, de la diversidad sexual, adultas mayores o migrantes, en la que tanto la persona propietaria como la suplente pertenezcan al mismo grupo. Artículo 56: formas de acreditación de cada grupo o sector social en desventaja.`,
} as const
