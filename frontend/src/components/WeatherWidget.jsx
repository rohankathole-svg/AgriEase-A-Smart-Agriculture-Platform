import { useEffect, useMemo, useState } from "react";
import { getWeather } from "../services/weatherService";
import Button from "./ui/Button";
import { toast } from "react-toastify";

function WeatherWidget() {
  const [city, setCity] = useState("Jalna");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchWeather = async (targetCity = city) => {
    try {
      setIsLoading(true);
      setError("");
      const data = await getWeather(targetCity);
      setWeather(data);
      setLastUpdated(new Date());
      setCity(data?.location?.name || targetCity);
    } catch (err) {
      console.error(err);
      setError("Unable to fetch weather data");
      setWeather(null);
      toast.error("Unable to fetch weather data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather("Jalna");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const highlights = useMemo(() => {
    if (!weather?.current) {
      return [
        { label: "Humidity", value: "--", icon: "💧" },
        { label: "Wind", value: "--", icon: "🌬️" },
        { label: "Feels like", value: "--", icon: "🌡️" },
      ];
    }

    const current = weather.current;
    return [
      { label: "Humidity", value: `${current.humidity}%`, icon: "💧" },
      { label: "Wind", value: `${current.wind_kph} km/h`, icon: "🌬️" },
      { label: "Feels like", value: `${current.feelslike_c}°C`, icon: "🌡️" },
    ];
  }, [weather]);

  const conditionIcon = useMemo(() => {
    const iconPath = weather?.current?.condition?.icon;
    if (!iconPath) return "";
    return iconPath.startsWith("http") ? iconPath : `https:${iconPath}`;
  }, [weather]);

  return (
    <div className="weather-widget">
      <header className="weather-widget__header">
        <div>
          <p className="pill muted">Localized Weather</p>
          <h3>{weather?.location ? `${weather.location.name}, ${weather.location.region || weather.location.country}` : "Check your fields"}</h3>
        </div>
        <span className="weather-widget__updated">
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "No data yet"}
        </span>
      </header>

      <div className="weather-widget__search">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="input"
          placeholder="Enter village / city"
        />
        <Button onClick={() => fetchWeather(city)} className="btn primary" disabled={isLoading}>
          {isLoading ? "Checking..." : "Update"}
        </Button>
      </div>

      {error && <p className="inline-error">{error}</p>}

      {weather?.current ? (
        <div className="weather-widget__body">
          <div className="weather-widget__current">
            {conditionIcon ? (
              <img
                src={conditionIcon}
                alt={weather.current.condition.text}
                className="weather-icon"
                width={64}
                height={64}
              />
            ) : (
              <span className="weather-icon weather-icon--fallback" aria-hidden="true">
                ⛅
              </span>
            )}
            <div className="weather-current-details">
              <p className="weather-temp">{weather.current.temp_c}°C</p>
              <p className="weather-condition">{weather.current.condition.text}</p>
              <p className="weather-meta">Visibility {weather.current.vis_km} km</p>
            </div>
          </div>
          <div className="weather-widget__highlights">
            {highlights.map((item) => (
              <article key={item.label} className="weather-highlight">
                <span className="weather-highlight__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <p className="weather-widget__empty">
          Track sunlight, rainfall windows, and irrigation schedules with precise local weather.
        </p>
      )}
    </div>
  );
}

export default WeatherWidget;
