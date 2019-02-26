function initPerformanceTab() {
    const COLOR_PALETTE = [];
    for (let i = 8; i > 0; i--) {
        COLOR_PALETTE.push({
            r: Math.floor(Math.random() * 255),
            g: Math.floor(Math.random() * 255),
            b: Math.floor(Math.random() * 255)
        });
    }

    const temperatures = new Float32Array(1500);

    const ALERTS_STORAGE_KEY = 'alert-config';
    const alerts = JSON.parse(localStorage.getItem(ALERTS_STORAGE_KEY) || '{}');
    /*
    alerts = {
        <partId>: {
            temperature: {
                max: <number>
            }
        }
    };
    */

    function updateTemperatures() {
        // Generate new temperatures for each partId from 1 to 1500
        for (let i = 0, len = temperatures.length; i < len; i++) {
            temperatures[i] = 90.0 + Math.random() * 20.0;
        }
        // Trigger alerts if any part temperature exceed preconfigured limit
        Object.keys(alerts).forEach(function(partId) {
            const alert = alerts[partId];
            const temp = temperatures[partId];
            if (alert && alert.temperature && temp > alert.temperature.max) {
                // console.log(`Part ${partId} temperature ${temp} exceeded limit ${alert.temperature.max}!`);
                NOP_VIEWER.setThemingColor(partId, new THREE.Vector4(1.0, 0.0, 0.0, 0.99));
                setTimeout(function() {
                    // TODO: revert to original theming color if there was one
                    NOP_VIEWER.setThemingColor(partId, new THREE.Vector4(1.0, 0.0, 0.0, 0.0));
                }, 500);
            }
        });
    }

    function createEngineSpeedChart() {
        const ctx = document.getElementById('engine-speed-chart').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Speed [rpm]',
                    borderColor: 'rgba(255, 196, 0, 1.0)',
                    backgroundColor: 'rgba(255, 196, 0, 0.5)',
                    data: []
                }]
            },
            options: {
                scales: {
                    xAxes: [{ type: 'realtime', realtime: { delay: 2000 } }],
                    yAxes: [{ ticks: { beginAtZero: true } }]
                }
            }
        });
        return chart;
    }

    function createEngineVibrationsChart() {
        const ctx = document.getElementById('engine-vibrations-chart').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Min [mm/s]',
                    borderColor: 'rgba(255, 192, 0, 1.0)',
                    backgroundColor: 'rgba(255, 192, 0, 0.5)',
                    data: []
                },{
                    label: 'Avg [mm/s]',
                    borderColor: 'rgba(192, 128, 0, 1.0)',
                    backgroundColor: 'rgba(192, 128, 0, 0.5)',
                    data: []
                },{
                    label: 'Max [mm/s]',
                    borderColor: 'rgba(128, 64, 0, 1.0)',
                    backgroundColor: 'rgba(128, 64, 0, 0.5)',
                    data: []
                }]
            },
            options: {
                scales: {
                    xAxes: [{ type: 'realtime', realtime: { delay: 2000 } }],
                    yAxes: [{ ticks: { beginAtZero: true } }]
                }
            }
        });
        return chart;
    }

    function createPartTemperaturesChart() {
        const ctx = document.getElementById('part-temperatures-chart').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: { datasets: [] },
            options: {
                scales: {
                    xAxes: [{ type: 'realtime', realtime: { delay: 2000 } }],
                    yAxes: [{ ticks: { beginAtZero: true } }]
                }
            }
        });
        return chart;
    }

    function refreshEngineSpeed(chart) {
        chart.data.datasets[0].data.push({
            x: Date.now(),
            y: 9750.0 + Math.random() * 500.0
        });
    }

    function refreshEngineVibrations(chart) {
        const date = Date.now();
        const minVibration = 2.0 + Math.random();
        const maxVibration = minVibration + Math.random();
        chart.data.datasets[0].data.push({ x: date, y: minVibration });
        chart.data.datasets[1].data.push({ x: date, y: 0.5 * (minVibration + maxVibration) });
        chart.data.datasets[2].data.push({ x: date, y: maxVibration });
    }

    function refreshPartTemperatures(chart) {
        const partId = $('#temperature-alert-part').val();
        if (partId) {
            chart.data.datasets.forEach(function(dataset) {
                dataset.data.push({
                    x: Date.now(),
                    y: temperatures[parseInt(partId)]
                });
            });
        }
    }

    function updateTemperatureAlertForm(partIds) {
        $form = $('#temperature-alert-form');
        if (!partIds || partIds.length !== 1) {
            $form.fadeOut();
        } else {
            $('#temperature-alert-part').val(partIds[0]);
            const config = alerts[partIds[0]];
            if (config && config.temperature && config.temperature.max) {
                $('#temperature-alert-max').val(config.temperature.max);
            } else {
                $('#temperature-alert-max').val('');
            }
            $form.fadeIn();
        }
    }

    const engineSpeedChart = createEngineSpeedChart();
    const engineVibrationsChart = createEngineVibrationsChart();
    const partTemperaturesChart = createPartTemperaturesChart();

    NOP_VIEWER.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, function(ev) {
        const ids = NOP_VIEWER.getSelection();
        updateTemperatureAlertForm(ids);

        partTemperaturesChart.data.datasets = [];
        let counter = 0;
        for (const id of ids) {
            const color = COLOR_PALETTE[counter % COLOR_PALETTE.length];
            partTemperaturesChart.data.datasets.push({
                label: `Part #${id} Temp [C]`,
                borderColor: `rgba(${color.r}, ${color.g}, ${color.b}, 1.0)`,
                backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`,
                data: []
            });
            counter++;
        }
        partTemperaturesChart.update();
    });

    $('#temperature-alert-form button.btn-primary').on('click', function(ev) {
        const partId = parseInt($('#temperature-alert-part').val());
        const tempMax = parseFloat($('#temperature-alert-max').val());
        alerts[partId] = alerts[partId] || {};
        alerts[partId].temperature = alerts[partId].temperature || {};
        alerts[partId].temperature.max = tempMax;
        window.localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
        updateTemperatureAlertForm([partId]);
        ev.preventDefault();
    });
    $('#temperature-alert-form button.btn-secondary').on('click', function(ev) {
        const partId = $('#temperature-alert-part').val();
        delete alerts[partId];
        window.localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
        updateTemperatureAlertForm([partId]);
        ev.preventDefault();
    });

    setInterval(function() {
        updateTemperatures();
        refreshEngineSpeed(engineSpeedChart);
        refreshEngineVibrations(engineVibrationsChart);
        refreshPartTemperatures(partTemperaturesChart);
    }, 1000);
    updateTemperatureAlertForm();
}