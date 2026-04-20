import { ComposerPrimitive } from "@assistant-ui/react";
import { ArrowUpIcon } from "lucide-react";
import { useState } from "react";

export function MinimalComposer() {
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

  return (
    <ComposerPrimitive.Root
      className="flex w-full flex-col rounded-3xl border bg-muted"
      onSubmit={handleSubmit}
    >
      <ComposerPrimitive.Input
        type="text"
        placeholder="How can I help?"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={loading}
      />
      <div className="flex items-center justify-end px-3 pb-3">
        <ComposerPrimitive.Send
          type="submit"
          disabled={loading}
          className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-30"
        >
          <ArrowUpIcon className="size-4" />
        </ComposerPrimitive.Send>
      </div>
      <p className="reply">{answer}</p>
    </ComposerPrimitive.Root>
  );
}
