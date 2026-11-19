
import {
    monthlySales,
    products,
} from "../data/sampleData.js";

export function getDashboard(req, res) {
    const period = Number(req.query.period || 12);

    // Only allow these three periods
    if (![3, 6, 12].includes(period)) {
        return res.status(400).json({
            success: false,
            message: "Period must be 3, 6, or 12.",
        });
    }

    const sales = monthlySales.slice(-period);

    const totalRevenue = sales.reduce(
        (sum, item) => sum + item.revenue,
        0
    );

    const totalOrders = sales.reduce(
        (sum, item) => sum + item.orders,
        0
    );

    const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return res.status(200).json({
        success: true,
        data: {
            stats: {
                totalRevenue,
                totalOrders,
                totalProducts: products.length,
                averageOrderValue,
            },
            monthlySales: sales,
            products,
        },
    });
}
