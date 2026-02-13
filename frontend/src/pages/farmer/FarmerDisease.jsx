import { useState } from "react";
import Button from "../../components/ui/Button";
import { toast } from "react-toastify";
import { predictDisease } from "../../services/diseaseService";

function FarmerDisease() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const img = e.target.files[0];
    setFile(img);
    setPreview(URL.createObjectURL(img));
    setResult(null);
    setError("");
  };

  const handlePredict = async () => {
    if (!file) {
      toast.error("Please upload leaf image");
      return;
    }

    try {
      setLoading(true);
      const res = await predictDisease(file);
      setResult(res);
    } catch (err) {
      console.error(err);
      setError("Prediction failed. Backend not responding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="dash-title">Plant Disease Detection</h2>
      <p className="dash-subtitle">Upload a leaf image to detect disease.</p>

      <div className="disease-card">
        <label className="file-label">
          Upload leaf image
          <input type="file" onChange={handleImageChange} className="file-input" />
        </label>

        {preview && (
          <img src={preview} alt="preview" className="upload-preview" />
        )}

        <Button onClick={handlePredict} loading={loading} className="btn primary">
          Detect Disease
        </Button>

        {error && <p className="dash-subtitle">{error}</p>}

        {result && (
          <div className="info-list">
            <h3>{result.disease}</h3>
            <p>
              <strong>Description:</strong> {result.description}
            </p>
            <p>
              <strong>Prevention:</strong> {result.prevention}
            </p>
            <p>
              <strong>Confidence:</strong> {result.confidence}%
            </p>
            <a href={result.buy_link} target="_blank" rel="noreferrer">
              Buy Recommended Supplement
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default FarmerDisease;
