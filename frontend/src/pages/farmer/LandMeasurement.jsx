import { useEffect, useMemo, useState } from "react";
import { MapContainer, Polygon, TileLayer, useMapEvents, CircleMarker, Tooltip } from "react-leaflet";
import { toast } from "react-toastify";
import Button from "../../components/ui/Button";
import BackButton from "../../components/BackButton";
import { fetchLandMeasurementHistory, saveLandMeasurement } from "../../services/smartAgriService";
import { getCurrentCoordinates } from "../../utils/geolocation";
import { getWeather } from "../../services/weatherService";
import { useLanguage } from "../../context/LanguageContext";
import "leaflet/dist/leaflet.css";

const EARTH_RADIUS_M = 6378137;
const SQM_TO_ACRE = 0.00024710538146717;

function MapClickHandler({ onAddPoint }) {
  useMapEvents({
    click(e) {
      onAddPoint({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
}

function MapRecenter({ center }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (center?.length === 2) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

function computeAreaSquareMeters(points) {
  if (!points || points.length < 3) return 0;
  const avgLatRad = points.reduce((sum, p) => sum + (p.latitude * Math.PI) / 180, 0) / points.length;

  const projected = points.map((p) => {
    const latRad = (p.latitude * Math.PI) / 180;
    const lonRad = (p.longitude * Math.PI) / 180;
    return {
      x: EARTH_RADIUS_M * lonRad * Math.cos(avgLatRad),
      y: EARTH_RADIUS_M * latRad,
    };
  });

  let area = 0;
  for (let i = 0; i < projected.length; i += 1) {
    const next = (i + 1) % projected.length;
    area += projected[i].x * projected[next].y - projected[next].x * projected[i].y;
  }
  return Math.abs(area) / 2;
}

export default function LandMeasurement() {
  const { t, language } = useLanguage();
  const [points, setPoints] = useState([]);
  const [locationLabel, setLocationLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationMeta, setLocationMeta] = useState("");
  const [history, setHistory] = useState([]);
  const [mapCenter, setMapCenter] = useState([18.5204, 73.8567]);
  const [mapStyle, setMapStyle] = useState("street");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await fetchLandMeasurementHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load measurement history", error);
    }
  };

  const areaSquareMeters = useMemo(() => computeAreaSquareMeters(points), [points]);
  const areaAcres = useMemo(() => areaSquareMeters * SQM_TO_ACRE, [areaSquareMeters]);
  const polygon = points.map((p) => [p.latitude, p.longitude]);

  const mapTiles = {
    street: {
      label: t("farmer.landMeasurement.street"),
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors",
    },
    satellite: {
      label: t("farmer.landMeasurement.satellite"),
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri",
    },
  };

  const handleSave = async () => {
    if (points.length < 4) {
      toast.error(t("farmer.landMeasurement.toastMinPoints"));
      return;
    }
    try {
      setSaving(true);
      await saveLandMeasurement({ locationLabel, points });
      toast.success(t("farmer.landMeasurement.toastSaved"));
      setPoints([]);
      setLocationLabel("");
      loadHistory();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || t("farmer.landMeasurement.toastSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const fetchCurrentLocation = () => {
    setLocating(true);
    getCurrentCoordinates({ fastMode: true })
      .then(({ latitude, longitude, accuracy }) => {
        setMapCenter([latitude, longitude]);
        setLocationMeta(`GPS accuracy: ${Math.round(accuracy)} m`);
        setLocating(false);
        toast.success(t("farmer.landMeasurement.toastCentered"));
      })
      .catch((error) => {
        console.error("Geolocation error", error);
        toast.warn(`${error.message}. Using network location.`);
        return getWeather("auto:ip")
          .then((weather) => {
            const lat = weather?.location?.lat;
            const lon = weather?.location?.lon;
            if (typeof lat === "number" && typeof lon === "number") {
              setMapCenter([lat, lon]);
              setLocationMeta(t("farmer.landMeasurement.networkLocation"));
              toast.success(t("farmer.landMeasurement.toastCentered"));
              return;
            }
            toast.error(t("farmer.landMeasurement.toastLocationError"));
          })
          .catch(() => toast.error(t("farmer.landMeasurement.toastLocationError")));
      })
      .finally(() => setLocating(false));
  };

  const addCurrentLocationPoint = async () => {
    try {
      setLocating(true);
      const { latitude, longitude, accuracy } = await getCurrentCoordinates({ fastMode: true });
      setMapCenter([latitude, longitude]);
      setPoints((prev) => [...prev, { latitude, longitude }]);
      setLocationMeta(`GPS accuracy: ${Math.round(accuracy)} m`);
      toast.success(t("farmer.landMeasurement.toastPointAdded"));
    } catch (error) {
      console.error("Geolocation error", error);
      toast.warn(`${error.message}. Trying network location.`);
      try {
        const weather = await getWeather("auto:ip");
        const lat = weather?.location?.lat;
        const lon = weather?.location?.lon;
        if (typeof lat === "number" && typeof lon === "number") {
          setMapCenter([lat, lon]);
          setPoints((prev) => [...prev, { latitude: lat, longitude: lon }]);
          setLocationMeta(t("farmer.landMeasurement.networkLocation"));
          toast.success(t("farmer.landMeasurement.toastNetworkPoint"));
        } else {
          toast.error(t("farmer.landMeasurement.toastLocationError"));
        }
      } catch {
        toast.error(t("farmer.landMeasurement.toastLocationError"));
      }
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="smart-page">
      <BackButton />
      <div className="page-hero smart-hero smart-hero-land">
        <h1>{t("farmer.landMeasurement.title")}</h1>
        <p>{t("farmer.landMeasurement.subtitle")}</p>
      </div>

      <section className="widget-card smart-form">
        <div className="form-row smart-inline">
          <input
            className="input"
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            placeholder={t("farmer.landMeasurement.optionalLabel")}
          />
          <Button className="btn ghost" onClick={fetchCurrentLocation} disabled={locating}>
            {locating ? t("farmer.landMeasurement.locating") : t("farmer.landMeasurement.useCurrentLocation")}
          </Button>
          <Button className="btn ghost" onClick={addCurrentLocationPoint} disabled={locating}>
            {locating ? t("farmer.landMeasurement.locating") : t("farmer.landMeasurement.addCurrentPoint")}
          </Button>
          <Button className="btn ghost" onClick={() => setPoints([])}>
            {t("farmer.landMeasurement.clear")}
          </Button>
          <select
            className="input"
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value)}
            style={{ minWidth: "160px" }}
          >
            {Object.entries(mapTiles).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
          <Button className="btn primary" onClick={handleSave} disabled={saving || points.length < 4}>
            {saving ? t("farmer.landMeasurement.saving") : t("farmer.landMeasurement.saveMeasurement")}
          </Button>
        </div>
        <p>
          {t("farmer.landMeasurement.points")}: <strong>{points.length}</strong> | {t("farmer.landMeasurement.area")}: <strong>{areaAcres.toFixed(3)} {t("farmer.landMeasurement.acres")}</strong>
        </p>
        {locationMeta && <p className="data-sync-meta">{locationMeta}</p>}
      </section>

      <section className="widget-card">
        <MapContainer center={mapCenter} zoom={12} className="smart-map">
          <TileLayer
            attribution={mapTiles[mapStyle].attribution}
            url={mapTiles[mapStyle].url}
          />
          <MapRecenter center={mapCenter} />
          <MapClickHandler onAddPoint={(point) => setPoints((prev) => [...prev, point])} />
          {points.map((point, index) => (
            <CircleMarker
              key={`${point.latitude}-${point.longitude}-${index}`}
              center={[point.latitude, point.longitude]}
              radius={6}
              pathOptions={{ color: "#1b7a4e", fillColor: "#1b7a4e", fillOpacity: 0.8 }}
            >
              <Tooltip permanent>{index + 1}</Tooltip>
            </CircleMarker>
          ))}
          {polygon.length >= 3 && <Polygon positions={polygon} pathOptions={{ color: "#1b7a4e" }} />}
        </MapContainer>
      </section>

      <section className="widget-card">
        <h3>{t("farmer.landMeasurement.recentMeasurements")}</h3>
        {history.length === 0 ? (
          <p className="empty-state">{t("farmer.landMeasurement.noMeasurements")}</p>
        ) : (
          <div className="smart-table">
            {history.slice(0, 8).map((item) => (
              <div className="smart-row" key={item.id}>
                <strong>{item.locationLabel || t("farmer.landMeasurement.unnamedField")}</strong>
                <span>{item.pointCount} {t("farmer.landMeasurement.points")}</span>
                <span>{item.areaAcres} {t("farmer.landMeasurement.acres")}</span>
                <span>{new Date(item.createdAt).toLocaleString(language === "mr" ? "mr-IN" : undefined)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
