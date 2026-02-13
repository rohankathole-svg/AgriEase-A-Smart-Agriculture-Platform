import { useState } from "react";
import { predictDisease } from "../services/diseaseService";
import Button from "./ui/Button";
import { toast } from "react-toastify";

function CropDiseaseDetector() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await predictDisease(image);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("AI prediction failed");
      toast.error("AI prediction failed");
    }
    setLoading(false);
  };

  return (
    <div className="disease-card reveal">
      <h3>AI Crop Disease Detection</h3>

      <label className="file-label">
        Upload leaf image
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          className="file-input"
        />
      </label>

      {image && (
        <>
          <img
            src={URL.createObjectURL(image)}
            alt="leaf"
            className="upload-preview"
          />

          <Button onClick={handleAnalyze} loading={loading} className="btn primary">
            Analyze Crop
          </Button>
        </>
      )}

      {result && (
        <div className="info-list">
          <p>
            <strong>Disease:</strong> {result.disease}
          </p>
          <p>
            <strong>Confidence:</strong> {result.confidence}%
          </p>
          <p>
            <strong>Prevention:</strong> {result.prevention}
          </p>
          <p>
            <strong>Supplement:</strong> {result.supplement}
          </p>
          <a href={result.buy_link} target="_blank" rel="noreferrer">
            Buy Supplement
          </a>
        </div>
      )}

      {error && <p className="dash-subtitle">{error}</p>}
    </div>
  );
}

export default CropDiseaseDetector;
