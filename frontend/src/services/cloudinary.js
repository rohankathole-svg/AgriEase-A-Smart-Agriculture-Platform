import axios from "axios";

export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "agriease_preset");

  const res = await axios.post(
    "https://api.cloudinary.com/v1_1/dx2zuilnt/image/upload",
    formData
  );

  return res.data.secure_url;
};
