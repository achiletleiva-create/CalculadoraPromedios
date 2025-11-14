// Constante para la nota mínima de aprobación
const NOTA_MINIMA_APROBACION = 14; 

// Función para obtener valores y validar rangos (0-20 para notas, 0-100 para porcentaje)
function obtenerValor(id) {
    const input = document.getElementById(id);
    let valor = parseFloat(input.value);

    // Si es %CISCO, el máximo es 100
    if (id === 'cisco') {
        if (isNaN(valor) || valor < 0) valor = 0;
        else if (valor > 100) valor = 100;
    } 
    // Para todas las demás notas, el máximo es 20
    else {
        if (isNaN(valor) || valor < 0) valor = 0;
        else if (valor > 20) valor = 20;
    }
    
    // Actualizar el input con el valor validado
    input.value = valor;
    return valor;
}

// -------------------------------------------------------------------
// 1. FUNCIÓN DE CÁLCULO DE PROMEDIOS (SE EJECUTA AL PRESIONAR EL BOTÓN)
// -------------------------------------------------------------------

function calcularPromedio() {
    // A. Obtener valores de entrada
    const PA1 = obtenerValor('pa1');
    const PA2 = obtenerValor('pa2');
    const PERC_CISCO = obtenerValor('cisco'); 
    const EXBLACKB = obtenerValor('exblackb');
    const EP = obtenerValor('ep');
    const EF = obtenerValor('ef');

    // B. Cálculo de M1 y PA3
    const M1 = (PA1 * 0.40) + (EP * 0.60);
    const Nota_CISCO_Base = (PERC_CISCO * 20) / 100;
    const PA3_Calculada = (Nota_CISCO_Base + EXBLACKB) / 2;
    const Nota_PA3 = Math.min(PA3_Calculada, 20); 

    // C. Cálculo de M2 y PF
    const M2 = (PA2 * 0.30) + (Nota_PA3 * 0.10) + (EF * 0.60);
    let PF_Bruto = (M1 + M2) / 2;

    // D. Aplicar Reglas de Redondeo y Mostrar Resultados
    document.getElementById('resultadoM1').textContent = M1.toFixed(2);
    document.getElementById('resultadoM2').textContent = M2.toFixed(2);
    
    // El Promedio Final (PF) se redondea a Entero si es >= 13.5
    let PF_Final = PF_Bruto;
    if (PF_Bruto >= 13.5 && PF_Bruto < 14) {
        PF_Final = NOTA_MINIMA_APROBACION; // Redondea a 14
    } else {
        PF_Final = Math.round(PF_Bruto); // Para todos los demás casos, redondeo estándar
    }
    
    // Mostrar PF (Entero, pero el usuario debe ver que la base fue de 13.5 para que suba a 14)
    document.getElementById('resultadoPF').textContent = PF_Final.toFixed(0); 

    // E. Determinar estado de aprobación
    const estadoElement = document.getElementById('estadoAprobacion');
    estadoElement.classList.remove('aprobado', 'desaprobado', 'simulacion');
    
    if (PF_Final >= NOTA_MINIMA_APROBACION) {
        estadoElement.textContent = `¡Felicidades! Aprobaste con ${PF_Final.toFixed(0)}. 🎉`;
        estadoElement.classList.add('aprobado');
    } else {
        // Si no aprueba, pasamos al análisis de simulación
        const analisis = simularAprobacion(M1);
        
        if (analisis.puedeAprobar) {
            estadoElement.textContent = `🚨 Necesitas ${analisis.PF_Necesario.toFixed(2)} para aprobar. ¡Aún puedes lograrlo!`;
            estadoElement.classList.add('simulacion');
            // Llamamos a una función para mostrar el mensaje de ayuda
            mostrarMensajeAyuda(PF_Bruto, analisis.PF_Necesario);

        } else {
            estadoElement.textContent = `⚠️ **Notas muy bajas.** Con tu M1 (${M1.toFixed(2)}), es imposible aprobar (mínimo ${NOTA_MINIMA_APROBACION}). Tu nota máxima es ${analisis.PF_Maximo.toFixed(2)}.`;
            estadoElement.classList.add('desaprobado');
            mostrarMensajeAyuda(PF_Bruto, 0, false);
        }
    }
}

// -------------------------------------------------------------------
// 2. FUNCIÓN DE SIMULACIÓN (ANÁLISIS DE APROBACIÓN)
// -------------------------------------------------------------------

function simularAprobacion(M1) {
    // A. Calcular el Promedio Final Máximo posible
    // Asumimos M2 máximo = 20 (PA2=20, PA3=20, EF=20)
    // El M2 máximo es siempre 20 si todas las notas son 20.
    const M2_Maximo = 20; 
    const PF_Maximo = (M1 + M2_Maximo) / 2;

    // B. Determinar si Aprobación es posible
    const puedeAprobar = (PF_Maximo >= 14);

    // C. Calcular el M2 que se necesita para obtener PF = 14
    // PF = (M1 + M2) / 2  =>  28 = M1 + M2  =>  M2_Necesario = 28 - M1
    const M2_Necesario = (NOTA_MINIMA_APROBACION * 2) - M1; 

    // D. Calcular el PF necesario para redondear a 14 (PF >= 13.5)
    // Si la nota real requerida es 13.5, necesitamos que M1 + M2 sea 27.
    const PF_Necesario_Bruto = (13.5 * 2) - M1;
    
    return {
        M2_Necesario: M2_Necesario,
        PF_Necesario: PF_Necesario_Bruto / 2, // Lo mostramos en formato PF
        PF_Maximo: PF_Maximo,
        puedeAprobar: puedeAprobar
    };
}


// -------------------------------------------------------------------
// 3. FUNCIÓN PARA MOSTRAR MENSAJES DE AYUDA / ALERTA
// -------------------------------------------------------------------

function mostrarMensajeAyuda(PF_Actual, PF_Necesario, puedeAprobar = true) {
    const contenedor = document.getElementById('mensajeAyuda');
    if (!contenedor) return; // Asegura que el contenedor exista

    if (puedeAprobar) {
        // Si aún puede aprobar, calculamos la nota M2 que necesita
        const M2_Requerido = (13.5 * 2) - obtenerValor('pa1') * 0.40 - obtenerValor('ep') * 0.60;
        
        contenedor.innerHTML = `
            <div class="alerta-aprobacion">
                <p>💡 **ANÁLISIS DE RECUPERACIÓN**</p>
                <p>Para alcanzar el mínimo aprobatorio (14), necesitas un Promedio Final de **13.5** (por la regla de redondeo).</p>
                <p>Esto implica que tu **Módulo 2 (M2)** debe ser, como mínimo, **${(M2_Requerido / 0.6).toFixed(2)}**</p>
                <p>Si obtienes el M2 requerido, tu PF será: ${PF_Necesario.toFixed(2)} **→ 14**</p>
            </div>
        `;
    } else {
        // Mensaje de advertencia de imposibilidad
        contenedor.innerHTML = `
            <div class="alerta-imposible">
                <p>⛔ **¡ATENCIÓN!**</p>
                <p>Con tus notas actuales en M1, incluso sacando 20 en todas las evaluaciones restantes (PA2, %CISCO, EXBLACKB., EF), no alcanzas el 14. Debes consultar con tu docente.</p>
            </div>
        `;
    }
}


// -------------------------------------------------------------------
// 4. INICIALIZACIÓN (Asegurarse de que el contenedor de ayuda esté en el HTML)
// -------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // Añadimos un contenedor para el mensaje de ayuda debajo de los resultados
    const resultsSection = document.querySelector('.results-section');
    if (resultsSection) {
        const divAyuda = document.createElement('div');
        divAyuda.id = 'mensajeAyuda';
        resultsSection.parentNode.insertBefore(divAyuda, resultsSection.nextSibling);
    }
    
    calcularPromedio();
});
