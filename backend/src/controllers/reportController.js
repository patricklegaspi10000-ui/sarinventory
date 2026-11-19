const mongoose = require("mongoose");
const Product = require("../models/Product");
const Sale = require("../models/Sale");
const Store = require("../models/Store");

// change this if the store is not in the Philippines
const TIMEZONE = "Asia/Manila";

exports.summary = async (req, res) => {
  try {
    const period = req.query.period === "weekly" ? "weekly" : "daily";
    const storeId = new mongoose.Types.ObjectId(req.user.storeId);

    const from = new Date();
    from.setHours(0, 0, 0, 0);
    if (period === "weekly") from.setDate(from.getDate() - 6);

    const store = await Store.findById(storeId);

    const [salesAgg, products] = await Promise.all([
      Sale.aggregate([
        { $match: { storeId, createdAt: { $gte: from } } },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  revenue: { $sum: "$total" },
                  units: { $sum: "$quantity" },
                },
              },
            ],
            best: [
              {
                $group: {
                  _id: "$productId",
                  name: { $first: "$productName" },
                  units: { $sum: "$quantity" },
                  revenue: { $sum: "$total" },
                },
              },
              { $sort: { units: -1, revenue: -1 } },
              { $limit: 5 },
            ],
            byDay: [
              {
                $group: {
                  _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TIMEZONE },
                  },
                  count: { $sum: 1 },
                  revenue: { $sum: "$total" },
                },
              },
              { $sort: { _id: 1 } },
            ],
          },
        },
      ]),
      Product.find({ storeId }).select("name quantity price lowStockLevel expiryDate").lean(),
    ]);

    const facet = salesAgg[0];
    const totals = facet.totals[0] || { count: 0, revenue: 0, units: 0 };

    const expiryLimit = new Date(Date.now() + store.expiryAlertDays * 24 * 60 * 60 * 1000);

    const lowStock = products
      .filter((p) => p.quantity <= (p.lowStockLevel ?? store.lowStockLevel))
      .sort((a, b) => a.quantity - b.quantity)
      .map((p) => ({ id: p._id, name: p.name, quantity: p.quantity }));

    const expiring = products
      .filter((p) => p.expiryDate && p.expiryDate <= expiryLimit)
      .sort((a, b) => a.expiryDate - b.expiryDate)
      .map((p) => ({ id: p._id, name: p.name, expiryDate: p.expiryDate }));

    res.json({
      period,
      from,
      sales: { count: totals.count, revenue: totals.revenue, units: totals.units },
      bestSellers: facet.best.map((b) => ({
        id: b._id,
        name: b.name,
        units: b.units,
        revenue: b.revenue,
      })),
      byDay: facet.byDay.map((d) => ({ date: d._id, count: d.count, revenue: d.revenue })),
      inventory: {
        productCount: products.length,
        totalUnits: products.reduce((sum, p) => sum + p.quantity, 0),
        stockValue: products.reduce((sum, p) => sum + p.quantity * p.price, 0),
        lowStock,
        expiring,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};