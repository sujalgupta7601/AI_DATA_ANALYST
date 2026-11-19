
import { useEffect, useState } from "react";
import {
    DollarSign,
    ShoppingCart,
    Package,
    TrendingUp,
} from "lucide-react";

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar,
} from "recharts";

import StatCard from "../components/StatCard";
import { fetchDashboard } from "../services/api";
import { currency } from "../data/mockData";

export default function Dashboard() {
    const [period, setPeriod] = useState("12");
    const [metric, setMetric] = useState("revenue");

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            setLoading(true);
            setError("");

            try {
                const result = await fetchDashboard(period);

                if (active) {
                    setDashboard(result.data);
                }
            } catch (err) {
                if (active) {
                    setError(err.message);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadDashboard();

        return () => {
            active = false;
        };
    }, [period]);

    if (loading) {
        return (
            <div className="rounded-2xl bg-[#111b2e] p-8 text-slate-300">
                Loading dashboard data...
            </div>
        );
    }

    if (error || !dashboard) {
        return (
            <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
                <h2 className="font-semibold">Could not load dashboard</h2>
                <p className="mt-2 text-sm">
                    {error || "No dashboard data available."}
                </p>
                <p className="mt-2 text-sm">
                    Check that your Express backend is running on port 5000.
                </p>
            </div>
        );
    }

    const { stats, monthlySales, products } = dashboard;

    const cards = [
        {
            title: "Total Revenue",
            value: currency(stats.totalRevenue),
            icon: DollarSign,
            description: "For selected period",
        },
        {
            title: "Total Orders",
            value: stats.totalOrders.toLocaleString(),
            icon: ShoppingCart,
            description: "For selected period",
        },
        {
            title: "Products",
            value: stats.totalProducts,
            icon: Package,
            description: "Available sample products",
        },
        {
            title: "Avg. Order Value",
            value: currency(stats.averageOrderValue),
            icon: TrendingUp,
            description: "Revenue divided by orders",
        },
    ];

    return (
        <div className="space-y-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold md:text-3xl">
                        Analytics Overview
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Live data from our Express API (sample dataset).
                    </p>
                </div>

                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-[#111b2e] px-4 py-3 text-sm"
                    aria-label="Select reporting period"
                >
                    <option value="12">Last 12 months</option>
                    <option value="6">Last 6 months</option>
                    <option value="3">Last 3 months</option>
                </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <StatCard key={card.title} {...card} />
                ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-[#111b2e] p-5 xl:col-span-2">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="font-semibold">Performance Overview</h2>
                            <p className="text-xs text-slate-400">
                                Revenue and orders from the backend
                            </p>
                        </div>

                        <div className="flex rounded-lg bg-slate-800 p-1">
                            {["revenue", "orders"].map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setMetric(item)}
                                    className={`rounded-md px-3 py-2 text-xs capitalize ${metric === item
                                            ? "bg-blue-600 text-white"
                                            : "text-slate-400"
                                        }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlySales}>
                                <defs>
                                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid
                                    stroke="#263247"
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />

                                <XAxis
                                    dataKey="month"
                                    stroke="#94a3b8"
                                    tickLine={false}
                                    axisLine={false}
                                />

                                <YAxis
                                    stroke="#94a3b8"
                                    tickLine={false}
                                    axisLine={false}
                                    width={55}
                                    tickFormatter={(v) =>
                                        metric === "revenue" ? `${v / 1000}k` : v
                                    }
                                />

                                <Tooltip
                                    contentStyle={{
                                        background: "#0d1424",
                                        border: "1px solid #334155",
                                        borderRadius: 12,
                                    }}
                                    formatter={(value) =>
                                        metric === "revenue" ? currency(value) : value
                                    }
                                />

                                <Area
                                    type="monotone"
                                    dataKey={metric}
                                    stroke="#60a5fa"
                                    strokeWidth={3}
                                    fill="url(#revenueFill)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#111b2e] p-5">
                    <h2 className="font-semibold">Top Products</h2>
                    <p className="mb-6 text-xs text-slate-400">
                        Revenue by product
                    </p>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={products}
                                layout="vertical"
                                margin={{ left: 5, right: 10 }}
                            >
                                <XAxis type="number" hide />

                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={85}
                                    stroke="#94a3b8"
                                    tickLine={false}
                                    axisLine={false}
                                />

                                <Tooltip
                                    cursor={{ fill: "#1e293b" }}
                                    contentStyle={{
                                        background: "#0d1424",
                                        border: "1px solid #334155",
                                        borderRadius: 12,
                                    }}
                                    formatter={(value) => currency(value)}
                                />

                                <Bar
                                    dataKey="revenue"
                                    fill="#818cf8"
                                    radius={[0, 6, 6, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#111b2e] p-5">
                <h2 className="mb-5 font-semibold">Product Performance</h2>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[550px] text-left text-sm">
                        <thead className="border-b border-slate-700 text-slate-400">
                            <tr>
                                <th className="pb-4">Product</th>
                                <th className="pb-4">Category</th>
                                <th className="pb-4">Units Sold</th>
                                <th className="pb-4 text-right">Revenue</th>
                            </tr>
                        </thead>

                        <tbody>
                            {products.map((product) => (
                                <tr
                                    key={product.name}
                                    className="border-b border-slate-800 last:border-0"
                                >
                                    <td className="py-4 font-medium">
                                        {product.name}
                                    </td>
                                    <td className="py-4 text-slate-400">
                                        {product.category}
                                    </td>
                                    <td className="py-4">{product.sales}</td>
                                    <td className="py-4 text-right">
                                        {currency(product.revenue)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
