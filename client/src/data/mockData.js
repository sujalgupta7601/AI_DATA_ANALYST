
export const monthlySales = [
    { month: "Jan", revenue: 42000, orders: 120 },
    { month: "Feb", revenue: 51000, orders: 145 },
    { month: "Mar", revenue: 48000, orders: 138 },
    { month: "Apr", revenue: 67000, orders: 185 },
    { month: "May", revenue: 59000, orders: 164 },
    { month: "Jun", revenue: 78000, orders: 210 },
    { month: "Jul", revenue: 72000, orders: 198 },
    { month: "Aug", revenue: 89000, orders: 245 },
    { month: "Sep", revenue: 95000, orders: 270 },
    { month: "Oct", revenue: 87000, orders: 251 },
    { month: "Nov", revenue: 110000, orders: 310 },
    { month: "Dec", revenue: 125000, orders: 350 },
];

export const products = [
    { name: "Laptop", category: "Electronics", sales: 245, revenue: 245000 },
    { name: "Phone", category: "Electronics", sales: 420, revenue: 210000 },
    { name: "Headphones", category: "Accessories", sales: 580, revenue: 87000 },
    { name: "Keyboard", category: "Accessories", sales: 310, revenue: 46500 },
    { name: "Monitor", category: "Electronics", sales: 175, revenue: 70000 },
];

export const currency = (value) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(value);
