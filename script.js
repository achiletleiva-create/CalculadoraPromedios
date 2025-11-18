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

    if (!document.body.classList.contains('bloqueo-total')) {
        ciscoInput.disabled = bonificado;
        blackbInput.disabled = bonificado;

        // Si están bloqueados por bonificación, resetear sus valores a vacío
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
    
    if (bloquear) {
        document.body.classList.add('bloqueo-total');
    } else {
        document.body.classList.remove('bloqueo-total');
    }
    
    inputs_a_bloquear.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.disabled = bloquear;
            if (bloquear) {
                 input.value = ''; // Vacío si está bloqueado
            }
        }
    });

    checkboxes.forEach(checkbox => {
        checkbox.disabled = bloquear;
        if (bloquear) {
             checkbox.checked = false;
        }
    });
    
    // Si no estamos en bloqueo total, re-aplicamos la lógica de bonificación
    if (!bloquear) {
        const opcion3 = document.getElementById('opcion3cursos');
        const opcion2 = document.getElementById('opcion2cursos');
        const ciscoInput = document.getElementById('cisco');
        const blackbInput = document.getElementById('exblackb');
        
        const bonificado = opcion3.checked || opcion2.checked;
        ciscoInput.disabled = bonificado;
        blackbInput.disabled = bonificado;
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

    const PERC_CISCO = obtenerValor('cisco'); 
    const EXBLACKB = obtenerValor('exblackb');
    let EF = obtenerValor('ef'); // Nota EF base

    const opcion3cursos = document.getElementById('opcion3cursos').checked;
    const opcion2cursos = document.getElementById('opcion2cursos').checked;
    
    // CÁLCULO BASE DE PA3
    const Nota_CISCO_Base = (PERC_CISCO * 20) / 100;
    const PA3_Calculada = (Nota_CISCO_Base + EXBLACKB) / 2;
    let Nota_PA3_Original = Math.min(PA3_Calculada, 20); 

    let Nota_PA3_Ajustada = Nota_PA3_Original;
    let bonificacionEF = 0;
    
    document.getElementById('bonificacionEF').innerHTML = '';

    // APLICACIÓN DE BONIFICACIONES 
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
    
    // ***************************************************************
    // ** CORRECCIÓN DE LA LÓGICA DE REDONDEO **
    // ***************************************************************
    if (PF_Bruto >= 13.5) {
        // Si el alumno aprueba (PF Bruto >= 13.5), se aplica redondeo al entero más cercano.
        PF_Final = Math.round(PF_Bruto);
        
        // Aseguramos que, si por alguna razón el redondeo diera 13, se fije en 14 (regla de la UCV).
        if (PF_Final < NOTA_MINIMA_APROBACION) {
            PF_Final = NOTA_MINIMA_APROBACION; // En este caso, solo aplicaría si fuera exactamente 13.5, que Math.round ya lo lleva a 14.
        }
    } else {
        // Si desaprueba (PF Bruto < 13.5), se trunca (Math.floor)
        PF_Final = Math.floor(PF_Bruto);
    }
    // ***************************************************************

    // MOSTRAR CÁLCULOS INTERMEDIOS
    document.getElementById('resultadoNotaCisco').textContent = Nota_CISCO_Base.toFixed(2);
    document.getElementById('resultadoNotaPA3').textContent = Nota_PA3_Ajustada.toFixed(2);
    
    return { M1, M2, PF_Bruto, PF_Final, PA1, PA2, PERC_CISCO, EXBLACKB, EP, EF_Ajustado, Nota_PA3_Ajustada, EF };
}

// -------------------------------------------------------------------
// 1. FUNCIÓN PRINCIPAL DE CÁLCULO Y ANÁLISIS
// -------------------------------------------------------------------

function calcularPromedio() {
    const PA1_val = obtenerValor('pa1');
    const EP_val = obtenerValor('ep');
    const PA2_val = obtenerValor('pa2');
    const M1_Calculado = (PA1_val * 0.40) + (EP_val * 0.60);
    
    const Nota_PA3_Max_Chequeo = 20; 

    // 1. Evaluar Bloqueo Total 
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
    
    const estadoElement = document.getElementById('estadoAprobacion');
    estadoElement.classList.remove('aprobado', 'desaprobado', 'simulacion');
    estadoElement.textContent = '';
    
    // ----------------------------------------------------------------
    // ANÁLISIS DE M1
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
    // ANÁLISIS DE ESPERANZA/BLOQUEO
    // ----------------------------------------------------------------
    
    if (bloqueoTotalNecesario) {
        document.getElementById('analisisEsperanza').innerHTML = `
            <div class="alerta-imposible">
                **⛔ BLOQUEO DE ESPERANZA:** Con tus notas ingresadas, tu promedio final máximo posible es ${PF_Maximo_Actual.toFixed(2)}. Es imposible alcanzar 14.
            </div>
        `;
        estadoElement.textContent = `🚫 Resultado: Imposible Aprobar. PF Máximo: ${PF_Maximo_Actual.toFixed(0)}.`;
        estadoElement.classList.add('desaprobado');
        return; 
    } 
    else if (PA2_val > 0) { 
         document.getElementById('analisisEsperanza').innerHTML = `
            <div class="alerta-aprobacion">
                **💡 ANALIZA:** Tu M1 y PA2 te permiten aprobar. Sigue concentrado en lo que falta.
            </div>
        `;
    }


    // ----------------------------------------------------------------
    // RESULTADO FINAL
    // ----------------------------------------------------------------

    if (PF_Final >= NOTA_MINIMA_APROBACION) {
        estadoElement.textContent = `¡Felicidades! Aprobaste con ${PF_Final.toFixed(0)}. 🎉`;
        estadoElement.classList.add('aprobado');
        return;
    }

    // D. Detección de notas faltantes (Simulación de Recuperación)
    const opcion3 = document.getElementById('opcion3cursos');
    const opcion2 = document.getElementById('opcion2cursos');
    const hayBonificacion = opcion3.checked || opcion2.checked;
    
    let notasFaltantes = PA2_val === 0 || EF === 0; 

    if (!hayBonificacion) {
        notasFaltantes = notasFaltantes || PERC_CISCO === 0 || EXBLACKB === 0;
    }

    const analisisM1 = simularAprobacionM1(M1); 

    if (notasFaltantes) {
        estadoElement.textContent = `🚨 Tu promedio actual es ${PF_Final}. ¡Aún tienes opciones de aprobar!`;
        estadoElement.classList.add('simulacion');
        mostrarMensajeAyudaFinal(M1, analisisM1.PF_Necesario);
    } 
    // E. Si NO faltan notas (todas > 0) Y PF es reprobatorio (FINALIZACIÓN)
    else if (EF > 0 && PF_Final < NOTA_MINIMA_APROBACION) {
        estadoElement.textContent = `😭 **FINAL DEL PROMEDIO:** Tu Promedio Final (${PF_Final}) no alcanza el mínimo de 14. Debes consultar el proceso de subsanación.`;
        estadoElement.classList.add('desaprobado');
        mostrarMensajeAyudaFinal(M1, 0, false); 
    }
}

// -------------------------------------------------------------------
// 2. FUNCIONES DE SIMULACIÓN Y BLOQUEO (Sin cambios)
// -------------------------------------------------------------------

function calcularPFMaximoParcial(M1, PA2, Nota_PA3_Max_Chequeo) {
    let M2_Maximo_Parcial = 0;
    M2_Maximo_Parcial += obtenerValor('pa2') * 0.30;
    M2_Maximo_Parcial += Nota_PA3_Max_Chequeo * 0.10;
    
    let EF_Maximo_Teorico = 20 + 2; 
    EF_Maximo_Teorico = Math.min(EF_Maximo_Teorico, 20);

    M2_Maximo_Parcial += EF_Maximo_Teorico * 0.60;

    const M2_Maximo = Math.min(M2_Maximo_Parcial, 20); 
    return (M1 + M2_Maximo) / 2;
}

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
// 4. FUNCIÓN PARA LIMPIAR LOS CAMPOS (Actualizado para dejar vacío)
// -------------------------------------------------------------------

function limpiarCampos() {
    manejarBloqueoTotal(false);
    
    document.querySelectorAll('input[type="text"]').forEach(input => {
        input.value = '';
        input.disabled = false;
    });
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
        checkbox.disabled = false;
    });
    
    calcularPromedio(); 
}


// -------------------------------------------------------------------
// 5. INICIALIZACIÓN
// -------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input[type="text"]').forEach(input => {
        input.addEventListener('input', calcularPromedio); 
    });
    
    // El evento change es clave para los checkboxes de bonificación
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', calcularPromedio); 
    });
    
    limpiarCampos(); 
});
