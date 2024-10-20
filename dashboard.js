// OpenWeather API Key
const OPEN_WEATHER_API_KEY = 'e622a17d17e680bd4faaf7d7167e5f28';

// Function to get weather data
async function getWeather() {
    const city = document.getElementById('cityInput').value;
    if (!city) {
        alert('Please enter a city name');
        return;
    }

    try {
        // Fetch the weather data based on city name (using the Geocoding API)
        const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${OPEN_WEATHER_API_KEY}`);
        const geoData = await geoResponse.json();

        if (geoData.length === 0) {
            alert('City not found');
            return;
        }

        const lat = geoData[0].lat;
        const lon = geoData[0].lon;

        // Fetch current weather data
        const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_API_KEY}&units=metric`);
        const weatherData = await weatherResponse.json();

        // Update the weather widget
        document.getElementById('weatherTitle').innerText = `Weather in ${city}`;
        document.getElementById('weatherDescription').innerText = weatherData.weather[0].description;
        document.getElementById('weatherIcon').src = `http://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`;
        document.getElementById('temperature').innerText = `Temperature: ${weatherData.main.temp} °C`;
        document.getElementById('humidity').innerText = `Humidity: ${weatherData.main.humidity}%`;
        document.getElementById('windSpeed').innerText = `Wind Speed: ${weatherData.wind.speed} m/s`;

        // Change the theme of the whole page based on weather condition
        updateThemeBasedOnWeather(weatherData.weather[0].main);

        // Fetch 5-day weather forecast data
        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_API_KEY}&units=metric`);
        const forecastData = await forecastResponse.json();

        updateCharts(forecastData);
        updateTable(forecastData);

        // Store the forecast data in localStorage
        localStorage.setItem('lastSearchedCity', city);
        localStorage.setItem('forecastData', JSON.stringify(forecastData));
        localStorage.setItem('currentWeather', weatherData.weather[0].main);
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

// Function to update the theme of the entire page based on weather conditions
function updateThemeBasedOnWeather(condition) {
    const body = document.body;
    const header = document.querySelector('.header');
    const sidebar = document.querySelector('.sidebar');
    const weatherWidget = document.getElementById('weatherWidget');

    // Define themes for different weather conditions
    const themes = {
        Clear: {
            headerBackground: 'url("clearsky.jpeg")',
            widgetBackground: 'url("clearsky.jpeg")',
            textColor: '#000'
        },
        Clouds: {
            headerBackground: 'url("clouds.jpeg")',
            widgetBackground: 'url("clouds.jpeg")',
            textColor: '#fff'
        },
        Rain: {
            headerBackground: 'url("rain.jpeg")',
            widgetBackground: 'url("rain.jpeg")',
            textColor: '#fff'
        },
        Mist: {
            headerBackground: 'url("fog.jpeg")',
            widgetBackground: 'url("fog.jpeg")',
            textColor: '#fff'
        },
        Fog: {
            headerBackground: 'url("fog.jpeg")',
            widgetBackground: 'url("fog.jpeg")',
            textColor: '#fff'
        },
        Smoke: {
            headerBackground: 'url("fog.jpeg")',
            widgetBackground: 'url("fog.jpeg")',
            textColor: '#fff'
        }
    };

    // Set the theme based on the condition, or fallback to a default theme
    const theme = themes[condition] || themes['Clear'];

    // Apply the theme to various elements
    header.style.backgroundImage = theme.headerBackground;
    header.style.backgroundSize = 'cover';
    header.style.backgroundPosition = 'center';
    weatherWidget.style.backgroundImage = theme.widgetBackground;
    weatherWidget.style.backgroundSize = 'cover';
    weatherWidget.style.backgroundPosition = 'center';
    header.style.color = theme.textColor;
    weatherWidget.style.color = theme.textColor;

    // Update text color for links in the sidebar
    const sidebarLinks = sidebar.querySelectorAll('a');
    sidebarLinks.forEach(link => {
        link.style.color = theme.textColor;
    });

    // Store the current weather condition in localStorage
    localStorage.setItem('currentWeather', condition);
}





// Function to update charts
function updateCharts(forecastData) {
    // Extract data for charts
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

    // Update the bar chart (temperature)
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

    // Update the doughnut chart (weather conditions)
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

    // Update the line chart (temperature trend over time)
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

// Function to update weather table with forecast data
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

// Event listener for the search button
document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.querySelector('button');
    if (searchButton) {
        searchButton.addEventListener('click', getWeather);
    }

    // Load last searched city data if available
    const lastSearchedCity = localStorage.getItem('lastSearchedCity');
    if (lastSearchedCity) {
        document.getElementById('cityInput').value = lastSearchedCity;
        getWeather();
    }
});