import axios from "axios";

const API_KEY = "23b206a3fc43436ca9b192042260402"; // <-- इथे new key टाक

export const getWeather = async (city) => {
  const response = await axios.get(
    "https://api.weatherapi.com/v1/current.json",
    {
      params: {
        key: API_KEY,
        q: city
      }
    }
  );

  return response.data;
};
