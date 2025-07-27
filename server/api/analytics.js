import { supabase } from '../../supabase/client.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      // Get analytics data
      const analytics = {};

      // Total revenue from sales
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total_price');
      
      if (salesError) throw salesError;
      
      analytics.totalRevenue = salesData.reduce((sum, sale) => sum + parseFloat(sale.total_price), 0);

      // Total sales count
      analytics.totalSales = salesData.length;

      // Total customers count
      const { data: customersData, error: customersError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'customer');
      
      if (customersError) throw customersError;
      
      analytics.totalCustomers = customersData.length;

      // Low stock items count
      const { data: sweetsData, error: sweetsError } = await supabase
        .from('sweets')
        .select('id, quantity')
        .lt('quantity', 10);
      
      if (sweetsError) throw sweetsError;
      
      analytics.lowStockItems = sweetsData.length;

      // Daily sales for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: dailySalesData, error: dailySalesError } = await supabase
        .from('sales')
        .select('sale_date, quantity, total_price')
        .gte('sale_date', sevenDaysAgo.toISOString().split('T')[0]);
      
      if (dailySalesError) throw dailySalesError;

      // Group sales by date
      const salesByDate = {};
      dailySalesData.forEach(sale => {
        const date = sale.sale_date;
        if (!salesByDate[date]) {
          salesByDate[date] = { sales: 0, revenue: 0 };
        }
        salesByDate[date].sales += sale.quantity;
        salesByDate[date].revenue += parseFloat(sale.total_price);
      });

      analytics.dailySales = Object.entries(salesByDate).map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: data.sales,
        revenue: data.revenue
      }));

      // Top selling sweets
      const { data: topSellersData, error: topSellersError } = await supabase
        .from('sales')
        .select(`
          sweet_id,
          quantity,
          total_price,
          sweets (
            name,
            category,
            price
          )
        `);
      
      if (topSellersError) throw topSellersError;

      const sweetsSales = {};
      topSellersData.forEach(sale => {
        const sweetId = sale.sweet_id;
        if (!sweetsSales[sweetId]) {
          sweetsSales[sweetId] = {
            id: sweetId,
            name: sale.sweets.name,
            category: sale.sweets.category,
            price: sale.sweets.price,
            totalSold: 0,
            totalRevenue: 0
          };
        }
        sweetsSales[sweetId].totalSold += sale.quantity;
        sweetsSales[sweetId].totalRevenue += parseFloat(sale.total_price);
      });

      analytics.topSellers = Object.values(sweetsSales)
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 10);

      res.status(200).json(analytics);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
