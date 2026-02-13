import os
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from PIL import Image
import torchvision.transforms.functional as TF
import CNN
import numpy as np
import torch
import pandas as pd

# ================= LOAD DATA =================
disease_info = pd.read_csv('disease_info.csv', encoding='cp1252')
supplement_info = pd.read_csv('supplement_info.csv', encoding='cp1252')

model = CNN.CNN(39)
model.load_state_dict(torch.load("plant_disease_model_1_latest.pt", map_location=torch.device('cpu')))
model.eval()

# ================= FLASK APP =================
app = Flask(__name__)
CORS(app)   # 🔥 REQUIRED for React

# ================= PREDICTION FUNCTION =================
def prediction(image_path):
    image = Image.open(image_path).convert("RGB")
    image = image.resize((224, 224))
    input_data = TF.to_tensor(image)
    input_data = input_data.view((-1, 3, 224, 224))
    output = model(input_data)
    # convert logits to probabilities using softmax for a proper confidence score
    probs = torch.nn.functional.softmax(output, dim=1)
    probs = probs.detach().numpy()
    index = int(np.argmax(probs))
    confidence = float(np.max(probs))
    return index, confidence

# ================= ROUTES =================
@app.route('/')
def home_page():
    return render_template('home.html')

@app.route('/contact')
def contact():
    return render_template('contact-us.html')

@app.route('/index')
def ai_engine_page():
    return render_template('index.html')

@app.route('/mobile-device')
def mobile_device_detected_page():
    return render_template('mobile-device.html')

@app.route('/submit', methods=['POST'])
def submit():
    image = request.files['image']
    filename = image.filename
    file_path = os.path.join('static/uploads', filename)
    image.save(file_path)

    pred, _ = prediction(file_path)

    return render_template(
        'submit.html',
        title=disease_info['disease_name'][pred],
        desc=disease_info['description'][pred],
        prevent=disease_info['Possible Steps'][pred],
        image_url=disease_info['image_url'][pred],
        sname=supplement_info['supplement name'][pred],
        simage=supplement_info['supplement image'][pred],
        buy_link=supplement_info['buy link'][pred]
    )

# ================= 🔥 API FOR REACT =================
@app.route('/predict', methods=['POST'])
def predict_api():
    """Standalone file-upload API (kept for testing)"""
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    image = request.files['file']
    filename = image.filename
    upload_path = os.path.join('static/uploads', filename)
    image.save(upload_path)

    pred, confidence = prediction(upload_path)

    return jsonify({
        "disease": disease_info['disease_name'][pred],
        "description": disease_info['description'][pred],
        "prevention": disease_info['Possible Steps'][pred],
        "confidence": round(float(confidence) * 100, 2),
        "supplement": supplement_info['supplement name'][pred],
        "buy_link": supplement_info['buy link'][pred]
    })


@app.route('/predict-by-path', methods=['POST'])
def predict_by_path():
    """
    API used by Spring Boot.
    Expects JSON body: {"image_path": "C:/.../uploads/plant-images/xxx.jpg"}
    Returns: disease, confidence (percent), description, prevention, buy_link
    """
    data = request.get_json()
    if not data or 'image_path' not in data:
        return jsonify({"error": "image_path is required"}), 400

    image_path = data['image_path']
    if not os.path.exists(image_path):
        return jsonify({"error": f"File not found: {image_path}"}), 404

    pred, confidence = prediction(image_path)

    # Build full response (include description/prevention and supplement link)
    resp = {
        "disease": disease_info['disease_name'][pred],
        "confidence": round(float(confidence) * 100, 2),
        "description": disease_info['description'][pred],
        "prevention": disease_info['Possible Steps'][pred],
        "recommendation": disease_info['Possible Steps'][pred],
    }

    # attempt to add supplement/buy link if available
    try:
        resp["supplement"] = supplement_info['supplement name'][pred]
        resp["buy_link"] = supplement_info['buy link'][pred]
    except Exception:
        # non-fatal if supplement info missing
        resp["supplement"] = None
        resp["buy_link"] = None

    return jsonify(resp)
print(app.url_map)

# ================= RUN SERVER =================
if __name__ == '__main__':

    app.run(debug=True)
