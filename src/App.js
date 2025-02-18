import React, { useState, useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

const App = () => {
  const [image, setImage] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadPiSDK = () => {
      const script = document.createElement("script");
      script.src = "https://sdk.minepi.com/pi-sdk.js";
      script.onload = () => {
        window.Pi.init({ version: "2.0" });
      };
      document.body.appendChild(script);
    };
    loadPiSDK();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!imageRef.current) return;
    const model = await cocoSsd.load();
    const predictions = await model.detect(imageRef.current);
    setPredictions(predictions);
  };

  const authenticateUser = () => {
    const scopes = ["payments"];
    function onIncompletePaymentFound(payment) {
      console.log("Incomplete Payment: ", payment);
    }

    window.Pi.authenticate(scopes, onIncompletePaymentFound)
      .then((auth) => {
        console.log("User authenticated: ", auth);
      })
      .catch((error) => {
        console.error("Authentication failed: ", error);
      });
  };

  const requestPayment = () => {
    window.Pi.createPayment(
      {
        amount: 0.1,
        memo: "Photo Analysis Service",
        metadata: {},
      },
      {
        onReadyForServerApproval: (paymentId) => {
          console.log("Payment Ready for Approval: ", paymentId);
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          console.log("Payment Completed: ", paymentId, txid);
        },
        onCancel: (paymentId) => {
          console.log("Payment Cancelled: ", paymentId);
        },
        onError: (error, payment) => {
          console.error("Payment Error: ", error, payment);
        },
      }
    );
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Pi Network ML Image Analysis</h2>
      <button onClick={authenticateUser}>Login with Pi</button>
      <br /><br />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <button onClick={() => fileInputRef.current.click()}>Upload Image</button>
      {image && (
        <div>
          <img
            ref={imageRef}
            src={image}
            alt="Uploaded Preview"
            style={{ maxWidth: "100%", marginTop: "20px" }}
          />
          <br />
          <button onClick={analyzeImage}>Analyze Image</button>
          <button onClick={requestPayment}>Pay with Pi</button>
        </div>
      )}
      <div>
        {predictions.length > 0 && (
          <div>
            <h3>Analysis Results:</h3>
            <ul>
              {predictions.map((p, index) => (
                <li key={index}>{`${p.class} (${Math.round(p.score * 100)}%)`}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
