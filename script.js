// Constante para la nota mínima de aprobación
const NOTA_MINIMA_APROBACION = 14; 

// -------------------------------------------------------------------
// FUNCIONES DE UTILIDAD
// -------------------------------------------------------------------

/**
 * Obtiene el valor de un input, convierte coma a punto, valida el rango y redondea a 2 decimales.
 * @param {string} id - El ID del elemento input.
 * @returns {number} El valor numérico limpio, limitado y redondeado.
 */
function obtenerValor(id) {
    const input = document.getElementById(id);
    let valorString = input.value;
    
    // Si está deshabilitado o vacío, retorna 0.00 para el cálculo. 
    // NO se modifica el input.value aquí si está vacío.
    if (input.disabled || valorString.trim() === '') {
        return 0;
    }
    
    // 1. Reemplazar coma por punto para el cálculo
    valorString = valorString.replace(',', '.');
    
    let valor = parseFloat(valorString);
    
    // Si no es un número válido, retorna 0 y limpia visualmente el input.
    if (isNaN(valor)) {
        input.value = '';
        return 0;
    }
    
    let valorLimitado = valor;

    // 2. Validación y limitación de rango
    if (id === 'cisco') {
        if (valorLimitado < 0) valorLimitado = 0;
        else if (valorLimitado > 100) valorLimitado = 100;
    } else {
        // Aplica para todas las notas de 0 a 20 
        if (valorLimitado < 0) valorLimitado = 0;
        else if (valorLimitado > 20) valorLimitado = 20;
    }
    
    // 3. Redondeo a 2 decimales para el cálculo
    valorLimitado = parseFloat(valorLimitado.toFixed(2));
    
    // 4. Corrección visual: Si el valor original ingresado es diferente al valor limitado,
    // o si el usuario usó una coma, forzamos la corrección visual en el input.
    if (valor !== valorLimitado || input.value.includes(',')) {
        let displayValue = valorLimitado.toFixed(2);
        // Mantenemos la coma si el usuario originalmente usó coma para la corrección visual
        if (input.value.includes(',')) {
            displayValue = displayValue.replace('.', ',');
        }
        input.value = displayValue;
    }
    
    return valorLimitado; // Retorna el valor limitado y redondeado para el cálculo
}

/**
 * Gestiona el chequeo mutuo de las casillas de bonificación y bloquea los campos de cálculo manual.
 * @param {string} idMarcado - El ID de la casilla que se acaba de marcar.
 */
function manejarBonificaciones(idMarcado) {
    const opcion3 = document.getElementById('opcion3cursos');
    const opcion2 = document.getElementById('opcion2cursos');
    const ciscoInput = document.getElementById('cisco');
    const blackbInput = document.getElementById('exblackb');

    // 1. Manejo Exclusivo (Solo una puede estar marcada)
    if (idMarcado === 'opcion3cursos' && opcion3.checked) {
        opcion2.checked = false;
    } else if (idMarcado === 'opcion2cursos' && opcion2.checked) {
        opcion3.checked = false;
    }

    // 2. Bloqueo/Desbloqueo de campos CISCO/BLACKB
    const bonificado = opcion3.checked || opcion2.checked;

    // Solo bloquear/desbloquear si NO estamos en un bloqueo total (si no hay bloqueo total, se usa esta lógica)
    if (!document.body.classList.contains('bloqueo-total')) {
        ciscoInput.disabled = bonificado;
        blackbInput.disabled = bonificado;

        // Si están bloqueados por bonificación, resetear sus valores a vacío (visual y cálculo)
        if (bonificado) {
            ciscoInput.value = '';
            blackbInput.value = '';
        }
    }

    // Volver a calcular para aplicar los cambios inmediatamente
    calcularPromedio(); 
}

/**
 * Bloquea TODAS las casillas de entrada **QUE NO DEFIENDEN LA ESPERANZA** si la aprobación es imposible.
 * @param {boolean} bloquear - True para bloquear, False para desbloquear.
 */
function manejarBloqueoTotal(bloquear) {
    const inputs_a_bloquear = ['cisco', 'exblackb', 'ef']; 
    const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    
    // Toggle de clase en el body
    if (bloquear) {
        document.body.classList.add('bloqueo-total');
    } else {
        document.body.classList.remove('bloqueo-total');
    }
    
    // 1. Bloqueamos/Desbloqueamos notas numéricas posteriores
    inputs_a_bloquear.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.disabled = bloquear;
            // Si estamos bloqueando, forzamos el valor a '' para el cálculo actual
            if (bloquear) {
                 input.value = '';
            }
        }
    });

    // 2. Bloqueamos/Desbloqueamos los checkboxes de bonificación
    checkboxes.forEach(checkbox => {
        checkbox.disabled = bloquear;
        // Si estamos bloqueando, desmarcamos los checkboxes para no aplicar el bono
        if (bloquear) {
             checkbox.checked = false;
        }
    });
    
    // 3. Si no estamos en bloqueo total, re-aplicamos la lógica de bonificación
    if (!bloquear) {
        const opcion3 = document.getElementById('opcion3cursos');
        const opcion2 = document.getElementById('opcion2cursos');
        const ciscoInput = document.getElementById('cisco');
        const blackbInput = document.getElementById('exblackb');
        
        const bonificado = opcion3.checked || opcion2.checked;
        ciscoInput.disabled = bonificado;
        blackbInput.disabled = bonificado;
        // Si no está bonificado, no borramos el contenido si existe, solo si está bloqueado.
    }
}


/**
 * Calcula las notas base, la Nota PA3, y aplica las bonificaciones.
 * @returns {object} Un objeto con todas las notas base y ajustadas.
 */
function obtenerNotasAjustadas() {
    const PA1 = obtenerValor('pa1');
    const PA2 = obtenerValor('pa2');
    const EP = obtenerValor('ep');

    // Los demás valores pueden ser 0 si han sido deshabilitados/bloqueados
    const PERC_CISCO = obtenerValor('cisco'); 
    const EXBLACKB = obtenerValor('exblackb');
    let EF = obtenerValor('ef'); // Nota EF base

    // Lógica para Bonificación (basada en el estado actual del checkbox)
    const opcion3cursos = document.getElementById('opcion3cursos').checked;
    const opcion2cursos = document.getElementById('opcion2cursos').checked;
    
    // CÁLCULO BASE DE PA3
    const Nota_CISCO_Base = (PERC_CISCO * 20) / 100;
    const PA3_Calculada = (Nota_CISCO_Base + EXBLACKB) / 2;
    let Nota_PA3_Original = Math.min(PA3_Calculada, 20); 

    let Nota_PA3_Ajustada = Nota_PA3_Original;
    let bonificacionEF = 0;
    
    document.getElementById('bonificacionEF').innerHTML = '';

    // APLICACIÓN DE BONIFICACIONES (Sobreescribe PA3 y EF)
    if (opcion3cursos) {
        Nota_PA3_Ajustada = 20;
        bonificacionEF = 2;
        document.getElementById('bonificacionEF').innerHTML = `<div class="mensaje-bono-ef">**¡Bonificación EF!** Se añaden +2 puntos a tu Examen Final.</div>`;
    } else if (opcion2cursos) {
        Nota_PA3_Ajustada = 16;
        bonificacionEF = 0;
    }
    
    let EF_Ajustado = Math.min(EF + bonificacionEF, 20);
    
    // CÁLCULOS FINALES CON NOTAS AJUSTADAS
    const M1 = (PA1 * 0.40) + (EP * 0.60);
    const M2 = (PA2 * 0.30) + (Nota_PA3_Ajustada * 0.10) + (EF_Ajustado * 0.60);
    
    let PF_Bruto = (M1 + M2) / 2;

    let PF_Final = PF_Bruto;
    if (PF_Bruto >= 13.5) {
        PF_Final = NOTA_MINIMA_APROBACION; 
    } else {
        PF_Final = Math.floor(PF_Bruto);
    }

    // MOSTRAR CÁLCULOS INTERMEDIOS
    document.getElementById('resultadoNotaCisco').textContent = Nota_CISCO_Base.toFixed(2);
    document.getElementById('resultadoNotaPA3').textContent = Nota_PA3_Ajustada.toFixed(2);
    
    return { M1, M2, PF_Bruto, PF_Final, PA1, PA2, PERC_CISCO, EXBLACKB, EP, EF_Ajustado, Nota_PA3_Ajustada, EF };
}

// -------------------------------------------------------------------
// 1. FUNCIÓN PRINCIPAL DE CÁLCULO Y ANÁLISIS
// -------------------------------------------------------------------

function calcularPromedio() {
    // 0. Obtener M1 y PA2 (estos inputs nunca se bloquean, por lo que son seguros)
    const PA1_val = obtenerValor('pa1');
    const EP_val = obtenerValor('ep');
    const PA2_val = obtenerValor('pa2');
    const M1_Calculado = (PA1_val * 0.40) + (EP_val * 0.60);
    
    // Asumimos PA3_Ajustada como 20 (máximo potencial) para el chequeo de bloqueo más estricto
    const Nota_PA3_Max_Chequeo = 20; 

    // 1. Evaluar Bloqueo Total (Con M1 y PA2 actuales, y asumiendo lo MEJOR en lo que falta)
    const PF_Maximo_Actual = calcularPFMaximoParcial(M1_Calculado, PA2_val, Nota_PA3_Max_Chequeo);
    const bloqueoTotalNecesario = (PF_Maximo_Actual < 13.5);
    
    manejarBloqueoTotal(bloqueoTotalNecesario);

    // 2. Recalcular todas las notas con el estado de bloqueo aplicado
    const notas = obtenerNotasAjustadas();
    const { M1, M2, PF_Final, PERC_CISCO, EXBLACKB, EF } = notas;

    // A. Mostrar Resultados
    document.getElementById('resultadoM1').textContent = M1.toFixed(2);
    document.getElementById('resultadoM2').textContent = M2.toFixed(2);
    document.getElementById('resultadoPF').textContent = PF_Final.toFixed(0); 

    // B. Limpiar Mensajes y Estados
    document.getElementById('mensajeAyuda').innerHTML = ''; 
    document.getElementById('analisisEsperanza').innerHTML = '';
    document.getElementById('mensajeMinimoM1').innerHTML = '';
    
    // Solo se limpia el bono EF si NO aplica en el nuevo cálculo (se maneja en obtenerNotasAjustadas)
    
    const estadoElement = document.getElementById('estadoAprobacion');
    estadoElement.classList.remove('aprobado', 'desaprobado', 'simulacion');
    estadoElement.textContent = '';
    
    // ----------------------------------------------------------------
    // PASO 1 y 2: ANÁLISIS DE M1 (Mínimo requerido para aprobar)
    // ----------------------------------------------------------------
    const M1_min_requerido = (13.5 * 2) - 20; 
    
    if (M1 < M1_min_requerido) {
        document.getElementById('mensajeMinimoM1').innerHTML = `
            <div class="alerta-imposible">
                **🚨 M1 crítico.** Tu M1 (${M1.toFixed(2)}) es tan bajo que la aprobación final es imposible, aunque saques 20 en M2.
            </div>
        `;
    } else {
        const M2_Necesario = (13.5 * 2) - M1;
         document.getElementById('mensajeMinimoM1').innerHTML = `
            <div class="alerta-aprobacion">
                **✅ M1 aceptable.** Para aprobar, tu **M2** necesita ser al menos **${M2_Necesario.toFixed(2)}**.
            </div>
        `;
    }

    // ----------------------------------------------------------------
    // PASO 3: ANÁLISIS DE ESPERANZA/BLOQUEO (Muestra el mensaje de bloqueo total)
    // ----------------------------------------------------------------
    
    if (bloqueoTotalNecesario) {
        document.getElementById('analisisEsperanza').innerHTML = `
            <div class="alerta-imposible">
                **⛔ BLOQUEO DE ESPERANZA:** Con tus notas ingresadas, tu promedio final máximo posible es ${PF_Maximo_Actual.toFixed(2)}. Es imposible alcanzar 14.
            </div>
        `;
        // Resultado final (desaprobación)
        estadoElement.textContent = `🚫 Resultado: Imposible Aprobar. PF Máximo: ${PF_Maximo_Actual.toFixed(0)}.`;
        estadoElement.classList.add('desaprobado');
        return; // Terminamos la ejecución si hay bloqueo total
    } 
    // Si la esperanza existe, mostramos un mensaje de aliento/recordatorio si ya se ingresó PA2
    else if (PA2_val > 0) { 
         document.getElementById('analisisEsperanza').innerHTML = `
            <div class="alerta-aprobacion">
                **💡 ANALIZA:** Tu M1 y PA2 te permiten aprobar. Sigue concentrado en lo que falta.
            </div>
        `;
    }


    // ----------------------------------------------------------------
    // RESULTADO FINAL (Solo si la esperanza no ha sido bloqueada)
    // ----------------------------------------------------------------

    // C. Lógica de Aprobación
    if (PF_Final >= NOTA_MINIMA_APROBACION) {
        estadoElement.textContent = `¡Felicidades! Aprobaste con ${PF_Final.toFixed(0)}. 🎉`;
        estadoElement.classList.add('aprobado');
        return;
    }

    // D. Detección de notas faltantes (Simulación de Recuperación)
    const opcion3 = document.getElementById('opcion3cursos');
    const opcion2 = document.getElementById('opcion2cursos');
    const hayBonificacion = opcion3.checked || opcion2.checked;
    
    // Chequeamos si alguna nota clave del M2 es 0, lo que indica simulación
    let notasFaltantes = PA2_val === 0 || EF === 0; 

    if (!hayBonificacion) {
        // Solo chequeamos CISCO/BLACKB si no hay bonificación
        notasFaltantes = notasFaltantes || PERC_CISCO === 0 || EXBLACKB === 0;
    }

    const analisisM1 = simularAprobacionM1(M1); 

    if (notasFaltantes) {
        // Si faltan notas y el resultado actual es reprobatorio
        estadoElement.textContent = `🚨 Tu promedio actual es ${PF_Final}. ¡Aún tienes opciones de aprobar!`;
        estadoElement.classList.add('simulacion');
        mostrarMensajeAyudaFinal(M1, analisisM1.PF_Necesario);
    } 
    // E. Si NO faltan notas (todas > 0) Y PF es reprobatorio (FINALIZACIÓN)
    else if (EF > 0 && PF_Final < NOTA_MINIMA_APROBACION) {
        // Se muestra directamente el mensaje de desaprobación final
        estadoElement.textContent = `😭 **FINAL DEL PROMEDIO:** Tu Promedio Final (${PF_Final}) no alcanza el mínimo de 14. Debes consultar el proceso de subsanación.`;
        estadoElement.classList.add('desaprobado');
        mostrarMensajeAyudaFinal(M1, 0, false); 
    }
}

// -------------------------------------------------------------------
// 2. FUNCIONES DE SIMULACIÓN Y BLOQUEO
// -------------------------------------------------------------------

/**
 * Calcula el PF Máximo posible asumiendo 20 en las notas faltantes.
 * @param {number} M1 - Promedio M1 (ya calculado).
 * @param {number} PA2 - Nota de PA2.
 * @param {number} Nota_PA3_Max_Chequeo - Nota de PA3 (20 en este caso para chequeo de máxima esperanza).
 * @returns {number} PF Máximo Posible.
 */
function calcularPFMaximoParcial(M1, PA2, Nota_PA3_Max_Chequeo) {
    let M2_Maximo_Parcial = 0;
    
    // 1. Considerar PA2 (30% de M2)
    M2_Maximo_Parcial += obtenerValor('pa2') * 0.30;
    
    // 2. Considerar PA3 (10% de M2) - Usamos Nota_PA3_Max_Chequeo (20) para el análisis de bloqueo
    M2_Maximo_Parcial += Nota_PA3_Max_Chequeo * 0.10;
    
    // 3. Considerar EF (60% de M2) - Asumimos 20 + 2 de bono máximo (truncado a 20)
    let EF_Maximo_Teorico = 20 + 2; 
    EF_Maximo_Teorico = Math.min(EF_Maximo_Teorico, 20);

    M2_Maximo_Parcial += EF_Maximo_Teorico * 0.60;

    const M2_Maximo = Math.min(M2_Maximo_Parcial, 20); 

    // PF Máximo:
    return (M1 + M2_Maximo) / 2;
}

/**
 * Análisis de Esperanza basado solo en M1 (para el mensaje final de ayuda).
 * @param {number} M1 - Promedio M1.
 */
function simularAprobacionM1(M1) {
    const M2_Maximo = 20; 
    const PF_Maximo = (M1 + M2_Maximo) / 2;
    const puedeAprobar = (PF_Maximo >= 13.5); 
    
    return {
        PF_Necesario: 13.5, 
        PF_Maximo: PF_Maximo,
        puedeAprobacion: puedeAprobar
    };
}


// -------------------------------------------------------------------
// 3. FUNCIÓN PARA MOSTRAR MENSAJES DE AYUDA / ALERTA FINAL
// -------------------------------------------------------------------

function mostrarMensajeAyudaFinal(M1, PF_Necesario, puedeAprobar = true) {
    const contenedor = document.getElementById('mensajeAyuda');
    
    if (puedeAprobar) {
        const M2_Requerido = (13.5 * 2) - M1; 
        
        contenedor.innerHTML = `
            <div class="alerta-aprobacion">
                <p>💡 **OPCIONES DE RECUPERACIÓN**</p>
                <p>Tu **M2** debe ser **${M2_Requerido.toFixed(2)}** o más para que tu PF alcance ${PF_Necesario.toFixed(2)} y redondee a ${NOTA_MINIMA_APROBACION}.</p>
            </div>
        `;
    } else {
        contenedor.innerHTML = `
            <div class="alerta-imposible">
                <p>⛔ **FIN DE OPCIONES**</p>
                <p>Tu PF máximo posible es **${calcularPFMaximoParcial(M1, obtenerValor('pa2'), 20).toFixed(2)}**. No es suficiente. Consulta con tu docente.</p>
            </div>
        `;
    }
}


// -------------------------------------------------------------------
// 4. FUNCIÓN PARA LIMPIAR LOS CAMPOS
// -------------------------------------------------------------------

function limpiarCampos() {
    // Desbloqueo primero para asegurar que todos los campos se reseteeen
    manejarBloqueoTotal(false);
    
    // Los campos de texto se resetean a vacío ('')
    document.querySelectorAll('input[type="text"]').forEach(input => {
        input.value = '';
        input.disabled = false;
    });
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
        checkbox.disabled = false;
    });
    
    // Ejecutamos calcularPromedio aquí para que la UI se actualice a 0.00 en todos los resultados
    calcularPromedio(); 
}


// -------------------------------------------------------------------
// 5. INICIALIZACIÓN
// -------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // 1. Agregar listeners a todos los inputs para la reactividad
    document.querySelectorAll('input[type="text"]').forEach(input => {
        // El evento 'input' se dispara en cada cambio de valor
        input.addEventListener('input', calcularPromedio); 
    });
    
    // 2. Inicializar la calculadora
    limpiarCampos(); 
});
