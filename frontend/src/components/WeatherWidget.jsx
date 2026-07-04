import { useEffect, useMemo, useState } from "react";
import { getWeather } from "../services/weatherService";
import Button from "./ui/Button";
import { toast } from "react-toastify";
import { getCurrentCoordinates } from "../utils/geolocation";

function WeatherWidget() {
  const [city, setCity] = useState("Jalna");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [locationMeta, setLocationMeta] = useState("");

  const fetchWeather = async (targetCity = city) => {
    try {
      setIsLoading(true);
      setError("");
      const data = await getWeather(targetCity);
      setWeather(data);
      setLastUpdated(new Date());
      setCity(data?.location?.name || targetCity);
    } catch (err) {
      const errorMessage = err.message || "Unable to fetch weather data";
      console.error("Weather fetch error:", err);
      setError(errorMessage);
      setWeather(null);
      
      // Show appropriate toast based on error type
      if (errorMessage.includes("API key")) {
        toast.error("Weather API not configured. Check backend setup.");
      } else if (errorMessage.includes("location")) {
        toast.error(`City not found: ${targetCity}`);
      } else if (errorMessage.includes("Network")) {
        toast.error("Network error. Check internet connection.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather("Jalna");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchByCurrentLocation = () => {
    setIsLocating(true);
    getCurrentCoordinates({ fastMode: true })
      .then(async ({ latitude, longitude, accuracy }) => {
        const query = `${latitude},${longitude}`;
        setLocationMeta(`GPS accuracy: ${Math.round(accuracy)} m`);
        await fetchWeather(query);
      })
      .catch(async (geoError) => {
        console.error("Geolocation error", geoError);
        const errorMsg = geoError.message || "Geolocation failed";
        
        // Only fallback to auto:ip if it's a permission issue, not a security issue
        if (errorMsg.includes("permission denied") || errorMsg.includes("unavailable")) {
          toast.warn(`${errorMsg}. Using network-based location instead.`);
          setLocationMeta("Network-based location");
          try {
            await fetchWeather("auto:ip");
          } catch (autoIpError) {
            console.error("Auto IP location failed:", autoIpError);
            toast.error("Could not determine location. Try entering city manually.");
          }
        } else {
          toast.error(errorMsg);
        }
      })
      .finally(() => {
        setIsLocating(false);
      });
  };

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
      {locationMeta && <p className="weather-widget__updated">{locationMeta}</p>}

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
        <Button onClick={fetchByCurrentLocation} className="btn ghost" disabled={isLocating || isLoading}>
          {isLocating ? "Locating..." : "Use Current Location"}
        </Button>
      </div>

      {error && <p className="inline-error">{error}</p>}

      {weather?.current ? (
        <div className="weather-widget__body">
          <div className="weather-widget__current">
            {conditionIcon ? (
              <img
                src={conditionIcon}
                alt={weather.current.condition?.text || "weather condition"}
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
              <p className="weather-condition">{weather.current.condition?.text || "Unknown"}</p>
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
