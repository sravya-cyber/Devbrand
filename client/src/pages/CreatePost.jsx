import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  Wand2, Zap, Hash, Star, ChevronDown, ChevronUp,
  Twitter, Linkedin, Send, Clock, RefreshCw, Image
} from "lucide-react";

const PLATFORM_LIMITS = { twitter: 280, linkedin: 3000 };

const toneOptions = ["professional", "casual", "educational", "storytelling"];
const audienceOptions = ["developers", "tech recruiters", "students", "open source community"];

export default function CreatePost() {
  const navigate = useNavigate();

  // Core state
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState(["linkedin"]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // AI state
  const [aiContext, setAiContext] = useState("");
  const [tone, setTone] = useState("professional");
  const [audience, setAudience] = useState("developers");
  const [variants, setVariants] = useState([]);
  const [score, setScore] = useState(null);
  const [hashtags, setHashtags] = useState([]);
  const [imagePrompt, setImagePrompt] = useState("");

  // UI state
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const primaryPlatform = platforms[0] || "linkedin";
  const charLimit = PLATFORM_LIMITS[primaryPlatform];

  const togglePlatform = (p) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  // Generate 3 AI variants
  const handleGenerate = async () => {
    if (!aiContext.trim()) return toast.error("Describe what you want to post about");
    setGenerating(true);
    try {
      const { data } = await api.post("/ai/generate", {
        context: aiContext,
        platform: primaryPlatform,
        tone,
        audience,
      });
      setVariants(data.variants || []);
      toast.success("3 post variants generated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  // Use a variant as content
  const selectVariant = (variant, idx) => {
    setContent(variant.content);
    setHashtags(variant.hashtags || []);
    setSelectedVariant(idx);
    toast.success("Variant selected");
    // Auto-score
    handleScore(variant.content);
  };

  // Score current content
  const handleScore = async (text = content) => {
    if (!text.trim()) return;
    setScoring(true);
    try {
      const { data } = await api.post("/ai/score", { content: text, platform: primaryPlatform });
      setScore(data);
    } catch {
      // silent fail
    } finally {
      setScoring(false);
    }
  };

  // Suggest hashtags
  const handleHashtags = async () => {
    if (!content.trim()) return toast.error("Write some content first");
    setLoadingHashtags(true);
    try {
      const { data } = await api.post("/ai/hashtags", { content, platform: primaryPlatform });
      setHashtags(data.hashtags || []);
      toast.success("Hashtags suggested!");
    } catch {
      toast.error("Hashtag suggestion failed");
    } finally {
      setLoadingHashtags(false);
    }
  };

  // Generate image prompt
  const handleImagePrompt = async () => {
    if (!content.trim()) return toast.error("Write some content first");
    setLoadingImage(true);
    try {
      const { data } = await api.post("/ai/image-prompt", { content });
      setImagePrompt(data.prompt);
      toast.success("Image prompt generated!");
    } catch {
      toast.error("Image prompt generation failed");
    } finally {
      setLoadingImage(false);
    }
  };

  // Submit post
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return toast.error("Post content is required");
    if (!scheduledAt) return toast.error("Schedule time is required");
    if (platforms.length === 0) return toast.error("Select at least one platform");

    setSubmitting(true);
    try {
      const fullContent = hashtags.length
        ? `${content}\n\n${hashtags.join(" ")}`
        : content;

      await api.post("/posts", {
        content: fullContent,
        platforms,
        scheduledAt,
        imageUrl,
        aiGenerated: variants.length > 0,
        variants,
        hashtags,
      });
      toast.success("Post scheduled successfully! 🎉");
      navigate("/calendar");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to schedule post");
    } finally {
      setSubmitting(false);
    }
  };

  const scoreColor =
    score?.score >= 8 ? "text-green-400" :
    score?.score >= 6 ? "text-yellow-400" : "text-red-400";

  // Min datetime for scheduling (now + 2 min)
  const minDateTime = new Date(Date.now() + 2 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="min-h-full w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-slate-900">Create Post</h1>
          <p className="text-slate-600 mt-2 text-sm">
            Write manually or use AI to generate from your coding activity.
          </p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — AI Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* AI Generator */}
          <div className="card">
            <button
              onClick={() => setShowAiPanel(!showAiPanel)}
              className="flex items-center justify-between w-full"
            >
              <span className="font-semibold text-slate-200 flex items-center gap-2">
                <Wand2 size={17} className="text-brand-400" /> AI Generator
              </span>
              {showAiPanel ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
            </button>

            {showAiPanel && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">What do you want to post about?</label>
                  <textarea
                    className="input text-sm resize-none"
                    rows={3}
                    placeholder="e.g. Just solved my 100th LeetCode problem, took 3 months..."
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Tone</label>
                    <select
                      className="input text-sm"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                    >
                      {toneOptions.map((t) => (
                        <option key={t} value={t} className="bg-surface-800">
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Audience</label>
                    <select
                      className="input text-sm"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                    >
                      {audienceOptions.map((a) => (
                        <option key={a} value={a} className="bg-surface-800">
                          {a.charAt(0).toUpperCase() + a.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                >
                  {generating ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <Wand2 size={15} />
                  )}
                  {generating ? "Generating..." : "Generate 3 Variants"}
                </button>

                {/* Variants */}
                {variants.length > 0 && (
                  <div className="space-y-2 mt-1">
                    <p className="text-xs text-slate-500 font-medium">Pick a variant:</p>
                    {variants.map((v, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectVariant(v, idx)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors text-sm ${
                          selectedVariant === idx
                            ? "border-brand-500 bg-brand-500/10"
                            : "border-surface-200/10 bg-surface-800 hover:border-brand-500/40"
                        }`}
                      >
                        <p className="text-xs font-medium text-brand-400 mb-1 capitalize">
                          {v.tone}
                        </p>
                        <p className="text-slate-300 line-clamp-3">{v.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Tools */}
          <div className="card space-y-2">
            <p className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" /> AI Tools
            </p>
            <button
              onClick={() => handleScore()}
              disabled={scoring || !content}
              className="btn-secondary w-full text-sm flex items-center gap-2 justify-center"
            >
              <Star size={14} />
              {scoring ? "Scoring..." : "Score my post"}
            </button>
            <button
              onClick={handleHashtags}
              disabled={loadingHashtags || !content}
              className="btn-secondary w-full text-sm flex items-center gap-2 justify-center"
            >
              <Hash size={14} />
              {loadingHashtags ? "Loading..." : "Suggest hashtags"}
            </button>
            <button
              onClick={handleImagePrompt}
              disabled={loadingImage || !content}
              className="btn-secondary w-full text-sm flex items-center gap-2 justify-center"
            >
              <Image size={14} />
              {loadingImage ? "Loading..." : "Generate image prompt"}
            </button>
          </div>

          {/* Score result */}
          {score && (
            <div className="card border-surface-200/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-200">Engagement Score</p>
                <p className={`text-2xl font-bold ${scoreColor}`}>{score.score}/10</p>
              </div>
              <p className="text-xs text-slate-400 mb-2">{score.reasoning}</p>
              {score.tips?.length > 0 && (
                <ul className="space-y-1">
                  {score.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-slate-500 flex gap-2">
                      <span className="text-brand-400 flex-shrink-0">→</span> {tip}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Image prompt result */}
          {imagePrompt && (
            <div className="card">
              <p className="text-xs font-semibold text-slate-400 mb-1.5">Image Prompt</p>
              <p className="text-xs text-slate-300 leading-relaxed">{imagePrompt}</p>
              <p className="text-xs text-slate-500 mt-2">
                Use this on{" "}
                <a href="https://www.bing.com/create" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">
                  Bing Image Creator
                </a>{" "}
                (free) to generate an image.
              </p>
            </div>
          )}
        </div>

        {/* Right — Post Editor */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="card space-y-5">
            {/* Platforms */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Post to</label>
              <div className="flex gap-3">
                {[
                  { id: "linkedin", icon: Linkedin, label: "LinkedIn", color: "text-blue-400" },
                  { id: "twitter", icon: Twitter, label: "Twitter / X", color: "text-sky-400" },
                ].map(({ id, icon: Icon, label, color }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => togglePlatform(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      platforms.includes(id)
                        ? "border-brand-500 bg-brand-500/10 text-slate-200"
                        : "border-surface-200/10 bg-surface-800 text-slate-500 hover:border-surface-200/30"
                    }`}
                  >
                    <Icon size={16} className={platforms.includes(id) ? color : ""} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-400">Content</label>
                <span className={`text-xs ${content.length > charLimit ? "text-red-400" : "text-slate-500"}`}>
                  {content.length}/{charLimit}
                </span>
              </div>
              <textarea
                className="input resize-none text-sm leading-relaxed"
                rows={10}
                placeholder="What do you want to share with the world today?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            {/* Hashtags */}
            {hashtags.length > 0 && (
              <div>
                <label className="text-xs text-slate-500 mb-2 block">Suggested hashtags (will be added to post)</label>
                <div className="flex flex-wrap gap-1.5">
                  {hashtags.map((tag, i) => (
                    <span
                      key={i}
                      onClick={() => setHashtags(hashtags.filter((_, j) => j !== i))}
                      className="badge bg-brand-500/15 text-brand-400 cursor-pointer hover:bg-red-500/15 hover:text-red-400 transition-colors"
                      title="Click to remove"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Image URL */}
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Image URL (optional)</label>
              <input
                type="url"
                className="input text-sm"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            {/* Schedule */}
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block flex items-center gap-2">
                <Clock size={14} /> Schedule for
              </label>
              <input
                type="datetime-local"
                className="input text-sm"
                min={minDateTime}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !content || !scheduledAt || platforms.length === 0}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Send size={16} />
              {submitting ? "Scheduling..." : "Schedule Post"}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
  );
}
