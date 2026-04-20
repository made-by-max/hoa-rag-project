import { useState } from "react";
import * as React from "react";

function ChatBox() {
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
    backgroundColor: "blue",
    color: "white",
    padding: "10px 20px",
    border: "1px solid white",
    borderRadius: "5px",
    fontSize: "16px",
  };

  const inputStyle = {
    backgroundColor: "blue",
    color: "white",
    padding: "10px 20px",
    border: "1px solid white",
    borderRadius: "5px",
    fontSize: "16px",
  };

  return (
    <>
      <section id="center">
        <div style={responseWindowStyle}>
          <p className="reply">{answer}</p>
        </div>
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
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </section>
    </>
  );
}

export default ChatBox;
