
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
	ChevronLeft,
	ChevronRight,
	PenSquare,
	Twitter,
	Linkedin,
	CheckCircle,
	Clock,
	AlertCircle,
} from "lucide-react";
import {
	format,
	startOfMonth,
	endOfMonth,
	eachDayOfInterval,
	isSameDay,
	isSameMonth,
	isToday,
	addMonths,
	subMonths,
} from "date-fns";

const STATUS_STYLES = {
	published: "bg-green-500/20 text-green-400 border-green-500/30",
	scheduled: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
	failed: "bg-red-500/20 text-red-400 border-red-500/30",
	draft: "bg-slate-100 text-slate-700 border-slate-200",
};

const STATUS_ICONS = {
	published: CheckCircle,
	scheduled: Clock,
	failed: AlertCircle,
};

export default function Calendar() {
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedDay, setSelectedDay] = useState(null);

	const fetchPosts = async (date) => {
		setLoading(true);
		try {
			const { data } = await api.get("/posts/calendar", {
				params: { month: date.getMonth() + 1, year: date.getFullYear() },
			});
			setPosts(data.posts || []);
		} catch (err) {
			console.error(err);
			setPosts([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchPosts(currentMonth);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentMonth]);

	const monthStart = startOfMonth(currentMonth);
	const monthEnd = endOfMonth(currentMonth);
	const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

	const startPad = monthStart.getDay();
	const paddedDays = [...Array(startPad).fill(null), ...days];

	const getPostsForDay = (day) => {
		if (!day) return [];
		return posts.filter((p) => {
			const d = new Date(p.scheduledAt);
			return isSameDay(d, day);
		});
	};

	const selectedDayPosts = selectedDay ? getPostsForDay(selectedDay) : [];

	return (
		<div className="min-h-full w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
			<div className="mx-auto max-w-[1400px]">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
					<div>
						<h1 className="text-3xl font-semibold text-slate-900">Content Calendar</h1>
						<p className="text-slate-600 text-sm mt-2">
							{posts.length} posts in {format(currentMonth, "MMMM yyyy")}
						</p>
					</div>
					<Link to="/posts/create" className="btn-primary flex items-center gap-2 text-sm">
						<PenSquare size={15} /> New Post
					</Link>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
					<div className="lg:col-span-3 card p-0 overflow-hidden">
						<div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/40 bg-slate-50">
							<button
								onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
								className="p-1.5 rounded-lg transition-colors text-slate-700 hover:bg-slate-200"
							>
								<ChevronLeft size={18} />
							</button>
							<h2 className="font-semibold text-slate-900">{format(currentMonth, "MMMM yyyy")}</h2>
							<button
								onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
								className="p-1.5 rounded-lg transition-colors text-slate-700 hover:bg-slate-200"
							>
								<ChevronRight size={18} />
							</button>
						</div>

						<div className="grid grid-cols-7 border-b border-slate-200/10">
							{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
								<div key={d} className="py-2 text-center text-xs font-medium text-slate-600">
									{d}
								</div>
							))}
						</div>

						{loading ? (
							<div className="flex items-center justify-center py-20">
								<div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
							</div>
						) : (
							<div className="grid grid-cols-7">
								{paddedDays.map((day, idx) => {
									const dayPosts = day ? getPostsForDay(day) : [];
									const isSelected = selectedDay && day && isSameDay(day, selectedDay);

									const outerClasses = [
										"min-h-[90px] p-1.5 border-b border-r border-slate-200/8 transition-colors",
										!day ? "bg-slate-50" : "cursor-pointer hover:bg-slate-100",
										isSelected ? "bg-brand-500/8 border-brand-500/30" : "",
									]
										.filter(Boolean)
										.join(" ");

									const dayNumberClasses = [
										"inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium",
										isToday(day) ? "bg-brand-500 text-white" : isSameMonth(day, currentMonth) ? "text-slate-700" : "text-slate-500",
									].join(" ");

									return (
										<div
											key={idx}
											onClick={() => day && setSelectedDay(isSelected ? null : day)}
											className={outerClasses}
										>
											{day && (
												<>
													<span className={dayNumberClasses}>{format(day, "d")}</span>
													<div className="mt-1 space-y-0.5">
														{dayPosts.slice(0, 3).map((post) => (
															<div
																key={post._id}
																className={`text-xs px-1.5 py-0.5 rounded border truncate ${
																	STATUS_STYLES[post.status] || STATUS_STYLES.draft
																}`}
															>
																{post.content?.slice(0, 18)}…
															</div>
														))}
														{dayPosts.length > 3 && <p className="text-xs text-slate-700 pl-1">+{dayPosts.length - 3} more</p>}
													</div>
												</>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>

					<div className="space-y-4">
						<div className="card">
							<p className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Legend</p>
							{Object.entries(STATUS_STYLES).map(([status, cls]) => (
								<div key={status} className="flex items-center gap-2 mb-1.5">
									<div className={`w-3 h-3 rounded-sm border ${cls}`} />
									<span className="text-xs text-slate-700 capitalize">{status}</span>
								</div>
							))}
						</div>

						{selectedDay ? (
							<div className="card">
								<p className="text-sm font-semibold text-slate-900 mb-3">{format(selectedDay, "MMMM d")}</p>
								{selectedDayPosts.length === 0 ? (
									<div className="text-center py-4">
										<p className="text-slate-500 text-sm">No posts this day</p>
										<Link to="/posts/create" className="text-brand-400 text-xs hover:text-brand-300 mt-1 inline-block">+ Schedule one</Link>
									</div>
								) : (
									<div className="space-y-3">
										{selectedDayPosts.map((post) => {
											const StatusIcon = STATUS_ICONS[post.status] || Clock;
											const iconColor = post.status === "published" ? "text-green-400" : post.status === "failed" ? "text-red-400" : "text-yellow-400";
											return (
												<div key={post._id} className="p-4 rounded-2xl border border-slate-200/10 bg-white">
													<div className="flex items-center gap-1.5 mb-1.5">
														<StatusIcon size={13} className={iconColor} />
														<span className="text-xs text-slate-700 capitalize">{post.status}</span>
														<span className="ml-auto text-xs text-slate-500">{format(new Date(post.scheduledAt), "h:mm a")}</span>
													</div>
													<p className="text-sm text-slate-700 line-clamp-3">{post.content}</p>
													<div className="flex items-center gap-2 mt-2">
														{post.platforms?.map((p) => (
															<span key={p} className="text-slate-700">
																{p === "twitter" ? <Twitter size={12} /> : <Linkedin size={12} />}
															</span>
														))}
														{post.engagementScore?.score && <span className="ml-auto text-xs text-brand-400">Score: {post.engagementScore.score}/10</span>}
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
						) : (
							<div className="card text-center py-6">
								<p className="text-slate-600 text-sm">Click a day to see posts</p>
							</div>
						)}

						<div className="card">
							<p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">This Month</p>
							{[
								{ label: "Total scheduled", value: posts.length },
								{ label: "Published", value: posts.filter((p) => p.status === "published").length },
								{ label: "Upcoming", value: posts.filter((p) => p.status === "scheduled").length },
								{ label: "Failed", value: posts.filter((p) => p.status === "failed").length },
							].map(({ label, value }) => (
								<div key={label} className="flex justify-between items-center py-1.5 text-sm border-b border-slate-200/5 last:border-0">
									<span className="text-slate-600">{label}</span>
									<span className="text-slate-900 font-medium">{value}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

