
import {
    monthlySales,
    products,
} from "../data/sampleData.js";

const currency = (value) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(value);

export function sendChatMessage(req, res) {
    const { message } = req.body || {};

    if (
        typeof message !== "string" ||
        !message.trim() ||
        message.length > 1000
    ) {
        return res.status(400).json({
            success: false,
            message: "Enter a message between 1 and 1000 characters.",
        });
    }

    const question = message.toLowerCase();

    const totalRevenue = monthlySales.reduce(
        (sum, item) => sum + item.revenue,
        0
    );

    const totalOrders = monthlySales.reduce(
        (sum, item) => sum + item.orders,
        0
    );

    const topProduct = [...products].sort(
        (a, b) => b.revenue - a.revenue
    )[0];

    let reply;

    if (question.includes("revenue")) {
        reply = `Total sample revenue is ${currency(totalRevenue)}.`;
    } else if (
        question.includes("product") ||
        question.includes("best")
    ) {
        reply = `${topProduct.name} is the top product with ${currency(topProduct.revenue)} in revenue.`;
    } else if (question.includes("order")) {
        reply = `There are ${totalOrders.toLocaleString()} orders in the sample dataset.`;
    } else {
        reply =
            "I'm currently running in demo mode. In the next AI phase, I'll understand questions and analyze real uploaded data.";
    }

    return res.status(200).json({
        success: true,
        mode: "demo",
        reply,
    });
}
