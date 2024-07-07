const locationName = document.querySelector(".location__name");
const locationWeatherIcon = document.querySelector(".location__weather-icon");
const locationTemperature = document.querySelector(".location__temperature");
const locationHumidity = document.querySelector(".details__humidity-value");
const locationClouds = document.querySelector(".details__clouds-value");
const locationWind = document.querySelector(".details__wind-value");
const locationPressure = document.querySelector(".details__pressure-value");
const timePrefix = document.querySelector(".datetime__time-prefix");
const timeSuffix = document.querySelector(".datetime__time-suffix");
const date = document.querySelector(".datetime__date");
const forecastContainer = document.querySelector(".forecast");
const forecastWeatherIcon = document.querySelector(".forecast__weather-icon");
const form = document.querySelector(".header__form");
const searchInput = document.querySelector(".header__search");

const BASE_URL = "https://api.openweathermap.org/data/2.5";
const API_KEY = "Use your own API key generated from openweathermap.org";
const DATETIME_API = "https://timeapi.io/api/Time/current/coordinate";
//const CORS_PROXY = "https://corsproxy.io/?";
const CORS_PROXY = "https://api.codetabs.com/v1/proxy?quest=";
//const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";
const ICON_URL = "https://openweathermap.org/img/wn";

let currentWeatherData = [];
let forecastData = [];
let dateTimeString;

const initializeWeather = async () => {
	const defaultLocation = "Kathmandu";
	await loadWeatherData(defaultLocation);
};

document.addEventListener("DOMContentLoaded", initializeWeather);

form.addEventListener("submit", async (e) => {
	e.preventDefault();

	const searchedLocation = searchInput.value.trim();
	if (searchedLocation === "") {
		await initializeWeather();
		return;
	}

	await loadWeatherData(searchedLocation);
});

const loadWeatherData = async (location) => {
	try {
		currentWeatherData = await fetchWeatherData(location, "weather");
		if (currentWeatherData) {
			forecastData = await fetchWeatherData(location, "forecast");
			dateTimeString = await fetchIsoDateTime(
				currentWeatherData.coord.lat,
				currentWeatherData.coord.lon
			);

			showCurrentWeatherData(currentWeatherData);
			showCurrentDateTime();
			renderForecast(forecastData);
		}
	} catch (error) {
		alert(error.message);
	}
};

const fetchWeatherData = async (location, type) => {
	try {
		const response = await fetch(
			`${BASE_URL}/${type}?q=${location}&appid=${API_KEY}&units=metric`
		);

		if (!response.ok) {
			throw new Error(`Location not found: ${location}`);
		}

		const data = await response.json();

		if (type !== "forecast") return data;
		return data.list.filter((obj) => obj.dt_txt.endsWith("06:00:00"));
	} catch (error) {
		throw new Error(error.message);
	}
};

const fetchIsoDateTime = async (lat, lon) => {
	try {
		const timestamp = new Date().getTime();
		const response = await fetch(
			`${CORS_PROXY}${DATETIME_API}?latitude=${lat}&longitude=${lon}&_=${timestamp}`
		);

		if (!response.ok) {
			throw new Error(
				`Unable to fetch date/time for coordinates: ${lat}, ${lon}`
			);
		}
		const data = await response.json();
		return data.dateTime;
	} catch (error) {
		throw new Error(error.message);
	}
};

const showCurrentWeatherData = (data) => {
	if (!data) return;

	locationName.textContent = `${data.name}, ${data.sys.country}`;
	locationWeatherIcon.src = `${ICON_URL}/${data.weather[0].icon}@2x.png`;
	locationTemperature.textContent = `${data.main.temp.toFixed(1)}\u00B0c`;
	locationHumidity.textContent = `${data.main.humidity}%`;
	locationClouds.textContent = `${data.clouds.all}%`;
	locationWind.textContent = `${data.wind.speed} m/s`;
	locationPressure.textContent = `${data.main.pressure} hPa`;
};

const showCurrentDateTime = () => {
	if (!dateTimeString) return;

	const { hours, minutes, anteMeridiem, weekday, month, day, year } =
		getDateTime(dateTimeString);

	timePrefix.textContent = `${hours}:${minutes}`;
	timeSuffix.textContent = anteMeridiem;
	date.textContent = `${weekday}, ${month} ${day}, ${year}`;
};

const getDateTime = (isoString) => {
	const date = new Date(isoString);

	let hours = date.getHours();
	let anteMeridiem = hours >= 12 ? "PM" : "AM";

	hours = hours % 12 || 12;
	hours = hours < 10 ? "0" + hours : hours;
	const minutes = date.getMinutes().toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	const weekday = date.toLocaleString("default", { weekday: "long" });
	const month = date.toLocaleString("default", { month: "long" });
	const year = date.getFullYear();

	return { hours, minutes, anteMeridiem, day, weekday, month, year };
};

const resetForecast = () => {
	while (forecastContainer.hasChildNodes()) {
		forecastContainer.removeChild(forecastContainer.firstChild);
	}
};

const renderForecast = (data) => {
	resetForecast();
	const forecastHTML = data.map((day) => {
		return `
        <div class="forecast__days">
			<p class="forecast__dayname">${getDateTime(day.dt_txt).weekday.slice(0, 3)}</p>
				<img
					class="forecast__weather-icon"
					src="${ICON_URL}/${day.weather[0].icon}@2x.png"
					alt=""
				/>
			<p class="forecast__temperature">${day.main.temp.toFixed(0)}\u00B0c</p>
		</div>
        `;
	});
	forecastContainer.insertAdjacentHTML("beforeend", forecastHTML.join(""));
};
