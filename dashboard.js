const OPEN_WEATHER_API_KEY = 'e622a17d17e680bd4faaf7d7167e5f28';
let isCelsius = true;

async function getWeather() {
    const city = document.getElementById('cityInput').value;
    if (!city) {
        alert('Please enter a city name');
        return;
    }

    showLoadingSpinner();

    try {
        const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${OPEN_WEATHER_API_KEY}`);
        const geoData = await geoResponse.json();

        if (geoData.length === 0) {
            alert('City not found');
            hideLoadingSpinner();
            return;
        }

        const lat = geoData[0].lat;
        const lon = geoData[0].lon;

        const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_API_KEY}&units=metric`);
        const weatherData = await weatherResponse.json();

        updateWeatherWidget(weatherData, city);
        updateThemeBasedOnWeather(weatherData.weather[0].main);

        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_API_KEY}&units=metric`);
        const forecastData = await forecastResponse.json();

        updateCharts(forecastData);
        updateTable(forecastData);

        localStorage.setItem('lastSearchedCity', city);
        localStorage.setItem('forecastData', JSON.stringify(forecastData));
        localStorage.setItem('currentWeather', weatherData.weather[0].main);

        hideLoadingSpinner();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        hideLoadingSpinner();
    }
}

function updateWeatherWidget(weatherData, city) {
    document.getElementById('weatherTitle').innerText = `Weather in ${city}`;
    document.getElementById('weatherDescription').innerText = weatherData.weather[0].description;
    document.getElementById('weatherIcon').src = `http://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`;
    updateTemperature(weatherData.main.temp);
    document.getElementById('humidity').innerText = `Humidity: ${weatherData.main.humidity}%`;
    document.getElementById('windSpeed').innerText = `Wind Speed: ${weatherData.wind.speed} m/s`;
}

function updateTemperature(tempCelsius) {
    const tempValue = document.getElementById('tempValue');
    const tempUnit = document.getElementById('tempUnit');
    const tempFahrenheit = (tempCelsius * 9 / 5) + 32;

    if (isCelsius) {
        tempValue.innerText = `${tempCelsius.toFixed(1)}`;
        tempUnit.innerText = '°C/°F';
    } else {
        tempValue.innerText = `${tempFahrenheit.toFixed(1)}`;
        tempUnit.innerText = '°F/°C';
    }
}

function toggleTemperatureUnit() {
    isCelsius = !isCelsius;
    const currentTemp = parseFloat(document.getElementById('tempValue').innerText.split('/')[0]);
    updateTemperature(isCelsius ? (currentTemp - 32) * 5 / 9 : currentTemp);
}

function showLoadingSpinner() {
    document.querySelector('.loading-spinner').style.display = 'block';
}

function hideLoadingSpinner() {
    document.querySelector('.loading-spinner').style.display = 'none';
}

function updateThemeBasedOnWeather(condition) {
    const body = document.body;
    const header = document.querySelector('.header');
    const sidebar = document.querySelector('.sidebar');
    const weatherWidget = document.getElementById('weatherWidget');

    const themes = {
        Clear: {
            headerBackground: 'url("small-clouds-with-sun.jpg")',
            widgetBackground: 'url("small-clouds-with-sun.jpg")',
            textColor: '#000'
        },
        Clouds: {
            headerBackground: 'url("storm-clouds.jpg")',
            widgetBackground: 'url("storm-clouds.jpg")',
            textColor: '#fff'
        },
        Rain: {
            headerBackground: 'url("raain.jpeg")',
            widgetBackground: 'url("raain.jpeg")',
            textColor: '#fff'
        },
        Mist: {
            headerBackground: 'url("trees-surrounded-by-fogs-forest.jpg")',
            widgetBackground: 'url("trees-surrounded-by-fogs-forest.jpg")',
            textColor: '#fff'
        },
        Fog: {
            headerBackground: 'url("trees-surrounded-by-fogs-forest.jpg")',
            widgetBackground: 'url("trees-surrounded-by-fogs-forest.jpg")',
            textColor: '#fff'
        },
        Smoke: {
            headerBackground: 'url("trees-surrounded-by-fogs-forest.jpg")',
            widgetBackground: 'url("trees-surrounded-by-fogs-forest.jpg")',
            textColor: '#fff'
        }
    };

    const theme = themes[condition] || themes['Clear'];

    header.style.backgroundImage = theme.headerBackground;
    header.style.backgroundSize = 'cover';
    header.style.backgroundPosition = 'center';
    weatherWidget.style.backgroundImage = theme.widgetBackground;
    weatherWidget.style.backgroundSize = 'cover';
    weatherWidget.style.backgroundPosition = 'center';
    header.style.color = theme.textColor;
    weatherWidget.style.color = theme.textColor;

    const sidebarLinks = sidebar.querySelectorAll('a');
    sidebarLinks.forEach(link => {
        link.style.color = theme.textColor;
    });

    localStorage.setItem('currentWeather', condition);
}

function updateCharts(forecastData) {
    const labels = [];
    const temperatures = [];
    const weatherConditions = {};

    forecastData.list.slice(0, 40).forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        const temp = item.main.temp;
        const weather = item.weather[0].main;

        if (!labels.includes(date)) {
            labels.push(date);
        }
        temperatures.push(temp);

        if (weatherConditions[weather]) {
            weatherConditions[weather]++;
        } else {
            weatherConditions[weather] = 1;
        }
    });

    const barChartCtx = document.getElementById('barChart').getContext('2d');
    if (window.barChartInstance) {
        window.barChartInstance.destroy();
    }
    window.barChartInstance = new Chart(barChartCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures.slice(0, labels.length),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            animation: {
                duration: 1000,
                easing: 'easeOutBounce'
            }
        }
    });

    const doughnutChartCtx = document.getElementById('doughnutChart').getContext('2d');
    if (window.doughnutChartInstance) {

        window.doughnutChartInstance.destroy();
    }
    window.doughnutChartInstance = new Chart(doughnutChartCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(weatherConditions),
            datasets: [{
                label: 'Weather Conditions',
                data: Object.values(weatherConditions),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });

    const lineChartCtx = document.getElementById('lineChart').getContext('2d');
    if (window.lineChartInstance) {
        window.lineChartInstance.destroy();
    }
    window.lineChartInstance = new Chart(lineChartCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures.slice(0, labels.length),
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
}

function updateTable(forecastData) {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    forecastData.list.slice(0, 5).forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(item.dt * 1000).toLocaleDateString()}</td>
            <td>${item.main.temp.toFixed(1)} °C</td>
            <td>${item.weather[0].description}</td>
        `;
        tableBody.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.querySelector('button');
    if (searchButton) {
        searchButton.addEventListener('click', getWeather);
    }

    const tempUnit = document.getElementById('tempUnit');
    if (tempUnit) {
        tempUnit.addEventListener('click', toggleTemperatureUnit);
    }

    const lastSearchedCity = localStorage.getItem('lastSearchedCity');
    if (lastSearchedCity) {
        document.getElementById('cityInput').value = lastSearchedCity;
        getWeather();
    }
});