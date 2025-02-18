import React, { useState, useRef, useEffect } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

function App() {
  const [image, setImage] = useState(null);
  const [objects, setObjects] = useState([]);
  const [user, setUser] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Load Pi SDK
    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.onload = () => {
      window.Pi.init({ version: "2.0" });
    };
    document.body.appendChild(script);
  }, []);

  // Authenticate User
  const authenticateUser = () => {
    const scopes = ["payments"];
    window.Pi.authenticate(scopes, (payment) => console.log("Incomplete payment:", payment))
      .then(auth => {
        setUser(auth);
        console.log("User authenticated:", auth);
      })
      .catch(error => console.error(error));
  };

  // Handle Image Upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
      setObjects([]); // Reset previous results
    }
  };

  // Capture Image from Camera
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageUrl = canvas.toDataURL("image/png");
    setImage(imageUrl);
    setObjects([]);
  };

  // Analyze Image using TensorFlow.js
  const analyzeImage = async () => {
    if (!image) return alert("Please upload or capture an image first!");

    const model = await cocoSsd.load();
    const imgElement = document.createElement("img");
    imgElement.src = image;
    imgElement.onload = async () => {
      const predictions = await model.detect(imgElement);
      setObjects(predictions);
    };
  };

  // Request Pi Payment
  const requestPayment = () => {
    if (!user) {
      alert("Please authenticate first!");
      return;
    }

    window.Pi.createPayment({
      amount: 0.5,
      memo: "Image Analysis Fee",
      metadata: { imageId: "1234" }
    }, {
      onReadyForServerApproval: (paymentId) => console.log("Approve payment:", paymentId),
      onReadyForServerCompletion: (paymentId, txid) => {
        console.log("Payment completed:", txid);
        analyzeImage();
      },
      onCancel: (paymentId) => console.log("Payment canceled:", paymentId),
      onError: (error, payment) => console.error("Payment error:", error)
    });
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Pi Machine Learning App</h2>

      {/* Authentication */}
      {!user ? (
        <button onClick={authenticateUser}>Login with Pi</button>
      ) : (
        <p>Welcome, {user.user.username}!</p>
      )}

      {/* Image Upload & Camera */}
      <div style={{ marginTop: "20px" }}>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <br /><br />
        <video ref={videoRef} autoPlay playsInline width="300"></video>
        <button onClick={capturePhoto}>Capture from Camera</button>
        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
      </div>

      {/* Display Image */}
      {image && <img src={image} alt="Uploaded" style={{ width: "300px", marginTop: "20px" }} />}

      {/* Request Payment & Analyze */}
      <button onClick={requestPayment} style={{ marginTop: "20px" }}>
        Pay 0.5 Pi & Analyze Image
      </button>

      {/* Results */}
      {objects.length > 0 && (
        <div style={{ marginTop: "20px", textAlign: "left", display: "inline-block" }}>
          <h3>Detected Objects:</h3>
          <ul>
            {objects.map((obj, index) => (
              <li key={index}>{obj.class} - {Math.round(obj.score * 100)}%</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
