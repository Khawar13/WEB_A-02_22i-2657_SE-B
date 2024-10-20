const OPEN_WEATHER_API_KEY = 'e622a17d17e680bd4faaf7d7167e5f28';
let currentPage = 1;
const entriesPerPage = 10;
let forecastData = [];
let originalForecastData = [];

// Function to load forecast data from localStorage
function loadForecastData() {
    const storedData = localStorage.getItem('forecastData');
    const lastSearchedCity = localStorage.getItem('lastSearchedCity');
    const currentWeather = localStorage.getItem('currentWeather');

    if (storedData && lastSearchedCity) {
        forecastData = JSON.parse(storedData).list;
        originalForecastData = [...forecastData];
        updateForecastTable();
        updatePagination();

        // Update the header with the city name
        const headerTitle = document.querySelector('.header h2');
        if (headerTitle) {
            headerTitle.textContent = `5-Day Weather Forecast for ${lastSearchedCity}`;
        }

        // Update the header background based on the current weather
        updateHeaderBackground(currentWeather);
    } else {
        const headerTitle = document.querySelector('.header h2');
        if (headerTitle) {
            headerTitle.textContent = 'No forecast data available';
        }
    }
}

// Function to update the forecast table
function updateForecastTable() {
    const tableBody = document.getElementById('forecastTableBody');
    tableBody.innerHTML = '';

    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    const pageData = forecastData.slice(startIndex, endIndex);

    pageData.forEach(item => {
        const row = document.createElement('tr');
        const date = new Date(item.dt * 1000);
        row.innerHTML = `
            <td>${date.toLocaleDateString()}</td>
            <td>${date.toLocaleTimeString()}</td>
            <td>${item.main.temp.toFixed(1)}</td>
            <td>${item.weather[0].description}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Function to update pagination
function updatePagination() {
    const totalPages = Math.ceil(forecastData.length / entriesPerPage);
    const pageInfo = document.getElementById('pageInfo');
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
}

// Function to sort temperatures
function sortTemperatures(ascending = true) {
    forecastData.sort((a, b) => {
        return ascending ? a.main.temp - b.main.temp : b.main.temp - a.main.temp;
    });
    currentPage = 1;
    updateForecastTable();
    updatePagination();
}

// Function to filter rainy days
function filterRainyDays() {
    forecastData = originalForecastData.filter(item =>
        item.weather[0].main.toLowerCase().includes('rain')
    );
    currentPage = 1;
    updateForecastTable();
    updatePagination();
}

// Function to show the day with highest temperature
function showHighestTemperatureDay() {
    const highestTempDay = originalForecastData.reduce((max, item) =>
        max.main.temp > item.main.temp ? max : item
    );
    forecastData = [highestTempDay];
    currentPage = 1;
    updateForecastTable();
    updatePagination();
}

// Function to reset the table
function resetTable() {
    forecastData = [...originalForecastData];
    currentPage = 1;
    updateForecastTable();
    updatePagination();
}

// Function to update the header background based on weather condition
function updateHeaderBackground(condition) {
    const header = document.querySelector('.header');
    const themes = {
        Clear: 'url("clearsky.jpeg")',
        Clouds: 'url("clouds.jpeg")',
        Rain: 'url("rain.jpeg")',
        Mist: 'url("fog.jpeg")',
        Fog: 'url("fog.jpeg")',
        Smoke: 'url("fog.jpeg")'
    };

    const backgroundImage = themes[condition] || themes['Clear'];
    header.style.backgroundImage = backgroundImage;
    header.style.backgroundSize = 'cover';
    header.style.backgroundPosition = 'center';
    header.style.color = condition === 'Clear' ? '#000' : '#fff';
}

// Function to handle chat interactions
async function handleChat() {
    const chatInput = document.getElementById('chatInput');
    const chatArea = document.getElementById('chatArea');
    const question = chatInput.value.trim();

    if (!question) return;

    // Display user's question
    appendMessage('User', question);

    // Clear input field
    chatInput.value = '';

    try {
        // Generate and display bot response
        const response = await generateWeatherResponse(question);
        appendMessage('Bot', response);
    } catch (error) {
        console.error('Error in chatbot response:', error);
        appendMessage('Bot', "I'm sorry, I encountered an error. Please try again.");
    }
}

// Function to generate weather response based on the forecast data
async function generateWeatherResponse(question) {
    if (!originalForecastData.length) {
        return "I'm sorry, but I don't have any weather data available at the moment.";
    }

    const lastSearchedCity = localStorage.getItem('lastSearchedCity');
    const lowerQuestion = question.toLowerCase();

    // Simulate a small delay to prevent rate limiting issues
    await new Promise(resolve => setTimeout(resolve, 100));

    if (lowerQuestion.includes('highest temperature') || lowerQuestion.includes('hottest day')) {
        const highestTemp = Math.max(...originalForecastData.map(item => item.main.temp));
        const hottest = originalForecastData.find(item => item.main.temp === highestTemp);
        return `The highest temperature in ${lastSearchedCity} is ${highestTemp.toFixed(1)}°C on ${new Date(hottest.dt * 1000).toLocaleDateString()}.`;
    }

    if (lowerQuestion.includes('lowest temperature') || lowerQuestion.includes('coldest day')) {
        const lowestTemp = Math.min(...originalForecastData.map(item => item.main.temp));
        const coldest = originalForecastData.find(item => item.main.temp === lowestTemp);
        return `The lowest temperature in ${lastSearchedCity} is ${lowestTemp.toFixed(1)}°C on ${new Date(coldest.dt * 1000).toLocaleDateString()}.`;
    }

    if (lowerQuestion.includes('average temperature')) {
        const avgTemp = originalForecastData.reduce((sum, item) => sum + item.main.temp, 0) / originalForecastData.length;
        return `The average temperature in ${lastSearchedCity} is ${avgTemp.toFixed(1)}°C.`;
    }

    if (lowerQuestion.includes('rainy days')) {
        const rainyDays = originalForecastData.filter(item =>
            item.weather[0].main.toLowerCase().includes('rain')
        ).length;
        return `There are ${rainyDays} rainy days in the forecast for ${lastSearchedCity}.`;
    }

    if (lowerQuestion.includes('weather')) {
        return `I can provide information about the weather in ${lastSearchedCity}. You can ask about the highest temperature, lowest temperature, average temperature, or the number of rainy days.`;
    }

    return "I'm sorry, I can only answer weather-related questions. You can ask about the highest temperature, lowest temperature, average temperature, or the number of rainy days in the forecast.";
}

// Function to append messages to the chat area
function appendMessage(sender, message) {
    const chatArea = document.getElementById('chatArea');
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatArea.appendChild(messageElement);
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadForecastData();
    document.getElementById('sortAscending').addEventListener('click', () => sortTemperatures(true));
    document.getElementById('sortDescending').addEventListener('click', () => sortTemperatures(false));
    document.getElementById('filterRain').addEventListener('click', filterRainyDays);
    document.getElementById('showHighestTemp').addEventListener('click', showHighestTemperatureDay);
    document.getElementById('resetTable').addEventListener('click', resetTable);
    document.getElementById('sendChatBtn').addEventListener('click', handleChat);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleChat();
        }
    });
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateForecastTable();
            updatePagination();
        }
    });
    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(forecastData.length / entriesPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updateForecastTable();
            updatePagination();
        }
    });
});