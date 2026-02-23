import { useState, useEffect } from "react";
import Button from "../../components/ui/Button";
import { toast } from "react-toastify";
import api from "../../api/axios";

export default function SupplierOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("DATE_DESC");
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    api
      .get("/supplier/orders")
      .then((res) => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load orders");
        setLoading(false);
      });
  };

  const updateOrderStatus = async (orderId, status, order) => {
    const displayOrderNumber = order?.displayOrderNumber ?? order?.orderNumber ?? orderId;

    // Confirmation dialogs
    if (status === "CONFIRMED") {
      const confirmMessage = `Confirm this order?\n\n` +
        `Order #${displayOrderNumber}\n` +
        `Customer: ${order.shippingAddress?.fullName}\n` +
        `Items: ${order.items?.length} item(s)\n` +
        `Total Amount: INR ${order.totalAmount}\n` +
        `Payment: ${order.paymentStatus === "PAID" ? "✓ PAID" : order.paymentMethod?.toUpperCase()}\n\n` +
        `This will notify the customer that you're preparing their order.`;
      
      if (!confirm(confirmMessage)) {
        return;
      }
    } else if (status === "CANCELLED") {
      const cancelMessage = `Cancel this order?\n\n` +
        `Order #${displayOrderNumber}\n` +
        `Customer: ${order.shippingAddress?.fullName}\n` +
        `Total Amount: INR ${order.totalAmount}\n\n` +
        `This action cannot be undone. The customer will be notified.`;
      
      if (!confirm(cancelMessage)) {
        return;
      }
    } else if (status === "DELIVERED") {
      const deliverMessage = `Mark order as delivered?\n\n` +
        `Order #${displayOrderNumber}\n` +
        `Customer: ${order.shippingAddress?.fullName}\n` +
        `Total Amount: INR ${order.totalAmount}\n\n` +
        `Confirm that this order has been delivered to the customer.`;
      
      if (!confirm(deliverMessage)) {
        return;
      }
    }

    try {
      await api.put(`/supplier/orders/${orderId}/status`, { status });
      toast.success(`Order ${status.toLowerCase()} successfully!`);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const removeOrder = async (orderId, order) => {
    const displayOrderNumber = order?.displayOrderNumber ?? order?.orderNumber ?? orderId;
    const removeMessage = `Remove this order from history?\n\n` +
      `Order #${displayOrderNumber}\n` +
      `Customer: ${order.shippingAddress?.fullName}\n` +
      `Status: ${order.status}\n` +
      `Total Amount: INR ${order.totalAmount}\n\n` +
      `This will permanently delete the order record. This action cannot be undone.`;
    
    if (!confirm(removeMessage)) {
      return;
    }

    try {
      await api.delete(`/supplier/orders/${orderId}`);
      toast.success("Order removed from history");
      fetchOrders();
    } catch (error) {
      console.error("Delete order error:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please log in again.");
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to remove order");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "#f59e0b";
      case "CONFIRMED":
        return "#3b82f6";
      case "DELIVERED":
        return "#15803d";
      case "CANCELLED":
        return "#b42318";
      default:
        return "#6b7280";
    }
  };

  // Filter and sort orders
  const getFilteredAndSortedOrders = () => {
    let filtered = [...orders];

    // Apply active only filter
    if (showActiveOnly) {
      filtered = filtered.filter(o => o.status === "PENDING" || o.status === "CONFIRMED");
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    // Apply payment filter
    if (paymentFilter === "PAID") {
      filtered = filtered.filter(o => o.paymentStatus === "PAID");
    } else if (paymentFilter === "PENDING") {
      filtered = filtered.filter(o => o.paymentStatus !== "PAID");
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "DATE_DESC":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "DATE_ASC":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "AMOUNT_DESC":
          return b.totalAmount - a.totalAmount;
        case "AMOUNT_ASC":
          return a.totalAmount - b.totalAmount;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredOrders = getFilteredAndSortedOrders();

  const clearFilters = () => {
    setStatusFilter("ALL");
    setPaymentFilter("ALL");
    setSortBy("DATE_DESC");
    setShowActiveOnly(false);
  };

  const clearAllCompleted = async () => {
    const completedOrders = orders.filter(o => o.status === "DELIVERED" || o.status === "CANCELLED");
    
    if (completedOrders.length === 0) {
      toast.info("No completed orders to clear");
      return;
    }

    const confirmMessage = `Clear all completed orders?\n\n` +
      `This will permanently delete ${completedOrders.length} order(s) with status DELIVERED or CANCELLED.\n\n` +
      `This action cannot be undone. Continue?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // Delete all completed orders one by one to handle individual errors
      let successCount = 0;
      let failCount = 0;
      
      for (const order of completedOrders) {
        try {
          await api.delete(`/supplier/orders/${order.id}`);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete order ${order.id}:`, error);
          console.error(`Error response:`, error.response?.data);
          failCount++;
          if (error.response?.status === 401) {
            toast.error("Authentication failed. Please log in again.");
            return; // Stop trying if auth fails
          }
          // Log specific error message from backend
          if (error.response?.data?.error) {
            console.error(`Backend error for order ${order.id}: ${error.response.data.error}`);
          }
        }
      }
      
      if (successCount > 0) {
        toast.success(`Removed ${successCount} order(s) from history`);
        fetchOrders();
      }
      if (failCount > 0) {
        toast.warning(`Failed to remove ${failCount} order(s)`);
      }
    } catch (error) {
      console.error("Clear completed orders error:", error);
      toast.error("Failed to clear completed orders");
    }
  };

  if (loading) {
    return <p>Loading orders...</p>;
  }

  return (
    <div>
      <h2 className="dash-title">Incoming Orders</h2>
      <p className="dash-subtitle">Manage customer orders and bookings</p>

      {/* Filter and Sort Controls */}
      <div style={{ 
        background: "var(--card)", 
        border: "1px solid var(--border)", 
        borderRadius: "8px", 
        padding: "20px", 
        marginTop: "24px",
        marginBottom: "16px"
      }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Status Filter */}
          <div style={{ flex: "1", minWidth: "200px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
              Order Status
            </label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--background)",
                fontSize: "14px"
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">⏳ Pending</option>
              <option value="CONFIRMED">✓ Confirmed</option>
              <option value="DELIVERED">📦 Delivered</option>
              <option value="CANCELLED">✗ Cancelled</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div style={{ flex: "1", minWidth: "200px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
              Payment Status
            </label>
            <select 
              value={paymentFilter} 
              onChange={(e) => setPaymentFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--background)",
                fontSize: "14px"
              }}
            >
              <option value="ALL">All Payments</option>
              <option value="PAID">💳 Paid</option>
              <option value="PENDING">💰 Payment Pending</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ flex: "1", minWidth: "200px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
              Sort By
            </label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--background)",
                fontSize: "14px"
              }}
            >
              <option value="DATE_DESC">Newest First</option>
              <option value="DATE_ASC">Oldest First</option>
              <option value="AMOUNT_DESC">Highest Amount</option>
              <option value="AMOUNT_ASC">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
          <Button
            className="btn square"
            onClick={() => setShowActiveOnly(!showActiveOnly)}
            style={{
              background: showActiveOnly ? "#3b82f6" : "var(--card)",
              color: showActiveOnly ? "white" : "var(--text)",
              border: "1px solid var(--border)"
            }}
          >
            {showActiveOnly ? "✓ Active Orders Only" : "Show Active Only"}
          </Button>
          
          <Button
            className="btn square"
            onClick={clearFilters}
            style={{
              background: "var(--card)",
              color: "var(--text)",
              border: "1px solid var(--border)"
            }}
          >
            🔄 Clear Filters
          </Button>

          <Button
            className="btn square"
            onClick={clearAllCompleted}
            style={{
              background: "#fee",
              color: "#b42318",
              border: "1px solid #fecaca"
            }}
          >
            🗑️ Clear All Completed
          </Button>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", fontSize: "14px", color: "var(--muted)" }}>
            Showing <strong style={{ margin: "0 4px", color: "var(--text)" }}>{filteredOrders.length}</strong> of <strong style={{ margin: "0 4px", color: "var(--text)" }}>{orders.length}</strong> orders
          </div>
        </div>
      </div>

      <div style={{ marginTop: "24px" }}>
        {filteredOrders.length === 0 && (
          <div className="product-card" style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ fontSize: "18px", color: "var(--muted)" }}>
              {orders.length === 0 ? "No orders yet." : "No orders match your filters."}
            </p>
            {orders.length > 0 && (
              <Button
                className="btn primary square"
                onClick={clearFilters}
                style={{ marginTop: "16px" }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {filteredOrders.map((order) => (
          <div key={order.id} className="product-card" style={{ marginBottom: "16px" }}>
            <div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                <h4>Order #{order.displayOrderNumber ?? order.orderNumber ?? order.id}</h4>
                <span
                  className="cart-item-type"
                  style={{
                    background: `${getStatusColor(order.status)}20`,
                    color: getStatusColor(order.status),
                  }}
                >
                  {order.status}
                </span>
                <span
                  className="cart-item-type"
                  style={{
                    background: order.paymentStatus === "PAID" ? "#15803d20" : "#f59e0b20",
                    color: order.paymentStatus === "PAID" ? "#15803d" : "#f59e0b",
                  }}
                >
                  {order.paymentStatus === "PAID" ? "💳 PAID" : "💰 " + order.paymentMethod?.toUpperCase()}
                </span>
              </div>

              <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "8px" }}>
                Order Date: {new Date(order.createdAt).toLocaleDateString("en-IN")}
              </p>

              <div style={{ marginTop: "16px" }}>
                <p style={{ fontWeight: "600", marginBottom: "8px" }}>Customer Details:</p>
                <p style={{ fontSize: "14px" }}>
                  {order.shippingAddress?.fullName}<br />
                  {order.shippingAddress?.phone}<br />
                  {order.shippingAddress?.address}
                </p>
              </div>

              <div style={{ marginTop: "16px" }}>
                <p style={{ fontWeight: "600", marginBottom: "8px" }}>Items:</p>
                {order.items?.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <span>{item.name} x {item.quantity || 1}</span>
                    <span style={{ fontWeight: "600" }}>INR {item.price}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
                <p style={{ fontSize: "24px", fontWeight: "700", color: "#15803d" }}>
                  Total: INR {order.totalAmount}
                </p>

                <div style={{ display: "flex", gap: "8px" }}>
                  {order.status === "PENDING" && (
                    <>
                      <Button
                        className="btn primary square"
                        onClick={() => updateOrderStatus(order.id, "CONFIRMED", order)}
                      >
                        Confirm
                      </Button>
                      <Button
                        className="btn secondary square"
                        onClick={() => updateOrderStatus(order.id, "CANCELLED", order)}
                        style={{ background: "#fee", color: "#b42318" }}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {order.status === "CONFIRMED" && (
                    <Button
                      className="btn primary square"
                      onClick={() => updateOrderStatus(order.id, "DELIVERED", order)}
                    >
                      Mark Delivered
                    </Button>
                  )}
                  {(order.status === "DELIVERED" || order.status === "CANCELLED") && (
                    <Button
                      className="btn square"
                      onClick={() => removeOrder(order.id, order)}
                      style={{ 
                        background: "#fee", 
                        color: "#b42318",
                        border: "1px solid #fecaca"
                      }}
                    >
                      🗑️ Remove from History
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
