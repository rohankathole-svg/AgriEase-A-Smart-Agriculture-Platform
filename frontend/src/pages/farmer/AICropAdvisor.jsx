import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "../../components/ui/Button";
import BackButton from "../../components/BackButton";
import { fetchCropRecommendationHistory, fetchCropRecommendations } from "../../services/smartAgriService";
import { getCurrentCoordinates } from "../../utils/geolocation";
import { generateCropAdvisorInsight } from "../../services/geminiService";
import { reverseGeocodeCoordinates } from "../../utils/reverseGeocode";
import { getWeather } from "../../services/weatherService";
import { useLanguage } from "../../context/LanguageContext";

export default function AICropAdvisor() {
  const { t, language } = useLanguage();
  const [location, setLocation] = useState("Pune");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationMeta, setLocationMeta] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [locationQueryOverride, setLocationQueryOverride] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await fetchCropRecommendationHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load crop advisor history", error);
    }
  };

  const handleGenerate = async () => {
    if (!location.trim()) {
      toast.error(t("farmer.cropAdvisor.toastEnterLocation"));
      return;
    }
    try {
      setLoading(true);
      const query = locationQueryOverride || location.trim();
      const data = await fetchCropRecommendations(query);
      setResult(data);
      setAiInsight("");
      toast.success(t("farmer.cropAdvisor.toastSuccess"));
      loadHistory();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || t("farmer.cropAdvisor.toastError"));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiInsight = async () => {
    if (!result) return;
    try {
      setAiLoading(true);
      const insight = await generateCropAdvisorInsight({
        location: result.location,
        temperatureCelsius: result.temperatureCelsius,
        humidityPercentage: result.humidityPercentage,
        recommendations: result.recommendations,
      });
      setAiInsight(insight);
    } catch (error) {
      console.error(error);
      toast.error(t("farmer.cropAdvisor.toastAiError"));
    } finally {
      setAiLoading(false);
    }
  };

  const useCurrentLocation = () => {
    setLocating(true);
    getCurrentCoordinates({ fastMode: true, targetAccuracyMeters: 60, maxAttempts: 1 })
      .then(async ({ latitude, longitude, accuracy }) => {
        const coords = `${latitude},${longitude}`;
        try {
          const geo = await reverseGeocodeCoordinates(latitude, longitude);
          const locationName = geo.displayName || coords;
          setLocation(locationName);
          setLocationMeta(
            `GPS accuracy: ${Math.round(accuracy)} m | Village: ${geo.village || "-"} | Town: ${geo.town || "-"} | District: ${geo.district || "-"}`
          );
        } catch {
          setLocation(coords);
          setLocationMeta(`GPS accuracy: ${Math.round(accuracy)} m | Village/Town/District unavailable`);
        }
        setLocationQueryOverride(coords);
        toast.success(t("farmer.cropAdvisor.toastLocationSelected"));
      })
      .catch((error) => {
        console.error("Geolocation error", error);
        toast.warn(`${error.message}. Using network location.`);
        return getWeather("auto:ip")
          .then((weather) => {
            const locName = weather?.location
              ? `${weather.location.name}${weather.location.region ? `, ${weather.location.region}` : ""}`
              : "auto:ip";
            setLocation(locName);
            setLocationMeta(t("farmer.cropAdvisor.networkLocation"));
            setLocationQueryOverride("auto:ip");
          })
          .catch(() => {
            toast.error(t("farmer.cropAdvisor.toastLocationError"));
          });
      })
      .finally(() => setLocating(false));
  };

  return (
    <div className="smart-page">
      <BackButton />
      <div className="page-hero smart-hero smart-hero-crop">
        <h1>{t("farmer.cropAdvisor.title")}</h1>
        <p>{t("farmer.cropAdvisor.subtitle")}</p>
      </div>

      <section className="widget-card smart-form">
        <h3>{t("farmer.cropAdvisor.findCrops")}</h3>
        {locationMeta && <p className="data-sync-meta">{locationMeta}</p>}
        <div className="form-row smart-inline">
          <input
            className="input"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setLocationQueryOverride(null);
            }}
            placeholder={t("farmer.cropAdvisor.enterLocation")}
          />
          <Button className="btn ghost" onClick={useCurrentLocation} disabled={locating || loading}>
            {locating ? t("farmer.cropAdvisor.locating") : t("farmer.cropAdvisor.useCurrentLocation")}
          </Button>
          <Button className="btn primary" onClick={handleGenerate} disabled={loading}>
            {loading ? t("farmer.cropAdvisor.analyzing") : t("farmer.cropAdvisor.generate")}
          </Button>
        </div>
      </section>

      {result && (
        <section className="widget-card">
          <h3>
            {t("farmer.cropAdvisor.result")}: {result.location} ({result.temperatureCelsius}°C, {result.humidityPercentage}% {t("farmer.cropAdvisor.humidity")})
          </h3>
          <div className="smart-inline" style={{ marginBottom: "10px" }}>
            <Button className="btn ghost" onClick={handleGenerateAiInsight} disabled={aiLoading}>
              {aiLoading ? t("farmer.cropAdvisor.generatingAiAdvice") : t("farmer.cropAdvisor.generateAiAdvisory")}
            </Button>
          </div>
          {aiInsight && <p className="data-sync-meta">{aiInsight}</p>}
          <div className="smart-grid">
            {result.recommendations?.map((item) => (
              <article className="smart-card" key={item.cropName}>
                <h4>{item.cropName}</h4>
                <p className="smart-score">{item.suitabilityPercentage}% {t("farmer.cropAdvisor.suitability")}</p>
                <p>{item.reason}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="widget-card">
        <h3>{t("farmer.cropAdvisor.recentRecommendations")}</h3>
        {history.length === 0 ? (
          <p className="empty-state">{t("farmer.cropAdvisor.noHistory")}</p>
        ) : (
          <div className="smart-table">
            {history.slice(0, 8).map((entry) => (
              <div className="smart-row" key={entry.recordId}>
                <strong>{entry.location}</strong>
                <span>{entry.temperatureCelsius}C</span>
                <span>{entry.humidityPercentage}%</span>
                <span>{new Date(entry.createdAt).toLocaleString(language === "mr" ? "mr-IN" : undefined)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
