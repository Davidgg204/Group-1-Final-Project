import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use(express.static(path.join(__dirname, "../frontend/dist")));

const weatherCodeMap = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm"
};

let searchHistory = [];
let favorites = [];

app.get("/api/weather", async (req, res) => {
  try {
    const city = req.query.city;

    if (!city) {
      return res.status(400).json({ error: "City is required" });
    }

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      city
    )}&count=1&language=en&format=json`;

    const geoResponse = await fetch(geoUrl);
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({ error: "City not found" });
    }

    const location = geoData.results[0];

    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;

    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    const result = {
      city: location.name,
      country: location.country,
      current: {
        temperature: weatherData.current.temperature_2m,
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: weatherData.current.wind_speed_10m,
        condition: weatherCodeMap[weatherData.current.weather_code] || "Unknown"
      },
      forecast: weatherData.daily.time.slice(0, 5).map((date, index) => ({
        date,
        maxTemp: weatherData.daily.temperature_2m_max[index],
        minTemp: weatherData.daily.temperature_2m_min[index],
        precipitation: weatherData.daily.precipitation_probability_max[index],
        condition: weatherCodeMap[weatherData.daily.weather_code[index]] || "Unknown"
      }))
    };

    searchHistory.unshift({
      city: result.city,
      country: result.country,
      searchedAt: new Date().toISOString()
    });

    searchHistory = searchHistory.slice(0, 10);

    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

app.get("/api/history", (req, res) => {
  res.json(searchHistory);
});

app.get("/api/favorites", (req, res) => {
  res.json(favorites);
});

app.post("/api/favorites", (req, res) => {
  const { city, country } = req.body;

  if (!city) {
    return res.status(400).json({ error: "City is required" });
  }

  const exists = favorites.some(
    (fav) => fav.city.toLowerCase() === city.toLowerCase()
  );

  if (!exists) {
    favorites.push({ city, country: country || "Unknown" });
  }

  res.json(favorites);
});

app.delete("/api/favorites/:city", (req, res) => {
  favorites = favorites.filter(
    (fav) => fav.city.toLowerCase() !== req.params.city.toLowerCase()
  );

  res.json(favorites);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`WeatherWise running on port ${PORT}`);
});