import React, { useEffect, useState } from "react";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load the Pi SDK
    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;
    script.onload = () => initializePiSDK();
    document.body.appendChild(script);
  }, []);

  const initializePiSDK = () => {
    if (window.Pi) {
      window.Pi.init({ version: "2.0", sandbox: true });
      authenticateUser();
    } else {
      console.error("Pi SDK failed to load.");
    }
  };

  const authenticateUser = () => {
    const scopes = ["payments"];

    window.Pi.authenticate(scopes, (payment) => {
      console.log("Incomplete payment found:", payment);
    })
      .then((auth) => {
        setUser(auth.user);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Authentication failed:", error);
        setLoading(false);
      });
  };

  const handlePayment = () => {
    window.Pi.createPayment(
      {
        amount: 1.0, // Amount in Pi
        memo: "Test Payment", // Payment message
        metadata: { orderId: 1234 }, // Custom data
      },
      {
        onReadyForServerApproval: (paymentId) => {
          console.log("Payment ready for approval:", paymentId);
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          console.log("Payment completed:", paymentId, txid);
        },
        onCancel: (paymentId) => {
          console.log("Payment canceled:", paymentId);
        },
        onError: (error, payment) => {
          console.error("Payment error:", error, payment);
        },
      }
    );
  };

  return (
    <div>
      <h1>Pi Network App</h1>
      {loading ? (
        <p>Loading...</p>
      ) : user ? (
        <div>
          <p>Welcome, {user.username}!</p>
          <button onClick={handlePayment}>Pay 1 Pi</button>
        </div>
      ) : (
        <p>Authentication failed. Try reloading the page.</p>
      )}
    </div>
  );
};

export default App;
