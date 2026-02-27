"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Target, Save, Plus, Trash2, CheckCircle2 } from "lucide-react";
import Loader from "@/components/Loader";
import QuestionEditor, { Question, defaultQuestion } from "@/components/QuestionEditor";

export default function EditPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const editCode = params.editCode as string;

    const [title, setTitle] = useState("");
    const [questions, setQuestions] = useState<Question[]>([defaultQuestion()]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
    }, [status, router]);

    useEffect(() => {
        if (!editCode) return;
        fetch(`/api/game/get?editCode=${editCode}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.error) { setError(data.error); }
                else {
                    setTitle(data.title || "");
                    if (data.questions?.length > 0) {
                        setQuestions(
                            data.questions.sort((a: any, b: any) => a.order - b.order).map((q: any) => ({
                                text: q.text, image: q.image || undefined,
                                optionA: q.optionA, imageA: q.imageA || undefined,
                                optionB: q.optionB, imageB: q.imageB || undefined,
                                optionC: q.optionC, imageC: q.imageC || undefined,
                                optionD: q.optionD, imageD: q.imageD || undefined,
                                correct: q.correct, timeLimit: q.timeLimit,
                            }))
                        );
                    }
                }
                setFetching(false);
            })
            .catch(() => { setError("Failed to load quiz."); setFetching(false); });
    }, [editCode]);

    if (status === "loading" || fetching) return <Loader label="Loading quiz…" />;

    const updateCurrentQ = (field: keyof Question, value: string | number) => {
        setQuestions((qs) => qs.map((q, idx) => (idx === activeIndex ? { ...q, [field]: value } : q)));
    };

    const addQuestion = () => {
        setQuestions((qs) => [...qs, defaultQuestion()]);
        setActiveIndex(questions.length);
    };

    const removeQuestion = (e: React.MouseEvent, i: number) => {
        e.stopPropagation();
        if (questions.length <= 1) return;
        setQuestions((qs) => qs.filter((_, idx) => idx !== i));
        if (activeIndex === i) setActiveIndex(Math.max(0, i - 1));
        else if (activeIndex > i) setActiveIndex(activeIndex - 1);
    };

    const handleSave = async () => {
        if (questions.some((q) => !q.text || !q.optionA || !q.optionB || !q.optionC || !q.optionD)) {
            setError("Please fill in all required fields."); return;
        }
        setLoading(true); setError(""); setSaved(false);
        try {
            const res = await fetch("/api/game/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ editCode, title, questions }),
            });
            if (!res.ok) throw new Error("Failed to save");
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) { setError(String(e)); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <div className="flex bg-white/5 border-b border-white/10 p-4 items-center justify-between sticky top-0 z-10 backdrop-blur-md">
                <div className="flex items-center gap-4 flex-1">
                    <h1 className="text-xl font-black flex items-center gap-2">
                        <Target size={24} className="text-indigo-400" /> Quiz<span className="text-indigo-400">GM</span>
                    </h1>
                    <input type="text" placeholder="Enter quiz title..." value={title} onChange={(e) => setTitle(e.target.value)}
                        className="bg-black/20 border border-white/10 rounded-lg px-4 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors w-64 text-sm" />
                    <span className="text-xs text-white/30 font-mono">ID: {editCode}</span>
                </div>
                <div className="flex items-center gap-4">
                    <button className="btn-ghost flex items-center gap-2 py-1.5 px-3" onClick={() => router.push(`/host/${editCode}`)}>Exit</button>
                    <button className={`flex items-center gap-2 py-1.5 px-4 ${saved ? "btn-ghost" : "btn-primary"}`} onClick={handleSave} disabled={loading}
                        style={saved ? { color: "#4ade80", borderColor: "rgba(34,197,94,0.3)" } : {}}>
                        {loading ? "Saving..." : saved ? <><CheckCircle2 size={16} /> Saved!</> : <><Save size={16} /> Save</>}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 73px)" }}>
                <div className="w-64 bg-white/5 border-r border-white/10 overflow-y-auto flex flex-col hidden md:flex h-full">
                    <div className="p-4 border-b border-white/10 font-bold text-white/70 text-sm uppercase tracking-wider flex justify-between items-center bg-black/20 shrink-0">
                        Questions ({questions.length})
                        <button onClick={addQuestion} className="hover:text-white text-indigo-400 transition-colors"><Plus size={18} /></button>
                    </div>
                    <div className="p-2 flex-col gap-2 flex flex-1 overflow-y-auto">
                        {questions.map((q, i) => (
                            <div key={i} onClick={() => setActiveIndex(i)}
                                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border shrink-0 ${activeIndex === i ? "bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "bg-white/5 border-transparent hover:bg-white/10"}`}>
                                <div className="truncate flex-1 min-w-0 pr-2">
                                    <div className="text-xs font-bold text-indigo-300 mb-0.5">Question {i + 1}</div>
                                    <div className="text-sm truncate text-white/80">{q.text || "Empty question"}</div>
                                </div>
                                {questions.length > 1 && (
                                    <button onClick={(e) => removeQuestion(e, i)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button onClick={addQuestion} className="p-4 rounded-xl border border-dashed border-white/20 hover:border-indigo-400 hover:bg-indigo-900/20 transition-all text-white/50 hover:text-indigo-300 flex items-center justify-center gap-2 mt-2 font-medium shrink-0">
                            <Plus size={18} /> Add slide
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-6 lg:p-10 flex justify-center">
                    <div className="max-w-3xl w-full">
                        {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
                        <QuestionEditor q={questions[activeIndex]} index={activeIndex} onChange={updateCurrentQ} />
                    </div>
                </div>
            </div>
        </div>
    );
}
