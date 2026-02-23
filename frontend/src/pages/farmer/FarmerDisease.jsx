import { useState } from "react";
import Button from "../../components/ui/Button";
import { toast } from "react-toastify";
import { predictDisease } from "../../services/diseaseService";
import { useLanguage } from "../../context/LanguageContext";

function FarmerDisease() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const handleImageChange = (e) => {
    const img = e.target.files[0];
    setFile(img);
    setPreview(URL.createObjectURL(img));
    setResult(null);
    setError("");
  };

  const handlePredict = async () => {
    if (!file) {
      toast.error(t("messages.selectImage"));
      return;
    }

    try {
      setLoading(true);
      const res = await predictDisease(file);
      setResult(res);
    } catch (err) {
      console.error(err);
      setError(t("messages.predictionFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="dash-title">{t("farmer.disease.title")}</h2>
      <p className="dash-subtitle">{t("farmer.disease.subtitle")}</p>

      <div className="disease-card">
        <label className="file-label">
          {t("farmer.disease.uploadLabel")}
          <input type="file" onChange={handleImageChange} className="file-input" />
        </label>

        {preview && (
          <img src={preview} alt="preview" className="upload-preview" />
        )}

        <Button onClick={handlePredict} loading={loading} className="btn primary">
          {t("common.actions.detectDisease")}
        </Button>

        {error && <p className="dash-subtitle">{error}</p>}

        {result && (
          <div className="info-list">
            <h3>{result.disease}</h3>
            <p>
              <strong>{t("farmer.disease.description")}:</strong> {result.description}
            </p>
            <p>
              <strong>{t("farmer.disease.prevention")}:</strong> {result.prevention}
            </p>
            <p>
              <strong>{t("farmer.disease.confidence")}:</strong> {result.confidence}%
            </p>
            <a href={result.buy_link} target="_blank" rel="noreferrer">
              {t("farmer.disease.buyLink")}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default FarmerDisease;
