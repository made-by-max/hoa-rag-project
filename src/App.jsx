import { useState } from "react";
import * as React from "react";
import { Send } from "lucide-react";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAnswer("");

    try {
      const response = await fetch("http://localhost:3001/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();
      setAnswer(data.answer);
      setQuestion("");
    } catch (err) {
      setAnswer("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const responseWindowStyle = {
    backgroundColor: "#C0B5A2",
    color: "#1A1B20",
    padding: "10px 20px",
    border: "1px solid #1A1B20",
    borderRadius: "5px",
    fontSize: "16px",
    width: "500px",
    minHeight: "200px",
  };

  const inputWrapperStyle = {
    backgroundColor: "#C0B5A2",
    padding: "10px 20px",
    border: "1px solid #1A1B20",
    borderRadius: "5px",
    width: "500px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };
  const inputStyle = {
    color: "#1A1B20",
    backgroundColor: "#C0B5A2",
    padding: "10px 20px",
    border: "none",
    fontSize: "16px",
    width: "400px",
  };

  return (
    <>
      <section id="center">
        <h1 style={{ color: "white" }}>HOA Regulations</h1>
        <div style={responseWindowStyle}>
          {loading ? "Searching..." : ""}
          <p className="reply">{answer}</p>
        </div>
        <div style={inputWrapperStyle}>
          <form onSubmit={handleSubmit}>
            <input
              style={inputStyle}
              type="text"
              placeholder="How can I help?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              <Send />
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

export default App;
