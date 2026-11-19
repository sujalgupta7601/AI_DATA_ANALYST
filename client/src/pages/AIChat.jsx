
import { useState } from "react";
import {
    Bot,
    Send,
    User,
    Sparkles,
    LoaderCircle,
} from "lucide-react";

import { sendChat } from "../services/api";

const suggestions = [
    "What is the total revenue?",
    "Which product performs best?",
    "How many orders do we have?",
];

export default function AIChat() {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content:
                "Hello! I'm DataPilot AI. I'm currently connected to our Express backend in demo mode.",
        },
    ]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    async function sendMessage(value = input) {
        const question = value.trim();

        if (!question || loading) return;

        setMessages((prev) => [
            ...prev,
            { role: "user", content: question },
        ]);

        setInput("");
        setLoading(true);

        try {
            const result = await sendChat(question);

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: result.reply },
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: `Request failed: ${error.message}`,
                },
            ]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex h-[calc(100dvh-145px)] min-h-[400px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#111b2e]">
            <div className="flex items-center gap-3 border-b border-slate-800 p-4">
                <div className="rounded-xl bg-blue-600/20 p-3 text-blue-400">
                    <Bot size={22} />
                </div>

                <div>
                    <h1 className="font-semibold">AI Data Copilot</h1>
                    <p className="text-xs text-amber-400">
                        Backend connected · Demo responses
                    </p>
                </div>
            </div>

            <div
                className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6"
                aria-live="polite"
            >
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex gap-3 ${message.role === "user"
                                ? "flex-row-reverse"
                                : ""
                            }`}
                    >
                        <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${message.role === "user"
                                    ? "bg-slate-700"
                                    : "bg-blue-600/20 text-blue-400"
                                }`}
                        >
                            {message.role === "user" ? (
                                <User size={18} />
                            ) : (
                                <Bot size={18} />
                            )}
                        </div>

                        <div
                            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl p-4 text-sm leading-6 ${message.role === "user"
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-800 text-slate-200"
                                }`}
                        >
                            {message.content}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex items-center gap-2 text-sm text-blue-400">
                        <LoaderCircle size={18} className="animate-spin" />
                        Waiting for backend response...
                    </div>
                )}
            </div>

            <div className="border-t border-slate-800 p-4">
                <div className="mb-4 flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion}
                            disabled={loading}
                            onClick={() => sendMessage(suggestion)}
                            className="flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-blue-500 disabled:opacity-40"
                        >
                            <Sparkles size={13} />
                            {suggestion}
                        </button>
                    ))}
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                    }}
                    className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 p-2"
                >
                    <input
                        value={input}
                        maxLength={1000}
                        disabled={loading}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask something about your data..."
                        aria-label="Your question"
                        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                    />

                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="rounded-lg bg-blue-600 p-3 text-white hover:bg-blue-500 disabled:opacity-40"
                        aria-label="Send message"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
