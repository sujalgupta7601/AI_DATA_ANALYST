
import { ArrowUpRight } from "lucide-react";

export default function StatCard({
    title,
    value,
    icon: Icon,
    description,
}) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-[#111b2e] p-5 transition hover:border-blue-500/40">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-slate-400">{title}</p>
                    <h2 className="mt-3 text-2xl font-bold">{value}</h2>
                </div>

                <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
                    <Icon size={22} />
                </div>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs">
                <ArrowUpRight size={15} className="text-emerald-400" />
                <span className="text-slate-400">{description}</span>
            </div>
        </div>
    );
}
