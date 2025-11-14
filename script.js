// Función principal para obtener los valores de las notas
function obtenerNota(id) {
    const input = document.getElementById(id);
    let valor = parseFloat(input.value);

    // Asegura que el valor esté entre 0 y 20
    if (isNaN(valor) || valor < 0) {
        valor = 0;
        input.value = 0;
    } else if (valor > 20) {
        valor = 20;
        input.value = 20;
    }

    return valor;
}

// Función para calcular y mostrar los promedios
function calcularPromedio() {
    // 1. Obtener valores de entrada
    const PA1 = obtenerNota('pa1');
    const PA2 = obtenerNota('pa2');
    const PERC_CISCO = obtenerNota('cisco'); // Se espera un valor de nota (0-20), NO un porcentaje.
    const EXBLACKB = obtenerNota('exblackb');
    const EP = obtenerNota('ep');
    const EF = obtenerNota('ef');

    // 2. Calcular PA3
    // PA3 = %CISCO * 20/100 + EXBLACKB (Se interpreta como: PA3 es un promedio ponderado de 20% CISCO y 80% EXBLACKB)
    // El porcentaje es implícito en la nota ya ingresada. La fórmula se interpreta como:
    // PA3 = (Nota CISCO * 0.20) + (Nota EXBLACKB * 0.80)
    // Si la nota %CISCO ya es el 20%, el código es:
    // PA3 = (PERC_CISCO) + EXBLACKB
    
    // **Interpretación más probable basada en el contexto UCV:**
    // PA3 es una nota que se calcula como una ponderación: 
    // PERC_CISCO contribuye 20% y EXBLACKB contribuye 80%.
    const PA3 = (PERC_CISCO * 0.20) + (EXBLACKB * 0.80);
    // Aseguramos que PA3 no exceda 20
    const Nota_PA3 = Math.min(PA3, 20);

    // 3. Calcular Promedio Módulo 1 (M1)
    // M1 = PA1 * 40% + EP * 60%
    const M1 = (PA1 * 0.40) + (EP * 0.60);

    // 4. Calcular Promedio Módulo 2 (M2)
    // M2 = PA2 * 30% + PA3 * 10% + EF * 60%
    const M2 = (PA2 * 0.30) + (Nota_PA3 * 0.10) + (EF * 0.60);

    // 5. Calcular Promedio Final (PF)
    // PF = (M1 + M2) / 2
    const PF = (M1 + M2) / 2;

    // 6. Formatear resultados a 2 decimales
    const M1_formato = M1.toFixed(2);
    const M2_formato = M2.toFixed(2);
    const PF_formato = PF.toFixed(2);

    // 7. Mostrar resultados
    document.getElementById('resultadoM1').textContent = M1_formato;
    document.getElementById('resultadoM2').textContent = M2_formato;
    document.getElementById('resultadoPF').textContent = PF_formato;

    // 8. Determinar estado de aprobación (Aprobar con 10.5 o más)
    const estadoElement = document.getElementById('estadoAprobacion');
    estadoElement.classList.remove('aprobado', 'desaprobado');
    
    if (PF >= 10.5) {
        estadoElement.textContent = `¡Felicidades! Aprobaste con ${PF_formato}. 🎉`;
        estadoElement.classList.add('aprobado');
    } else {
        estadoElement.textContent = `Necesitas una nota mayor para aprobar. Tu promedio es ${PF_formato}. 😕`;
        estadoElement.classList.add('desaprobado');
    }
}

// Inicializar el cálculo al cargar la página si hay valores por defecto (opcional)
document.addEventListener('DOMContentLoaded', () => {
    calcularPromedio();
});
