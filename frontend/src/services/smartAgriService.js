import api from "../api/axios";

const SMART_BASES = ["/farmer/smart", "/api/farmer/smart", "/farmer", "/api/farmer"];

const withSmartFallback = async (method, path, payload, config = {}) => {
  let lastError;
  for (const base of SMART_BASES) {
    try {
      if (method === "get") {
        const { data } = await api.get(`${base}${path}`, config);
        return data;
      }
      if (method === "post") {
        const { data } = await api.post(`${base}${path}`, payload, config);
        return data;
      }
    } catch (error) {
      lastError = error;
      if (error?.response?.status !== 404) {
        throw error;
      }
    }
  }
  throw lastError;
};

export const fetchCropRecommendations = async (location) => {
  return withSmartFallback("post", "/crop-advisor/recommendations", { location });
};

export const fetchCropRecommendationHistory = async () => {
  return withSmartFallback("get", "/crop-advisor/history");
};

export const saveLandMeasurement = async (payload) => {
  return withSmartFallback("post", "/land-measurements", payload);
};

export const fetchLandMeasurementHistory = async () => {
  return withSmartFallback("get", "/land-measurements");
};

export const generateWeeklySchedule = async (payload) => {
  return withSmartFallback("post", "/weekly-schedules", payload);
};

export const fetchWeeklySchedules = async () => {
  return withSmartFallback("get", "/weekly-schedules");
};


