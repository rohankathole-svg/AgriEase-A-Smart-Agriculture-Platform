import { useState } from "react";
import { motion } from "framer-motion";
import Button from "../../components/ui/Button";
import BackButton from "../../components/BackButton";
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

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer}>
      <BackButton />
      <motion.div
        className="page-hero"
        style={{ backgroundImage: "url('/images/disease.jpg')" }}
        variants={fadeUp}
      >
        <h1>{t("farmer.disease.title")}</h1>
        <p>{t("farmer.disease.subtitle")}</p>
      </motion.div>

      <motion.div className="disease-card" variants={fadeUp}>
        <label className="file-label">
          {t("farmer.disease.uploadLabel")}
          <input type="file" onChange={handleImageChange} className="file-input" />
        </label>

        {preview && (
          <img src={preview} alt="preview" className="upload-preview" style={{ borderRadius: "12px", marginTop: "16px" }} />
        )}

        <div style={{ marginTop: "20px" }}>
          <Button onClick={handlePredict} loading={loading} className="btn primary">
            {t("common.actions.detectDisease")}
          </Button>
        </div>

        {error && <p className="dash-subtitle" style={{ marginTop: "12px", color: "var(--agri-danger)" }}>{error}</p>}

        {result && (
          <motion.div
            className="info-list"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ marginTop: "24px", background: "rgba(255,255,255,0.7)", padding: "24px", borderRadius: "16px" }}
          >
            <h3 style={{ marginTop: 0 }}>{result.disease}</h3>
            <p>
              <strong>{t("farmer.disease.description")}:</strong> {result.description}
            </p>
            <p>
              <strong>{t("farmer.disease.prevention")}:</strong> {result.prevention}
            </p>
            <p>
              <strong>{t("farmer.disease.confidence")}:</strong> {result.confidence}%
            </p>
            <a href={result.buy_link} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "12px", fontWeight: "700", color: "#15803d" }}>
              {t("farmer.disease.buyLink")} →
            </a>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default FarmerDisease;
