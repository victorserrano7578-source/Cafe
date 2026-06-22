/* ==========================================================================
   CHELIX - LÓGICA DE PROGRAMACIÓN JAVASCRIPT - MODELADO MATEMÁTICO
   ========================================================================== */

// --- Estado Global de la Simulación ---
let config = {
    t0: 34,      // Temperatura inicial (°C)
    tm: 20,      // Temperatura ambiente (°C)
    time: 15,    // Tiempo transcurrido (minutos)
    k: 0.05,     // Constante de enfriamiento
    chart: null  // Referencia al objeto Chart.js
};

// --- Configuración del Carrusel ---
let carouselIndex = 0;

// --- Inicialización ---
document.addEventListener("DOMContentLoaded", () => {
    // Escuchar eventos de cambio en la cabecera cuando se hace scroll
    window.addEventListener("scroll", () => {
        const header = document.querySelector(".main-header");
        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    });

    // Conectar controladores de sliders
    setupSliders();

    // Iniciar simulación inicial
    updateSimulation();
});

// --- Manejo de Vistas (SPA) ---
function showView(viewId) {
    // Quitar clase active de todas las secciones
    document.querySelectorAll(".view-section").forEach(sec => {
        sec.classList.remove("active");
        setTimeout(() => {
            sec.style.display = "none";
        }, 300); // Dar tiempo a la transición de opacidad
    });

    // Mostrar y animar la sección destino
    const targetSection = document.getElementById(`view-${viewId}`);
    setTimeout(() => {
        targetSection.style.display = "block";
        // Forzar un reflow para que la animación de entrada se ejecute
        targetSection.offsetHeight;
        targetSection.classList.add("active");
        
        // Si entramos al simulador, reinicializar o actualizar el gráfico
        if (viewId === 'simulador') {
            initOrUpdateChart();
        }
    }, 310);

    // Ajustar links de navegación del header
    const links = document.querySelectorAll(".nav-links a");
    links.forEach(link => {
        if (link.textContent.toLowerCase() === (viewId === 'home' ? 'inicio' : 'simulador')) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // Hacer scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Movimiento del Carrusel ---
function moveCarousel(direction) {
    const track = document.getElementById("carousel-track");
    const cards = document.querySelectorAll(".card");
    const cardWidth = cards[0].offsetWidth;
    const gap = 20; // Espaciado entre tarjetas
    const totalCards = cards.length;
    const maxIndex = totalCards - 1;

    carouselIndex += direction;
    
    // Límites del carrusel
    if (carouselIndex < 0) {
        carouselIndex = 0;
    } else if (carouselIndex > maxIndex) {
        carouselIndex = maxIndex;
    }

    const offset = carouselIndex * (cardWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;
    track.style.transition = "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
}

// --- Desplazamiento Suave de Scroll ---
function scrollToElement(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// --- Configuración de Sliders ---
function setupSliders() {
    const sliders = [
        { id: "input-t0", configKey: "t0", valDisplayId: "val-t0", unit: " °C" },
        { id: "input-tm", configKey: "tm", valDisplayId: "val-tm", unit: " °C" },
        { id: "input-time", configKey: "time", valDisplayId: "val-time", unit: " min" }
    ];

    sliders.forEach(slider => {
        const inputEl = document.getElementById(slider.id);
        const displayEl = document.getElementById(slider.valDisplayId);

        inputEl.addEventListener("input", (e) => {
            let val = parseFloat(e.target.value);
            
            // Regla física: La temperatura inicial T0 no puede ser menor que la ambiental Tm en este modelo de enfriamiento
            if (slider.configKey === "t0" && val < config.tm) {
                val = config.tm;
                inputEl.value = val;
            } else if (slider.configKey === "tm" && val > config.t0) {
                val = config.t0;
                inputEl.value = val;
            }

            config[slider.configKey] = val;
            displayEl.textContent = val + slider.unit;
            
            // Actualizar simulación en vivo
            updateSimulation();
        });
    });
}

// --- Actualización de la Constante k ---
function updateK(val) {
    config.k = parseFloat(val);
    updateSimulation();
}

// --- Activar Caso Práctico Calibrado ---
function applyPracticalCase() {
    config.t0 = 34;
    config.tm = 20;
    config.time = 15;
    config.k = 0.0373;

    // Actualizar elementos gráficos de los sliders
    document.getElementById("input-t0").value = 34;
    document.getElementById("val-t0").textContent = "34 °C";

    document.getElementById("input-tm").value = 20;
    document.getElementById("val-tm").textContent = "20 °C";

    document.getElementById("input-time").value = 15;
    document.getElementById("val-time").textContent = "15 min";

    // Marcar el botón de radio correspondiente
    const radios = document.getElementsByName("k-value");
    radios.forEach(radio => {
        if (radio.value === "0.0373") {
            radio.checked = true;
        } else {
            radio.checked = false;
        }
    });

    // Correr simulación
    updateSimulation();
}

// --- Alternar Sección del Caso Práctico ---
function toggleCaseDetails() {
    const content = document.getElementById("case-content-details");
    if (content.style.display === "none") {
        content.style.display = "block";
    } else {
        content.style.display = "none";
    }
}

// --- Lógica Matemática y Simulación en Vivo ---
function updateSimulation() {
    // FÓRMULA DE NEWTON: T(t) = Tm + (T0 - Tm) * e^(-kt)
    const exponent = -config.k * config.time;
    const finalTemp = config.tm + (config.t0 - config.tm) * Math.exp(exponent);
    
    // Formatear resultado
    const formattedTemp = finalTemp.toFixed(1);
    
    // Actualizar visualización del número
    document.getElementById("display-final-temp").textContent = formattedTemp;

    // Actualizar la taza de café interactiva y su estado
    updateCoffeeCupVisuals(finalTemp);

    // Actualizar el gráfico si ya está inicializado
    if (config.chart) {
        updateChartData();
    }
}

// --- Actualizar Apariencia Visual del Café SVG ---
function updateCoffeeCupVisuals(temp) {
    const cupBody = document.getElementById("cup-body");
    const cupHandle = document.getElementById("cup-handle");
    const steamGroup = document.getElementById("steam-group");
    const colorLabel = document.getElementById("cup-color-label");
    const statusText = document.getElementById("display-status-text");

    // Interpolar color de la taza (De Cyan a Morado y a Rojo)
    let cupColor = "";
    let shadowColor = "";
    
    if (temp > 60) {
        // Caliente: Transiciona hacia Rojo (#ff4b2b)
        const pct = (temp - 60) / 40; // 0 a 1
        const r = Math.round(188 + (255 - 188) * pct);
        const g = Math.round(19 + (75 - 19) * pct);
        const b = Math.round(254 - (254 - 43) * pct);
        cupColor = `rgb(${r}, ${g}, ${b})`;
        shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
        
        colorLabel.textContent = "Muy Caliente";
        colorLabel.className = "liquid-badge"; // red default
        colorLabel.style.backgroundColor = "#ff4b2b";
        colorLabel.style.boxShadow = "0 0 10px rgba(255, 75, 43, 0.6)";
        statusText.textContent = "¡Cuidado! El café está demasiado caliente para beberlo de inmediato.";
        
        // Vapor visible y rápido
        steamGroup.style.opacity = "1";
        document.querySelectorAll(".steam").forEach(st => {
            st.style.stroke = "rgba(255, 255, 255, 0.85)";
            st.style.animationDuration = "2s";
        });

    } else if (temp > 30) {
        // Templado / Ideal: Transiciona entre Morado (#bc13fe) y Naranja (#ffb703)
        const pct = (temp - 30) / 30; // 0 a 1
        const r = Math.round(188 - (188 - 255) * pct);
        const g = Math.round(19 + (183 - 19) * pct);
        const b = Math.round(254 - (254 - 3) * pct);
        cupColor = `rgb(${r}, ${g}, ${b})`;
        shadowColor = `rgba(${r}, ${g}, ${b}, 0.4)`;
        
        colorLabel.textContent = "Tibio / Ideal";
        colorLabel.className = "liquid-badge medium";
        colorLabel.style.backgroundColor = "#ffb703";
        colorLabel.style.boxShadow = "0 0 10px rgba(255, 183, 3, 0.5)";
        statusText.textContent = "Temperatura perfecta. Disfruta tu taza de café al punto justo.";
        
        // Vapor moderado
        steamGroup.style.opacity = "0.5";
        document.querySelectorAll(".steam").forEach(st => {
            st.style.stroke = "rgba(255, 255, 255, 0.4)";
            st.style.animationDuration = "3.5s";
        });

    } else {
        // Frío: Transiciona hacia Cyan (#00ffff)
        const pct = Math.max(0, (temp - config.tm) / (30 - config.tm)); // 0 a 1
        const r = Math.round(0 + (188 - 0) * pct);
        const g = Math.round(255 - (255 - 19) * pct);
        const b = Math.round(255 - (255 - 254) * pct);
        cupColor = `rgb(${r}, ${g}, ${b})`;
        shadowColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
        
        colorLabel.textContent = "Frío / Reposo";
        colorLabel.className = "liquid-badge cold";
        colorLabel.style.backgroundColor = "#00ffff";
        colorLabel.style.boxShadow = "0 0 10px rgba(0, 255, 255, 0.5)";
        statusText.textContent = "El café se ha enfriado, aproximándose a la temperatura ambiental.";
        
        // Vapor inactivo
        steamGroup.style.opacity = "0";
    }

    // Aplicar estilos dinámicos al SVG de la taza
    cupBody.style.fill = cupColor;
    cupBody.style.stroke = temp > 45 ? "#fff" : "#00ffff";
    cupHandle.style.stroke = cupColor;
    cupBody.style.filter = `drop-shadow(0 0 8px ${shadowColor})`;
}

// --- Inicialización y Renderizado de Chart.js ---
function initOrUpdateChart() {
    const ctx = document.getElementById("coolingChart").getContext("2d");
    
    if (config.chart) {
        updateChartData();
        return;
    }

    // Generar datos iniciales para la curva
    const chartData = generateChartDataPoints();

    // Crear el gráfico por primera vez
    config.chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Temperatura del Café (°C)',
                    data: chartData.curve,
                    borderColor: '#bc13fe',
                    borderWidth: 3,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.15
                },
                {
                    label: 'Temperatura actual',
                    data: [chartData.currentPoint],
                    borderColor: '#00ffff',
                    backgroundColor: '#00ffff',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    showLine: false // Solo el punto parpadeante
                },
                {
                    label: 'Temperatura Ambiente',
                    data: chartData.ambientLine,
                    borderColor: 'rgba(0, 255, 255, 0.25)',
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#a0a0b0',
                        font: {
                            family: 'Inter',
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} °C a los ${context.parsed.x} min`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: 120,
                    title: {
                        display: true,
                        text: 'Tiempo (minutos)',
                        color: '#a0a0b0',
                        font: {
                            family: 'Outfit',
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#a0a0b0'
                    }
                },
                y: {
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Temperatura (°C)',
                        color: '#a0a0b0',
                        font: {
                            family: 'Outfit',
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#a0a0b0'
                    }
                }
            }
        }
    });
}

// --- Generador de Puntos de la Curva ---
function generateChartDataPoints() {
    const curvePoints = [];
    const ambientPoints = [];
    
    // Generar la curva desde t = 0 hasta t = 120 minutos
    for (let t = 0; t <= 120; t += 2) {
        const temp = config.tm + (config.t0 - config.tm) * Math.exp(-config.k * t);
        curvePoints.push({ x: t, y: temp });
        ambientPoints.push({ x: t, y: config.tm });
    }

    // Calcular la posición del punto actual interactivo
    const currentTemp = config.tm + (config.t0 - config.tm) * Math.exp(-config.k * config.time);
    const currentPoint = { x: config.time, y: currentTemp };

    return {
        curve: curvePoints,
        currentPoint: currentPoint,
        ambientLine: ambientPoints
    };
}

// --- Actualización de Datos del Gráfico en Tiempo Real ---
function updateChartData() {
    const updatedData = generateChartDataPoints();
    
    // Actualizar datasets
    config.chart.data.datasets[0].data = updatedData.curve;
    config.chart.data.datasets[1].data = [updatedData.currentPoint];
    config.chart.data.datasets[2].data = updatedData.ambientLine;

    // Dinámicamente adaptar el eje Y superior para que el gráfico sea visible
    const yMax = Math.max(100, Math.ceil(config.t0 / 10) * 10);
    config.chart.options.scales.y.max = yMax;

    // Actualizar gráfico de forma asíncrona y suave
    config.chart.update('none'); 
}
