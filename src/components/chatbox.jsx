"use client";
import { useState } from "react";
import { SendHorizontal } from "lucide-react";
import "./chatbox.css";
import { AnimatePresence, motion } from "motion/react";

function ChatBox() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
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

  return (
    <>
      <section id="center">
        <h1 style={{ color: "white" }}>HOA Regulations</h1>
        <div className="inputContainer">
          <input
            className="inputStyle"
            type="text"
            placeholder="How can I help?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
          />
          <motion.button
            type="submit"
            disabled={loading}
            onClick={() => setIsVisible(true)}
          >
            <SendHorizontal />
          </motion.button>
        </div>
        <AnimatePresence initial={false}>
          {isVisible ? (
            <motion.div
              className="box"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              key="box"
            >
              {loading ? "Searching..." : ""}
            </motion.div>
          ) : null}
        </AnimatePresence>
        {answer && <p className="reply">{answer}</p>}
      </section>
    </>
  );
}

export default ChatBox;
