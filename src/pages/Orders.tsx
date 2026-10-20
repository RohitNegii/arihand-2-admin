import React, { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Loader2,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { getRequest, putRequest, getImageUrl } from "../services/api";
import Table from "../components/ui/Table";
import { toast } from "sonner";

export const ORDER_STATUSES = [
  "Pending Confirmation",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Completed",
  "Cancelled"
];

export const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case "Pending Confirmation":
      return "bg-amber-500/10 border-amber-500/30 text-amber-700 font-semibold";
    case "Confirmed":
      return "bg-sky-500/10 border-sky-500/30 text-sky-700 font-semibold";
    case "Processing":
      return "bg-indigo-500/10 border-indigo-500/30 text-indigo-700 font-semibold";
    case "Shipped":
      return "bg-purple-500/10 border-purple-500/30 text-purple-700 font-semibold";
    case "Delivered":
      return "bg-teal-500/10 border-teal-500/30 text-teal-700 font-semibold";
    case "Completed":
      return "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 font-semibold";
    case "Cancelled":
      return "bg-rose-500/10 border-rose-500/30 text-rose-700 font-semibold";
    default:
      return "bg-[#351E28]/5 border-[#351E28]/15 text-[#351E28]/60";
  }
};

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Details Modal State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // Status Change State inside Modal
  const [newStatus, setNewStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set("search", search.trim());
      if (statusFilter !== "ALL") queryParams.set("status", statusFilter);
      queryParams.set("page", String(page));
      queryParams.set("limit", "15");

      const res = await getRequest(`/orders/admin/list?${queryParams.toString()}`);

      if (res.success) {
        setOrders(res.orders || []);
        setTotalOrders(res.total || res.count || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load orders", err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleOpenOrder = async (order: any) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus || "Pending Confirmation");
    setStatusComment("");
    setShowModal(true);
  };

  const handleQuickStatusChange = async (orderId: string, status: string) => {
    try {
      const res = await putRequest(`/orders/admin/${orderId}/status`, {
        status,
        comment: `Status updated to ${status} from table dropdown`
      });

      if (res.success) {
        toast.success(`Order status updated to ${status}`);
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(res.order);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update order status");
    }
  };

  const handleModalStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setStatusUpdating(true);
    try {
      const res = await putRequest(`/orders/admin/${selectedOrder._id}/status`, {
        status: newStatus,
        comment: statusComment
      });

      if (res.success) {
        setSelectedOrder(res.order);
        toast.success(`Order status successfully updated to '${newStatus}'`);
        setStatusComment("");
        fetchOrders();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update order status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const columns = [
    {
      header: "Order ID",
      className: "font-mono font-bold text-[#351E28]",
      render: (order: any) => (
        <div>
          <span className="text-[#351E28] font-bold">#{order.orderNumber}</span>
          <span className="text-[#351E28]/45 text-[9px] block font-sans">
            {new Date(order.createdAt).toLocaleDateString()}
          </span>
        </div>
      )
    },
    {
      header: "Customer",
      render: (order: any) => (
        <div className="text-left font-sans">
          <span className="text-[#351E28] font-semibold text-xs">
            {order.shippingAddress?.name || order.customer?.name || "N/A"}
          </span>
          <br />
          <span className="text-[#351E28]/50 text-[10px] font-mono block">
            {order.shippingAddress?.phone || order.customer?.phone || ""}
          </span>
          <span className="text-[#351E28]/40 text-[9px] font-mono leading-none block truncate max-w-[140px]">
            {order.email || order.customer?.email || ""}
          </span>
        </div>
      )
    },
    {
      header: "Products",
      render: (order: any) => {
        const totalItems = order.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 0;
        const firstItem = order.items?.[0]?.name || "Item";
        return (
          <div className="text-left font-sans max-w-[160px]">
            <span className="text-xs font-medium text-[#351E28] truncate block">
              {firstItem}
              {order.items?.length > 1 ? ` +${order.items.length - 1} more` : ""}
            </span>
            <span className="text-[9px] text-luxury-gold font-mono font-bold uppercase tracking-wider block">
              Qty: {totalItems} {totalItems === 1 ? "unit" : "units"}
            </span>
          </div>
        );
      }
    },
    {
      header: "Order Total",
      className: "font-mono text-[#351E28]",
      render: (order: any) => (
        <div>
          <span className="font-semibold text-xs">₹{order.grandTotal.toLocaleString("en-IN")}</span>
        </div>
      )
    },
    {
      header: "Order Status",
      render: (order: any) => {
        const status = order.orderStatus || "Pending Confirmation";
        return (
          <span
            className={`text-[8.5px] uppercase tracking-wider px-2.5 py-1 rounded-full border inline-block whitespace-nowrap ${getStatusBadgeStyle(
              status
            )}`}
          >
            {status}
          </span>
        );
      }
    },
    {
      header: "Quick Status",
      render: (order: any) => (
        <select
          value={order.orderStatus || "Pending Confirmation"}
          onChange={(e) => handleQuickStatusChange(order._id, e.target.value)}
          className="text-[10px] py-1 px-2 rounded-lg bg-white/70 border border-[#351E28]/15 text-[#351E28] font-sans focus:border-luxury-gold focus:outline-hidden cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {ORDER_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      )
    },
    {
      header: "Actions",
      className: "text-right",
      render: (order: any) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleOpenOrder(order)}
            className="p-2 rounded-lg hover:bg-[#351E28]/5 text-[#351E28]/70 hover:text-luxury-gold transition-colors cursor-pointer"
            title="View Order Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full space-y-6 text-left min-h-0 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[8px] tracking-widest uppercase text-luxury-gold font-bold font-mono">
            WhatsApp Order Lifecycle
          </span>
          <h1 className="font-serif text-2xl text-[#351E28] mt-1 font-light">
            Orders Registry
          </h1>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-[#351E28]/60">
            Total Orders: <span className="font-bold text-[#351E28]">{totalOrders}</span>
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="shrink-0 glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between border border-luxury-border bg-white/60">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-1/2 relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#351E28]/40 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, customer name, phone, email..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F7F2EE]/80 border border-[#351E28]/15 text-xs text-[#351E28] focus:border-luxury-gold focus:outline-hidden font-sans"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#351E28] text-white hover:text-luxury-gold text-xs font-sans font-bold cursor-pointer transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {/* Status Filter */}
        <div className="w-full md:w-auto flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[#351E28]/60 font-sans">
            <Filter className="w-3.5 h-3.5 text-luxury-gold" />
            <span>Filter Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-[#F7F2EE]/80 border border-[#351E28]/15 text-xs text-[#351E28] font-sans focus:border-luxury-gold focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            {ORDER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="flex-1 min-h-0">
        <Table
          columns={columns}
          data={orders}
          loading={loading}
          emptyMessage="No orders found matching the criteria."
        />
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="shrink-0 flex items-center justify-between py-2 text-xs font-sans text-[#351E28]/70">
          <span>
            Showing page {page} of {totalPages} ({totalOrders} total orders)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-[#351E28]/15 bg-white/60 hover:bg-[#351E28]/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs px-2 font-bold">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-[#351E28]/15 bg-white/60 hover:bg-[#351E28]/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Order Details Drawer / Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div className="glass-card bg-[#FAF7F4] rounded-3xl p-6 md:p-8 max-w-4xl w-full border border-[#351E28]/15 relative text-left my-8 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Close */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-[#351E28]/50 hover:text-[#351E28] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#351E28]/10 pb-4 mb-6 gap-2">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-[#351E28] font-bold font-mono text-base">
                    #{selectedOrder.orderNumber}
                  </span>
                  <span
                    className={`text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyle(
                      selectedOrder.orderStatus
                    )}`}
                  >
                    {selectedOrder.orderStatus}
                  </span>
                </div>
                <span className="text-[10px] text-[#351E28]/50 block font-mono mt-1">
                  Placed: {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="text-right sm:text-right">
                <span className="text-[#351E28] font-semibold block text-base font-serif">
                  Grand Total: ₹{selectedOrder.grandTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto flex-1 space-y-6 pr-1 custom-scrollbar">
              {/* Manual Status Management Section */}
              <div className="border border-luxury-gold/30 p-5 rounded-2xl bg-amber-50/40">
                <h3 className="font-serif text-sm text-[#351E28] font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4.5 h-4.5 text-luxury-gold" /> Manual Status Management
                </h3>
                <form onSubmit={handleModalStatusUpdate} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-4">
                    <label className="block text-[8.5px] uppercase tracking-widest text-[#351E28]/70 font-bold mb-1">
                      Change Lifecycle Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#351E28]/20 text-xs text-[#351E28] font-sans font-semibold focus:border-luxury-gold focus:outline-hidden cursor-pointer"
                    >
                      {ORDER_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-5">
                    <label className="block text-[8.5px] uppercase tracking-widest text-[#351E28]/70 font-bold mb-1">
                      Status Note / Comment (Optional)
                    </label>
                    <input
                      type="text"
                      value={statusComment}
                      onChange={(e) => setStatusComment(e.target.value)}
                      placeholder="e.g. Confirmed with customer via WhatsApp"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#351E28]/20 text-xs text-[#351E28] font-sans focus:border-luxury-gold focus:outline-hidden"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <button
                      type="submit"
                      disabled={statusUpdating || newStatus === selectedOrder.orderStatus && !statusComment}
                      className="w-full bg-[#351E28] hover:text-luxury-gold text-white text-[10px] uppercase tracking-widest font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {statusUpdating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Update Status"
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Items Purchased */}
              <div>
                <span className="text-[9px] tracking-wider uppercase text-luxury-gold font-bold font-mono block mb-3 border-b border-[#351E28]/10 pb-1">
                  Ordered Products ({selectedOrder.items?.length || 0})
                </span>
                <div className="flex flex-col gap-3 font-sans text-xs">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 rounded-xl bg-white/60 border border-[#351E28]/10 gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-verdant-cream/50 border border-[#351E28]/10 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div>
                          <span className="font-semibold text-[#351E28] block">{item.name}</span>
                          <div className="flex items-center gap-2 text-[10px] text-[#351E28]/60 font-mono mt-0.5">
                            <span>Qty: {item.quantity}</span>
                            {item.size && <span className="text-luxury-gold">Size: {item.size}</span>}
                            {item.variant && <span className="text-luxury-gold">Option: {item.variant}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-mono">
                        <span className="font-semibold text-xs text-[#351E28]">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[9px] text-[#351E28]/50 block">
                          (₹{item.price.toLocaleString("en-IN")} each)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer & Address Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs">
                {/* Shipping */}
                <div className="p-4 rounded-xl bg-white/60 border border-[#351E28]/10 space-y-1">
                  <span className="text-luxury-gold font-bold font-mono text-[9px] tracking-wider uppercase block mb-2">
                    Shipping & Contact Details
                  </span>
                  <p className="font-semibold text-[#351E28]">{selectedOrder.shippingAddress?.name}</p>
                  <p className="text-[#351E28]/70">{selectedOrder.shippingAddress?.addressLine1}</p>
                  {selectedOrder.shippingAddress?.addressLine2 && (
                    <p className="text-[#351E28]/70">{selectedOrder.shippingAddress?.addressLine2}</p>
                  )}
                  <p className="text-[#351E28]/70">
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} -{" "}
                    {selectedOrder.shippingAddress?.postalCode}
                  </p>
                  <p className="text-[#351E28]/70">Country: {selectedOrder.shippingAddress?.country || "India"}</p>
                  <div className="pt-2 border-t border-[#351E28]/5 mt-2 font-mono text-[10px]">
                    <p>Phone: <span className="font-bold text-[#351E28]">{selectedOrder.shippingAddress?.phone}</span></p>
                    {selectedOrder.email && <p>Email: {selectedOrder.email}</p>}
                  </div>
                </div>

                {/* Billing */}
                <div className="p-4 rounded-xl bg-white/60 border border-[#351E28]/10 space-y-1">
                  <span className="text-luxury-gold font-bold font-mono text-[9px] tracking-wider uppercase block mb-2">
                    Billing Details
                  </span>
                  <p className="font-semibold text-[#351E28]">{selectedOrder.billingAddress?.name}</p>
                  <p className="text-[#351E28]/70">{selectedOrder.billingAddress?.addressLine1}</p>
                  {selectedOrder.billingAddress?.addressLine2 && (
                    <p className="text-[#351E28]/70">{selectedOrder.billingAddress?.addressLine2}</p>
                  )}
                  <p className="text-[#351E28]/70">
                    {selectedOrder.billingAddress?.city}, {selectedOrder.billingAddress?.state} -{" "}
                    {selectedOrder.billingAddress?.postalCode}
                  </p>
                  <p className="text-[#351E28]/70">Country: {selectedOrder.billingAddress?.country || "India"}</p>
                  <div className="pt-2 border-t border-[#351E28]/5 mt-2 font-mono text-[10px]">
                    <p>Payment Mode: <span className="text-luxury-gold font-semibold">WhatsApp Direct Order</span></p>
                    <p>Payment Status: <span className="font-bold">{selectedOrder.paymentStatus}</span></p>
                  </div>
                </div>
              </div>

              {/* Status History Timeline */}
              {selectedOrder.statusTimeline && selectedOrder.statusTimeline.length > 0 && (
                <div>
                  <span className="text-[9px] tracking-wider uppercase text-luxury-gold font-bold font-mono block mb-3 border-b border-[#351E28]/10 pb-1">
                    Status History & Audit Trail
                  </span>
                  <div className="space-y-2.5 font-sans text-xs">
                    {selectedOrder.statusTimeline.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-white/40 border border-[#351E28]/5"
                      >
                        <Clock className="w-4 h-4 text-luxury-gold shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </span>
                            <span className="text-[9px] text-[#351E28]/45 font-mono">
                              {new Date(item.date).toLocaleString()}
                            </span>
                            {item.updatedBy && (
                              <span className="text-[9px] text-luxury-gold font-mono">
                                by {item.updatedBy}
                              </span>
                            )}
                          </div>
                          {item.comment && (
                            <p className="text-[11px] text-[#351E28]/80 mt-1">{item.comment}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* End of details */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
