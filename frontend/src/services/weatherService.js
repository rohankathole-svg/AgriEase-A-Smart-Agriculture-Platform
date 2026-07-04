import axios from "axios";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

if (!API_KEY) {
  console.warn("Weather API key not configured. Please set VITE_WEATHER_API_KEY in .env file");
}

export const getWeather = async (city) => {
  if (!API_KEY) {
    throw new Error("Weather API key not configured");
  }

  try {
    const response = await axios.get(
      "https://api.weatherapi.com/v1/current.json",
      {
        params: {
          key: API_KEY,
          q: city,
          aqi: "yes" // Add air quality data if available
        },
        timeout: 10000 // 10 second timeout
      }
    );

    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error(`Invalid location: ${city}`);
    } else if (error.response?.status === 403) {
      throw new Error("Weather API key is invalid or expired");
    } else if (error.code === "ENOTFOUND" || error.code === "ERR_NAME_NOT_RESOLVED") {
      throw new Error("Network connectivity issue. Please check your internet connection");
    } else if (error.message === "timeout of 10000ms exceeded") {
      throw new Error("Weather service request timed out. Please try again");
    }
    throw error;
  }
};
