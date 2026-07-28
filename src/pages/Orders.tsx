import React, { useState, useEffect } from "react";
import { Search, Eye, Loader2, AlertTriangle, Truck, X, Download } from "lucide-react";
import { getRequest, putRequest } from "../services/api";
import Table from "../components/ui/Table";

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Details Modal State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);



  // Shipping Update State
  // Unused state variables commented out to pass tsc strict unused locals checks
  // const [trackingNumber, setTrackingNumber] = useState("");
  // const [courierName, setCourierName] = useState("");
  // const [expectedDelivery, setExpectedDelivery] = useState("");
  // const [shipmentStatus, setShipmentStatus] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await getRequest("/orders/admin/list", { params });

      if (res.success) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOrder = async (order: any) => {
    setSelectedOrder(order);
    
    // setTrackingNumber(order.trackingNumber || "");
    // setCourierName(order.courierName || "");
    // setExpectedDelivery(
    //   order.expectedDelivery
    //     ? new Date(order.expectedDelivery).toISOString().split("T")[0]
    //     : ""
    // );
    // setShipmentStatus(order.shipmentStatus || "");
    setTrackingUrl(order.trackingUrl || "");

    setShowModal(true);
  };



  const handleUpdateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    if (trackingUrl && trackingUrl.trim() !== "") {
      try {
        new URL(trackingUrl);
      } catch (_) {
        alert("Please enter a valid tracking URL (e.g. https://www.delhivery.com/track/package/123456789)");
        return;
      }
    }

    setModalLoading(true);
    try {
      const res = await putRequest(
        `/orders/admin/${selectedOrder._id}/shipping`,
        { trackingUrl: trackingUrl.trim() }
      );

      if (res.success) {
        setSelectedOrder(res.order);
        fetchOrders();
        alert("Tracking URL updated successfully.");
      }
    } catch (err) {
      console.error("Failed to update shipping", err);
      alert("Failed to update tracking URL.");
    } finally {
      setModalLoading(false);
    }
  };

  // Export Orders as CSV
  const handleExportCSV = () => {
    const headers = ["Order ID", "Customer Name", "Customer Email", "Subtotal", "GST Tax", "Shipping", "Grand Total", "Status", "Payment", "Courier", "Tracking ID", "Date Placed"];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.customer?.name || "N/A",
      o.customer?.email || "N/A",
      o.subtotal,
      o.taxAmount,
      o.shippingAmount,
      o.grandTotal,
      o.orderStatus,
      o.paymentStatus,
      o.courierName || "N/A",
      o.trackingNumber || "N/A",
      new Date(o.createdAt).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aurum_orders_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = orders.filter((order) => {
    const searchRegex = new RegExp(search, "i");
    return (
      order.orderNumber.match(searchRegex) ||
      (order.customer?.name || "").match(searchRegex) ||
      (order.customer?.email || "").match(searchRegex)
    );
  });

  const columns = [
    {
      header: "Order ID",
      className: "font-mono font-bold text-white",
      render: (order: any) => <span>#{order.orderNumber}</span>
    },
    {
      header: "Customer",
      render: (order: any) => (
        <div className="text-left font-sans">
          <span className="text-[#0F4C3A] font-medium text-xs">{order.customer?.name || "N/A"}</span><br />
          <span className="text-white/40 text-[9px] font-mono leading-none">{order.customer?.email || "N/A"}</span>
        </div>
      )
    },
    {
      header: "Value",
      className: "font-mono text-white",
      render: (order: any) => <span>INR {order.grandTotal.toLocaleString()}</span>
    },
    {
      header: "Payment",
      render: (order: any) => (
        <span className={`text-[8.5px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${
          order.paymentStatus === "Paid"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : order.paymentStatus === "Failed"
            ? "bg-red-500/10 border-red-500/20 text-red-400"
            : "bg-white/5 border-white/10 text-white/40"
        }`}>
          {order.paymentStatus}
        </span>
      )
    },
    {
      header: "Order Status",
      render: (order: any) => (
        <span className={`text-[8.5px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${
          order.orderStatus === "Delivered"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : order.orderStatus === "Cancelled"
            ? "bg-red-500/10 border-red-500/20 text-red-400"
            : "bg-luxury-gold/10 border-luxury-gold/20 text-luxury-gold"
        }`}>
          {order.orderStatus}
        </span>
      )
    },
    {
      header: "Tracking",
      render: (order: any) => order.trackingUrl ? (
        <a
          href={order.trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-luxury-gold hover:underline text-[9.5px] uppercase tracking-wider font-bold block"
          onClick={(e) => e.stopPropagation()}
        >
          Track URL ↗
        </a>
      ) : order.trackingNumber ? (
        <div>
          <span className="text-[#0F4C3A] font-semibold text-[10px]">{order.courierName}</span><br />
          <span className="text-white/35 text-[8.5px]">{order.trackingNumber}</span>
        </div>
      ) : (
        <span className="text-white/30 italic">No shipment loaded</span>
      )
    },
    {
      header: "Action",
      className: "text-right",
      render: (order: any) => (
        <button
          onClick={() => handleOpenOrder(order)}
          className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
          title="View Details"
        >
          <Eye className="w-4.5 h-4.5" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[8px] tracking-widest uppercase text-luxury-gold font-bold font-mono">transactions log</span>
          <h1 className="font-serif text-2xl text-white mt-1">Orders Management</h1>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 border border-white/10 hover:border-luxury-gold text-white hover:text-black hover:bg-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export CSV List
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/2 p-4 rounded-xl border border-white/5">
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-white/30" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, customer name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/3 border border-white/8 text-xs text-white focus:border-luxury-gold focus:outline-hidden font-mono"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[#0d0d0d] border border-white/8 text-xs text-white focus:border-luxury-gold focus:outline-hidden font-mono"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Packed">Packed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders table */}
      <Table
        columns={columns}
        data={filteredOrders}
        loading={loading}
        emptyMessage="No orders registered matching filters."
      />

      {/* Order Details Accordion Drawer Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 overflow-y-auto">
          <div className="glass-card rounded-3xl p-6 md:p-8 max-w-4xl w-full border border-white/10 relative text-left my-8">
            
            {/* Close */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 mb-6 gap-2 font-mono">
              <div>
                <span className="text-[#ff5a1f] font-bold">#{selectedOrder.orderNumber}</span>
                <span className="text-[10px] text-white/40 block">ORDER PLACED: {new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="text-right sm:text-left">
                <span className="text-[#0F4C3A] font-semibold block">TOTAL VALUE: INR {selectedOrder.grandTotal.toLocaleString()}</span>
                <span className="text-emerald-400 text-[10px] uppercase block font-bold">PAYMENT: {selectedOrder.paymentStatus}</span>
              </div>
            </div>

            {/* Split layout inside detail drawer */}
            <div className="space-y-6">
              
              {/* Items */}
              <div>
                <span className="text-[8.5px] tracking-wider uppercase text-luxury-gold font-bold font-mono block mb-3 border-b border-white/5 pb-1">Items Purchased</span>
                <div className="flex flex-col gap-3 font-mono text-[10px]">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span>
                        {item.name}{" "}
                        {item.size && (
                          <span className="text-luxury-gold font-bold ml-1">
                            (Size: {item.size})
                          </span>
                        )}
                        {item.variant && (
                          <span className="text-luxury-gold font-bold ml-1">
                            (Option: {item.variant})
                          </span>
                        )}
                        {" "}
                        <span className="text-white/45 font-mono text-[9px]">x{item.quantity}</span>
                      </span>
                      <span>INR {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[9px] uppercase tracking-wider text-white/50">
                <div>
                  <span className="text-luxury-gold font-bold block mb-1">Shipping Mapped</span>
                  <span className="text-[#0F4C3A] font-semibold font-sans">{selectedOrder.shippingAddress.name}</span><br />
                  <span>{selectedOrder.shippingAddress.addressLine1}</span><br />
                  <span>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</span><br />
                  <span>Phone: {selectedOrder.shippingAddress.phone}</span>
                </div>
                <div>
                  <span className="text-luxury-gold font-bold block mb-1">Billing Mapped</span>
                  <span className="text-[#0F4C3A] font-semibold font-sans">{selectedOrder.billingAddress.name}</span><br />
                  <span>{selectedOrder.billingAddress.addressLine1}</span><br />
                  <span>{selectedOrder.billingAddress.city}, {selectedOrder.billingAddress.state}</span>
                </div>
              </div>

              {/* Shipping Details form */}
              <div className="border border-white/5 p-4 rounded-xl bg-white/2">
                <h3 className="font-serif text-sm text-white mb-4 flex items-center gap-2">
                  <Truck className="w-4.5 h-4.5 text-luxury-gold" /> Update Tracking URL
                </h3>
                <form onSubmit={handleUpdateShipping} className="space-y-4">
                  <div>
                    <label className="block text-[8px] tracking-wider uppercase text-white/50 mb-1.5 font-semibold">Tracking URL</label>
                    <input
                      type="text"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/3 border border-white/8 text-[10px] text-white focus:border-luxury-gold focus:outline-hidden"
                      placeholder="https://www.delhivery.com/track/package/123456789"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="w-full border border-white/10 hover:border-luxury-gold text-white hover:text-black hover:bg-white text-[9.5px] uppercase tracking-wider font-bold py-2 rounded-full transition-all duration-300 cursor-pointer"
                  >
                    {modalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Save Tracking URL"}
                  </button>
                </form>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
