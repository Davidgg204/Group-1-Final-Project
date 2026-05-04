import React, { useEffect, useState } from "react";
import { Search, Star, Trash2, CloudSun, Wind, Droplets } from "lucide-react";
import { createRoot } from "react-dom/client";
import "./style.css";

const API_URL = "http://localhost:5000";

function App() {
  const [city, setCity] = useState("Los Angeles");
  const [weather, setWeather] = useState(null);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchWeather(searchCity = city) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/weather?city=${encodeURIComponent(searchCity)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Weather request failed");
      }

      setWeather(data);
      setCity(data.city);
      fetchHistory();
    } catch (err) {
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory() {
    const response = await fetch(`${API_URL}/api/history`);
    const data = await response.json();
    setHistory(data);
  }

  async function fetchFavorites() {
    const response = await fetch(`${API_URL}/api/favorites`);
    const data = await response.json();
    setFavorites(data);
  }

  async function saveFavorite() {
    if (!weather) return;

    await fetch(`${API_URL}/api/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        city: weather.city,
        country: weather.country
      })
    });

    fetchFavorites();
  }

  async function removeFavorite(cityName) {
    await fetch(`${API_URL}/api/favorites/${cityName}`, {
      method: "DELETE"
    });

    fetchFavorites();
  }

  function handleSubmit(e) {
    e.preventDefault();
    fetchWeather(city);
  }

  useEffect(() => {
    fetchWeather("Los Angeles");
    fetchFavorites();
    fetchHistory();
  }, []);

  return (
    <main className="app">
      <section className="hero">
        <div>
          <h1>Group 1 Weather App</h1>
          <p>Search live weather and a 5-day forecast using Open-Meteo.</p>
        </div>

        <form onSubmit={handleSubmit} className="searchBox">
          <Search size={20} />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter a city..."
          />
          <button type="submit">Search</button>
        </form>
      </section>

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Loading weather...</div>}

      {weather && !loading && (
        <section className="dashboard">
          <div className="currentCard">
            <div className="cardHeader">
              <div>
                <h2>
                  {weather.city}, {weather.country}
                </h2>
                <p>{weather.current.condition}</p>
              </div>
              <CloudSun size={52} />
            </div>

            <div className="temp">
              {Math.round(weather.current.temperature)}°F
            </div>

            <div className="stats">
              <div>
                <Droplets />
                <span>Humidity</span>
                <strong>{weather.current.humidity}%</strong>
              </div>

              <div>
                <Wind />
                <span>Wind</span>
                <strong>{weather.current.windSpeed} mph</strong>
              </div>
            </div>

            <button className="favoriteBtn" onClick={saveFavorite}>
              <Star size={18} />
              Save Favorite
            </button>
          </div>

          <div className="forecastCard">
            <h2>5-Day Forecast</h2>

            <div className="forecastGrid">
              {weather.forecast.map((day) => (
                <div className="forecastDay" key={day.date}>
                  <h3>{new Date(day.date).toLocaleDateString()}</h3>
                  <p>{day.condition}</p>
                  <strong>
                    {Math.round(day.maxTemp)}° / {Math.round(day.minTemp)}°
                  </strong>
                  <span>{day.precipitation ?? 0}% rain</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="sideSections">
        <div className="panel">
          <h2>Favorites</h2>

          {favorites.length === 0 && <p>No favorites saved yet.</p>}

          {favorites.map((fav) => (
            <div className="listItem" key={fav.city}>
              <button onClick={() => fetchWeather(fav.city)}>
                {fav.city}, {fav.country}
              </button>

              <Trash2
                className="trash"
                size={18}
                onClick={() => removeFavorite(fav.city)}
              />
            </div>
          ))}
        </div>

        <div className="panel">
          <h2>Search History</h2>

          {history.length === 0 && <p>No searches yet.</p>}

          {history.map((item, index) => (
            <div className="historyItem" key={index}>
              <button onClick={() => fetchWeather(item.city)}>
                {item.city}, {item.country}
              </button>
              <span>{new Date(item.searchedAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);