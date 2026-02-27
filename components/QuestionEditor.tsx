"use client";
import { useState } from "react";
import { Image as ImageIcon, Settings, CheckCircle2 } from "lucide-react";

export interface Question {
    text: string;
    image?: string;
    optionA: string;
    imageA?: string;
    optionB: string;
    imageB?: string;
    optionC: string;
    imageC?: string;
    optionD: string;
    imageD?: string;
    correct: string;
    timeLimit: number;
}

export const defaultQuestion = (): Question => ({
    text: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correct: "A",
    timeLimit: 15,
});

interface QuestionEditorProps {
    q: Question;
    index: number;
    onChange: (field: keyof Question, val: string | number) => void;
}

export default function QuestionEditor({ index, q, onChange }: QuestionEditorProps) {
    const options = ["A", "B", "C", "D"] as const;
    const colors = ["#ef4444", "#3b82f6", "#f59e0b", "#22c55e"];
    const [showImageFields, setShowImageFields] = useState(false);

    return (
        <div className="animate-fadeInUp">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Question {index + 1}</h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                        <Settings size={14} className="text-white/40" />
                        <label className="text-xs text-white/50 uppercase tracking-wider font-bold">Time Limit</label>
                        <select
                            value={q.timeLimit}
                            onChange={(e) => onChange("timeLimit", Number(e.target.value))}
                            className="bg-transparent text-sm font-bold w-12 text-center outline-none text-indigo-300 appearance-none cursor-pointer"
                        >
                            <option value={5}>5s</option>
                            <option value={10}>10s</option>
                            <option value={15}>15s</option>
                            <option value={20}>20s</option>
                            <option value={30}>30s</option>
                            <option value={60}>60s</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setShowImageFields(!showImageFields)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors border ${showImageFields ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"}`}
                    >
                        <ImageIcon size={14} /> Images
                    </button>
                </div>
            </div>

            {/* Question Text & Image */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl mb-8 flex flex-col items-center">
                {q.image && (
                    <div className="mb-4 relative group">
                        <img
                            src={q.image}
                            alt="Question preview"
                            className="max-h-[200px] object-contain rounded-xl border border-white/10 bg-black/20"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                            onLoad={(e) => (e.currentTarget.style.display = 'block')}
                        />
                    </div>
                )}
                <textarea
                    placeholder="Start typing your question here..."
                    value={q.text}
                    onChange={(e) => onChange("text", e.target.value)}
                    className="w-full bg-transparent text-2xl lg:text-3xl font-bold outline-none resize-none placeholder-white/20 text-center min-h-[80px] flex items-center justify-center leading-tight text-balance"
                />

                {showImageFields && (
                    <div className="mt-4 w-full max-w-[400px] flex items-center bg-black/40 rounded-lg p-2 pr-4 border border-white/5">
                        <div className="bg-white/10 p-2 rounded mr-3"><ImageIcon size={16} className="text-white/50" /></div>
                        <input
                            type="text"
                            placeholder="Paste main question image URL..."
                            value={q.image || ""}
                            onChange={(e) => onChange("image", e.target.value)}
                            className="bg-transparent text-sm outline-none flex-1 text-white/70"
                        />
                    </div>
                )}
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((opt, oi) => {
                    const isCorrect = q.correct === opt;
                    const optionKey = `option${opt}` as keyof Question;
                    const imageKey = `image${opt}` as keyof Question;

                    return (
                        <div
                            key={opt}
                            onClick={() => onChange("correct", opt)}
                            className={`relative rounded-2xl p-4 transition-all cursor-pointer border-2 overflow-hidden flex flex-col
                            ${isCorrect ? "shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-[1.02] z-10" : "opacity-80 hover:opacity-100 hover:scale-[1.01]"}`}
                            style={{
                                borderColor: isCorrect ? colors[oi] : "transparent",
                                background: `${colors[oi]}20`,
                            }}
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-2" style={{ background: colors[oi] }}></div>

                            <div className="flex items-start justify-between gap-3 pl-2 h-full">
                                <div className="flex-1 flex flex-col justify-center min-h-[80px]">
                                    {q[imageKey] && (
                                        <div className="mb-2 flex justify-center">
                                            <img
                                                src={q[imageKey] as string}
                                                alt={`Option ${opt} preview`}
                                                className="max-h-[80px] object-contain rounded-lg border border-white/10 bg-black/20"
                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                                onLoad={(e) => (e.currentTarget.style.display = 'block')}
                                            />
                                        </div>
                                    )}
                                    <textarea
                                        placeholder={`Add answer ${opt}`}
                                        value={(q[optionKey] as string) || ""}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            onChange(optionKey, e.target.value);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className={`w-full bg-transparent font-bold outline-none resize-none placeholder-white/30 text-white leading-tight ${q[imageKey] ? 'text-md min-h-[30px]' : 'text-lg min-h-[40px]'}`}
                                        rows={2}
                                    />

                                    {showImageFields && (
                                        <div className="mt-3 flex items-center bg-black/40 rounded-lg p-1.5 pr-3 border border-white/5" onClick={(e) => e.stopPropagation()}>
                                            <div className="bg-white/10 p-1.5 rounded mr-2"><ImageIcon size={14} className="text-white/50" /></div>
                                            <input
                                                type="text"
                                                placeholder="Paste image URL..."
                                                value={(q[imageKey] as string) || ""}
                                                onChange={(e) => onChange(imageKey, e.target.value)}
                                                className="bg-transparent text-xs outline-none flex-1 text-white/70"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 transition-all ${isCorrect ? "bg-white text-black drop-shadow-md" : "border-2 border-white/20 text-transparent"
                                        }`}
                                >
                                    {isCorrect && <CheckCircle2 size={20} className="text-[#16a34a]" strokeWidth={3} />}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className="text-center text-white/30 text-xs mt-6">
                Click a card to mark it as the correct answer.
            </p>
        </div>
    );
}
