import api from "../api/axios";

export const predictDisease = async (imageFile) => {
  const formData = new FormData();
  formData.append("file", imageFile);

  const response = await api.post("/farmer/disease/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};
