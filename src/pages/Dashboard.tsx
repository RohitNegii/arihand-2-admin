import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Loader2
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { getRequest } from "../services/api";
import Table from "../components/ui/Table";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("aurum_admin_token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await getRequest("/orders/admin/stats");

        if (res.success) {
          setStats(res.stats);
          setRecentOrders(res.recentOrders);
          setLowStock(res.lowStockProducts);
          setTopProducts(res.topProducts);
          setChartData(res.salesChartData);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] flex-col gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
        <span className="text-[10px] uppercase tracking-widest text-white/40">Recalculating Metrics...</span>
      </div>
    );
  }

  const recentOrdersColumns = [
    {
      header: "Order",
      className: "font-mono font-bold text-white",
      render: (order: any) => <span>#{order.orderNumber.split("-")[1] || order.orderNumber}</span>
    },
    {
      header: "Customer",
      render: (order: any) => <span>{order.customer?.name || "Anonymous"}</span>
    },
    {
      header: "Total",
      className: "font-mono text-white",
      render: (order: any) => <span>INR {order.grandTotal.toLocaleString()}</span>
    },
    {
      header: "Status",
      render: (order: any) => (
        <span className={`text-[8.5px] font-bold uppercase tracking-wider ${
          order.orderStatus === "Delivered" ? "text-emerald-500" : "text-luxury-gold"
        }`}>
          {order.orderStatus}
        </span>
      )
    }
  ];

  const lowStockColumns = [
    {
      header: "SKU",
      className: "font-mono font-bold text-red-500",
      render: (prod: any) => <span>{prod.sku}</span>
    },
    {
      header: "Product Name",
      className: "truncate max-w-xs",
      render: (prod: any) => <span>{prod.name}</span>
    },
    {
      header: "Stock",
      className: "font-bold text-red-500",
      render: (prod: any) => (
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> {prod.stock} units
        </span>
      )
    },
    {
      header: "Status",
      render: (prod: any) => (
        <span className={`text-[8.5px] font-bold uppercase tracking-wider ${
          prod.status === "Published" ? "text-emerald-500" : "opacity-40"
        }`}>
          {prod.status}
        </span>
      )
    }
  ];

  const kpis = [
    { name: "Total Revenue", val: `INR ${(stats?.revenue || 0).toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400" },
    { name: "Orders Mapped", val: stats?.totalOrders || 0, icon: ShoppingBag, color: "text-[#ff5a1f]" },
    { name: "Registries", val: stats?.totalCustomers || 0, icon: Users, color: "text-purple-400" },
    { name: "Active Catalog", val: stats?.totalProducts || 0, icon: Package, color: "text-blue-400" }
  ];

  return (
    <div className="space-y-8 text-left">
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.name} className="glass-card rounded-2xl p-6 flex items-center justify-between">
            <div>
              <span className="text-[8.5px] uppercase tracking-widest text-white/40 font-semibold">{kpi.name}</span>
              <p className="text-xl font-serif font-bold text-[#0F4C3A] mt-1.5 leading-none">{kpi.val}</p>
            </div>
            <div className={`w-10 h-10 rounded-full bg-white/3 flex items-center justify-center border border-white/5 ${kpi.color}`}>
              <kpi.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Analytics chart and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales recharts timeline (Span 2) */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-[8px] uppercase tracking-widest text-luxury-gold font-bold font-mono">financial timeline</span>
              <h2 className="font-serif text-lg text-white mt-1">Monthly Sales Curve</h2>
            </div>
          </div>

          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[10px] tracking-widest text-white/35 uppercase font-mono">
                No Sales Mapped to Timeline
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff5a1f" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ff5a1f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={9} className="font-mono" />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} className="font-mono" />
                  <Tooltip
                    contentStyle={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "10px", fontFamily: "monospace" }}
                    labelClassName="text-[#ff5a1f] font-bold"
                  />
                  <Area type="monotone" dataKey="sales" stroke="#ff5a1f" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" name="Sales (INR)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top selling list */}
        <div className="glass-card rounded-2xl p-6">
          <span className="text-[8px] uppercase tracking-widest text-luxury-gold font-bold font-mono block">bestsellers ranking</span>
          <h2 className="font-serif text-lg text-white mt-1 mb-6">Top Selling Masterpieces</h2>

          {topProducts.length === 0 ? (
            <div className="py-12 text-center text-[10px] tracking-widest text-white/30 uppercase font-mono">
              No product items ordered
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {topProducts.map((prod, idx) => (
                <div key={prod._id} className="flex justify-between items-center bg-white/2 p-3 rounded-xl border border-white/5 font-mono text-[10px]">
                  <div className="flex items-center gap-3">
                    <span className="text-[#ff5a1f] font-bold">#{idx + 1}</span>
                    <span className="text-[#0F4C3A] font-medium line-clamp-1">{prod.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[#0F4C3A]">{prod.quantitySold} sold</span><br />
                    <span className="text-white/30 text-[8.5px]">INR {prod.revenueGenerated.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Recent Orders and Inventory warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Orders logger */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <div>
              <span className="text-[8px] uppercase tracking-widest text-luxury-gold font-bold font-mono">recent registries</span>
              <h2 className="font-serif text-lg text-white mt-1">Pending & New Orders</h2>
            </div>
            <Link to="/orders" className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-luxury-gold hover:underline font-bold">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Table
            columns={recentOrdersColumns}
            data={recentOrders}
            loading={loading}
            emptyMessage="No orders registered"
          />
        </div>

        {/* Low Stock Alerts */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <div>
                <span className="text-[8px] uppercase tracking-widest text-red-500 font-bold font-mono">critical warnings</span>
                <h2 className="font-serif text-lg text-white mt-1">Low Stock Alerts</h2>
              </div>
            </div>
          </div>

          <Table
            columns={lowStockColumns}
            data={lowStock}
            loading={loading}
            emptyMessage="All stock limits verified"
          />
        </div>

      </div>

    </div>
  );
}
