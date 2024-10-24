const OPEN_WEATHER_API_KEY = 'e622a17d17e680bd4faaf7d7167e5f28';
let currentPage = 1;
const entriesPerPage = 10;
let forecastData = [];
let originalForecastData = [];
let isCelsius = true;

const GEMINI_API_KEY = 'AIzaSyBSkFzVV4DdqkdRw9Aklto9LNMcB12JZHA';
const GEMINI_API_URL = 'https://api.gemini.com/v1/chat';

async function sendChatMessage(message) {
    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GEMINI_API_KEY}`
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error('Failed to send message to Gemini API');
        }

        const data = await response.json();
        return data.reply;
    } catch (error) {
        console.error('Error:', error);
        return 'Sorry, I am unable to respond right now.';
    }
}

async function handleChatInput() {
    const chatInput = document.getElementById('chatInput');
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    addChatMessage('You', userMessage);
    chatInput.value = '';

    const botReply = processWeatherQuery(userMessage) || await sendChatMessage(userMessage);
    addChatMessage('Weather Assistant', botReply);
}

function processWeatherQuery(query) {
    query = query.toLowerCase();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (query.includes('weather today')) {
        const todayData = forecastData.find(item => {
            const date = new Date(item.dt * 1000);
            return date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
        });
        if (todayData) {
            const tempDisplay = isCelsius ? todayData.main.temp.toFixed(1) : ((todayData.main.temp * 9 / 5) + 32).toFixed(1);
            return `The weather today is ${todayData.weather[0].description} (${tempDisplay}°${isCelsius ? 'C' : 'F'})`;
        }
    } else if (query.includes('weather tomorrow')) {
        const tomorrowData = forecastData.find(item => {
            const date = new Date(item.dt * 1000);
            return date.getDate() === tomorrow.getDate() && date.getMonth() === tomorrow.getMonth();
        });
        if (tomorrowData) {
            const tempDisplay = isCelsius ? tomorrowData.main.temp.toFixed(1) : ((tomorrowData.main.temp * 9 / 5) + 32).toFixed(1);
            return `The weather tomorrow is ${tomorrowData.weather[0].description} (${tempDisplay}°${isCelsius ? 'C' : 'F'})`;
        }
    } else if (query.includes('average temperature')) {
        const totalTemp = forecastData.reduce((sum, item) => {
            const temp = isCelsius ? item.main.temp : (item.main.temp * 9 / 5) + 32;
            return sum + temp;
        }, 0);
        const avgTemp = totalTemp / forecastData.length;
        return `The average temperature for the week is ${avgTemp.toFixed(1)}°${isCelsius ? 'C' : 'F'}`;
    } else if (query.includes('highest temperature')) {
        const highestTempDay = originalForecastData.reduce((max, item) => {
            const temp = isCelsius ? item.main.temp : (item.main.temp * 9 / 5) + 32;
            return temp > max.temp ? { item, temp } : max;
        }, { item: null, temp: -Infinity }).item;
        if (highestTempDay) {
            const date = new Date(highestTempDay.dt * 1000).toLocaleDateString();
            const tempDisplay = isCelsius ? highestTempDay.main.temp.toFixed(1) : ((highestTempDay.main.temp * 9 / 5) + 32).toFixed(1);
            return `The highest temperature will be ${tempDisplay}°${isCelsius ? 'C' : 'F'} on ${date}.`;
        }
    } else if (query.includes('lowest temperature')) {
        const lowestTempDay = originalForecastData.reduce((min, item) => {
            const temp = isCelsius ? item.main.temp : (item.main.temp * 9 / 5) + 32;
            return temp < min.temp ? { item, temp } : min;
        }, { item: null, temp: Infinity }).item;
        if (lowestTempDay) {
            const date = new Date(lowestTempDay.dt * 1000).toLocaleDateString();
            const tempDisplay = isCelsius ? lowestTempDay.main.temp.toFixed(1) : ((lowestTempDay.main.temp * 9 / 5) + 32).toFixed(1);
            return `The lowest temperature will be ${tempDisplay}°${isCelsius ? 'C' : 'F'} on ${date}.`;
        }
    } else if (query.includes('rainy days')) {
        const rainyDays = originalForecastData.filter(item => item.weather[0].main.toLowerCase().includes('rain'));
        if (rainyDays.length > 0) {
            const rainyDates = rainyDays.map(item => new Date(item.dt * 1000).toLocaleDateString()).join(', ');
            return `The following days have rain: ${rainyDates}`;
        } else {
            return 'There are no rainy days in the forecast.';
        }
    }

    return null;
}

function addChatMessage(sender, message) {
    const chatArea = document.getElementById('chatArea');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatArea.appendChild(messageElement);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function loadForecastData() {
    const storedData = localStorage.getItem('forecastData');
    const lastSearchedCity = localStorage.getItem('lastSearchedCity');
    const currentWeather = localStorage.getItem('currentWeather');

    if (storedData && lastSearchedCity) {
        forecastData = JSON.parse(storedData).list;
        originalForecastData = [...forecastData];
        updateForecastTable();
        updatePagination();
        document.querySelector('.header h2').textContent = `5-Day Weather Forecast for ${lastSearchedCity}`;
        updateHeaderBackground(currentWeather);
    } else {
        document.querySelector('.header h2').textContent = 'No forecast data available';
    }
}

function updateForecastTable() {
    const tableBody = document.getElementById('forecastTableBody');
    tableBody.innerHTML = '';

    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    const pageData = forecastData.slice(startIndex, endIndex);

    pageData.forEach(item => {
        const row = document.createElement('tr');
        const date = new Date(item.dt * 1000);
        const tempCelsius = item.main.temp;
        const tempFahrenheit = (tempCelsius * 9 / 5) + 32;
        const tempDisplay = isCelsius ? tempCelsius.toFixed(1) : tempFahrenheit.toFixed(1);

        row.innerHTML = `
            <td>${date.toLocaleDateString()}</td>
            <td>${date.toLocaleTimeString()}</td>
            <td>${tempDisplay}</td>
            <td>${item.weather[0].description}</td>
        `;
        tableBody.appendChild(row);
    });
}

function updatePagination() {
    const totalPages = Math.ceil(forecastData.length / entriesPerPage);
    const pageInfo = document.getElementById('pageInfo');
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

function sortTemperatures(ascending = true) {
    forecastData.sort((a, b) => {
        const tempA = isCelsius ? a.main.temp : (a.main.temp * 9 / 5) + 32;
        const tempB = isCelsius ? b.main.temp : (b.main.temp * 9 / 5) + 32;
        return ascending ? tempA - tempB : tempB - tempA;
    });
    currentPage = 1;
    updateForecastTable();
    updatePagination();
}

function filterRainyDays() {
    forecastData = originalForecastData.filter(item =>
        item.weather[0].main.toLowerCase().includes('rain')
    );
    currentPage = 1;
    updateForecastTable();
    updatePagination();
}

function showHighestTemperatureDay() {
    const highestTempDay = originalForecastData.reduce((max, item) => {
        const tempMax = isCelsius ? max.main.temp : (max.main.temp * 9 / 5) + 32;
        const tempItem = isCelsius ? item.main.temp : (item.main.temp * 9 / 5) + 32;
        return tempMax > tempItem ? max : item;
    });
    forecastData = [highestTempDay];
    currentPage = 1;
    updateForecastTable();
    updatePagination();
}

function resetTable() {
    forecastData = [...originalForecastData];
    currentPage = 1;
    updateForecastTable();
    updatePagination();
}

function updateHeaderBackground(condition) {
    const header = document.querySelector('.header');
    const themes = {
        Clear: 'url("small-clouds-with-sun.jpg")',
        Clouds: 'url("storm-clouds.jpg")',
        Rain: 'url("raain.jpeg")',
        Mist: 'url("trees-surrounded-by-fogs-forest.jpg")',
        Fog: 'url("trees-surrounded-by-fogs-forest.jpg")',
        Smoke: 'url("trees-surrounded-by-fogs-forest.jpg")'
    };

    const backgroundImage = themes[condition] || themes['Clear'];
    header.style.backgroundImage = backgroundImage;
    header.style.backgroundSize = 'cover';
    header.style.backgroundPosition = 'center';
    header.style.color = condition === 'Clear' ? '#000' : '#fff';
}

function toggleTemperatureUnit() {
    isCelsius = !isCelsius;
    document.getElementById('tempUnit').textContent = isCelsius ? '°C' : '°F';
    document.getElementById('tempUnitDisplay').textContent = isCelsius ? '°C' : '°F';
    updateForecastTable();
}

document.addEventListener('DOMContentLoaded', () => {
    loadForecastData();
    document.getElementById('sortAscending').addEventListener('click', () => sortTemperatures(true));
    document.getElementById('sortDescending').addEventListener('click', () => sortTemperatures(false));
    document.getElementById('filterRain').addEventListener('click', filterRainyDays);
    document.getElementById('showHighestTemp').addEventListener('click', showHighestTemperatureDay);
    document.getElementById('resetTable').addEventListener('click', resetTable);
    document.getElementById('toggleTemp').addEventListener('click', toggleTemperatureUnit);
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateForecastTable();
            updatePagination();
        }
    });
    document.getElementById('nextPage').addEventListener('click', () => {
        if (currentPage < Math.ceil(forecastData.length / entriesPerPage)) {
            currentPage++;
            updateForecastTable();
            updatePagination();
        }
    });

    document.getElementById('sendChatBtn').addEventListener('click', handleChatInput);
});