import { useState, useEffect, useCallback } from "react";
import Button from "../../components/ui/Button";
import BackButton from "../../components/BackButton";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

export default function SupplierOrders() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("DATE_DESC");
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const fetchAvailableAgents = useCallback(() => {
    api
      .get("/api/orders/delivery-agents/available")
      .then((res) => setAvailableAgents(res.data || []))
      .catch(() => setAvailableAgents([]));
  }, []);

  const fetchOrders = useCallback(() => {
    api
      .get("/supplier/orders")
      .then((res) => {
        setOrders(res.data);
        fetchAvailableAgents();
        setLoading(false);
      })
      .catch(() => {
        toast.error(t("messages.loadOrdersError"));
        setLoading(false);
      });
  }, [fetchAvailableAgents, t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId, status, order) => {
    const displayOrderNumber = order?.displayOrderNumber ?? order?.orderNumber ?? orderId;

    // Confirmation dialogs
    if (status === "CONFIRMED") {
      const confirmMessage = `Confirm this order?\n\n` +
        `Order #${displayOrderNumber}\n` +
        `Farmer: ${order.shippingAddress?.fullName}\n` +
        `Items: ${order.items?.length} item(s)\n` +
        `Total Amount: INR ${order.totalAmount}\n` +
        `Payment: ${order.paymentStatus === "PAID" ? "✓ PAID" : order.paymentMethod?.toUpperCase()}\n\n` +
        `This will notify the farmer that you're preparing their order.`;
      
      if (!confirm(confirmMessage)) {
        return;
      }
    } else if (status === "CANCELLED") {
      const cancelMessage = `Cancel this order?\n\n` +
        `Order #${displayOrderNumber}\n` +
        `Farmer: ${order.shippingAddress?.fullName}\n` +
        `Total Amount: INR ${order.totalAmount}\n\n` +
        `This action cannot be undone. The farmer will be notified.`;
      
      if (!confirm(cancelMessage)) {
        return;
      }
    } else if (status === "DELIVERED") {
      const deliverMessage = `Mark order as delivered?\n\n` +
        `Order #${displayOrderNumber}\n` +
        `Farmer: ${order.shippingAddress?.fullName}\n` +
        `Total Amount: INR ${order.totalAmount}\n\n` +
        `Confirm that this order has been delivered to the farmer.`;
      
      if (!confirm(deliverMessage)) {
        return;
      }
    }

    try {
      if (status === "CONFIRMED") {
        await api.post(`/api/orders/${orderId}/confirm`);
        toast.success(t("supplier.orders.toast.confirmedAndAssigned"));
      } else {
        await api.put(`/supplier/orders/${orderId}/status`, { status });
        toast.success(t("supplier.orders.toast.statusUpdated"));
      }
      fetchOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || t("messages.updateStatusError"));
    }
  };

  const removeOrder = async (orderId, order) => {
    const displayOrderNumber = order?.displayOrderNumber ?? order?.orderNumber ?? orderId;
    const removeMessage = `Remove this order from history?\n\n` +
      `Order #${displayOrderNumber}\n` +
      `Farmer: ${order.shippingAddress?.fullName}\n` +
      `Status: ${order.status}\n` +
      `Total Amount: INR ${order.totalAmount}\n\n` +
      `This will permanently delete the order record. This action cannot be undone.`;
    
    if (!confirm(removeMessage)) {
      return;
    }

    try {
      await api.delete(`/supplier/orders/${orderId}`);
      toast.success(t("supplier.orders.toast.removedFromHistory"));
      fetchOrders();
    } catch (error) {
      console.error("Delete order error:", error);
      if (error.response?.status === 401) {
        toast.error(t("messages.authFailed"));
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error(t("supplier.orders.toast.removeError"));
      }
    }
  };

  const assignOrderToAgent = async (orderId, order) => {
    const agentId = selectedAgents[orderId];
    if (!agentId) {
      toast.error(t("supplier.orders.selectDeliveryAgentFirst"));
      return;
    }

    const displayOrderNumber = order?.displayOrderNumber ?? order?.orderNumber ?? orderId;
    if (!confirm(`Assign selected delivery agent to Order #${displayOrderNumber}?`)) {
      return;
    }

    try {
      await api.post(`/api/orders/${orderId}/assign-agent/${agentId}`);
      toast.success(t("supplier.orders.toast.agentAssigned"));
      fetchOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || t("supplier.orders.toast.assignError"));
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
      case "ASSIGNED":
        return "#7c3aed";
      case "PICKED_UP":
        return "#0ea5e9";
      case "OUT_FOR_DELIVERY":
        return "#9333ea";
      case "FAILED_DELIVERY":
        return "#c2410c";
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
      filtered = filtered.filter((o) =>
        o.status === "PENDING" ||
        o.status === "CONFIRMED" ||
        o.status === "ASSIGNED" ||
        o.status === "PICKED_UP" ||
        o.status === "OUT_FOR_DELIVERY" ||
        o.status === "FAILED_DELIVERY"
      );
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
      toast.info(t("messages.clearCompletedNone"));
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
            toast.error(t("messages.authFailed"));
            return; // Stop trying if auth fails
          }
          // Log specific error message from backend
          if (error.response?.data?.error) {
            console.error(`Backend error for order ${order.id}: ${error.response.data.error}`);
          }
        }
      }
      
      if (successCount > 0) {
        toast.success(t("supplier.orders.toast.removedSome"));
        fetchOrders();
      }
      if (failCount > 0) {
        toast.warning(t("supplier.orders.toast.failedSome"));
      }
    } catch (error) {
      console.error("Clear completed orders error:", error);
      toast.error(t("messages.clearCompletedError"));
    }
  };

  if (loading) {
    return <p>{t("common.labels.loadingOrders")}</p>;
  }

  return (
    <div className="secondary-page">
      <BackButton />
      <div className="page-hero page-hero--supplier-orders">
        <h1>{t("supplier.orders.title")}</h1>
        <p>{t("supplier.orders.subtitle")}</p>
      </div>

      <div className="page-header secondary-toolbar">
        <div>
          <h2 className="dash-title">{t("supplier.orders.controlCenter")}</h2>
          <p className="dash-subtitle">{t("supplier.orders.controlSubtitle")}</p>
        </div>
      </div>

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
              {t("common.labels.orderFiltersStatus")}
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
              <option value="ALL">{t("supplier.orders.allStatuses")}</option>
              <option value="PENDING">⏳ {t("status.pending")}</option>
              <option value="CONFIRMED">{t("status.confirmed")}</option>
              <option value="ASSIGNED">{t("status.assigned")}</option>
              <option value="PICKED_UP">{t("status.picked_up")}</option>
              <option value="OUT_FOR_DELIVERY">{t("status.out_for_delivery")}</option>
              <option value="FAILED_DELIVERY">{t("status.failed_delivery")}</option>
              <option value="DELIVERED">📦 {t("status.delivered")}</option>
              <option value="CANCELLED">✗ {t("status.cancelled")}</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div style={{ flex: "1", minWidth: "200px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
              {t("common.labels.orderFiltersPayment")}
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
              <option value="ALL">{t("supplier.orders.allPayments")}</option>
              <option value="PAID">💳 Paid</option>
              <option value="PENDING">💰 Payment Pending</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ flex: "1", minWidth: "200px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>
              {t("common.labels.orderFiltersSort")}
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
              <option value="DATE_DESC">{t("supplier.orders.sort.newestFirst")}</option>
              <option value="DATE_ASC">{t("supplier.orders.sort.oldestFirst")}</option>
              <option value="AMOUNT_DESC">{t("supplier.orders.sort.highestAmount")}</option>
              <option value="AMOUNT_ASC">{t("supplier.orders.sort.lowestAmount")}</option>
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
            {showActiveOnly ? t("common.labels.activeOnly") : t("common.labels.orderFiltersShow")}
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
            {t("common.actions.clearFilters")}
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
            {t("common.actions.clearCompleted")}
          </Button>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", fontSize: "14px", color: "var(--muted)" }}>
            {t("common.labels.showCount")} <strong style={{ margin: "0 4px", color: "var(--text)" }}>{filteredOrders.length}</strong> {t("common.labels.of")} <strong style={{ margin: "0 4px", color: "var(--text)" }}>{orders.length}</strong> {t("common.labels.orders")}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "24px", display: "grid", gap: "16px" }}>
        {filteredOrders.length === 0 && (
          <div className="order-card" style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ fontSize: "18px", color: "var(--muted)" }}>
              {orders.length === 0 ? t("supplier.orders.noOrders") : t("supplier.orders.noOrdersForFilter")}
            </p>
            {orders.length > 0 && (
              <Button
                className="btn primary square"
                onClick={clearFilters}
                style={{ marginTop: "16px" }}
              >
                {t("common.actions.clearFilters")}
              </Button>
            )}
          </div>
        )}

        {filteredOrders.map((order) => (
          <div key={order.id} className="order-card" style={{ display: "block" }}>
            <div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                <h4>{t("common.labels.orderId")} #{order.displayOrderNumber ?? order.orderNumber ?? order.id}</h4>
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
                {t("common.labels.orderDate")}: {new Date(order.createdAt).toLocaleDateString("en-IN")}
              </p>

              <div style={{ marginTop: "16px" }}>
                <p style={{ fontWeight: "600", marginBottom: "8px" }}>{t("common.labels.customerDetails")}:</p>
                <p style={{ fontSize: "14px" }}>
                  {order.shippingAddress?.fullName}<br />
                  {order.shippingAddress?.phone}<br />
                  {order.shippingAddress?.address}
                </p>
              </div>

              <div style={{ marginTop: "12px" }}>
                <p style={{ fontWeight: "600", marginBottom: "8px" }}>{t("supplier.orders.assignedAgent")}:</p>
                <p style={{ fontSize: "14px", color: "var(--muted)" }}>
                  {order.deliveryAgent?.name || t("supplier.orders.notAssigned")}
                </p>
              </div>
              {order.status === "FAILED_DELIVERY" && (
                <div style={{ marginTop: "12px" }}>
                  <p style={{ fontWeight: "600", marginBottom: "8px", color: "#c2410c" }}>
                    {t("supplier.orders.rejectionReason")}:
                  </p>
                  <p style={{ fontSize: "14px", color: "#9a3412" }}>
                    {order.deliveryRejectionReason || t("supplier.orders.noRejectionReason")}
                  </p>
                </div>
              )}

              <div style={{ marginTop: "16px" }}>
                <p style={{ fontWeight: "600", marginBottom: "8px" }}>{t("common.labels.items")}:</p>
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
                  {t("common.labels.total")}: INR {order.totalAmount}
                </p>

                <div style={{ display: "flex", gap: "8px" }}>
                  {order.status === "PENDING" && (
                    <>
                      <Button
                        className="btn primary square"
                        onClick={() => updateOrderStatus(order.id, "CONFIRMED", order)}
                      >
                        {t("supplier.orders.confirmOrder")}
                      </Button>
                      <Button
                        className="btn secondary square"
                        onClick={() => updateOrderStatus(order.id, "CANCELLED", order)}
                        style={{ background: "#fee", color: "#b42318" }}
                      >
                        {t("common.actions.cancel")}
                      </Button>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <select
                          value={selectedAgents[order.id] || ""}
                          onChange={(e) => setSelectedAgents((prev) => ({ ...prev, [order.id]: e.target.value }))}
                          style={{
                            minWidth: "200px",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            border: "1px solid var(--border)",
                            background: "var(--background)",
                          }}
                        >
                          <option value="">{t("supplier.orders.selectDeliveryAgent")}</option>
                          {availableAgents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {(agent.name || agent.email || `Agent #${agent.id}`)} ({agent.vehicleType || "Vehicle"}) {agent.rating ? `- ${agent.rating}` : ""}
                            </option>
                          ))}
                        </select>
                        <Button
                          className="btn square"
                          onClick={() => assignOrderToAgent(order.id, order)}
                          disabled={availableAgents.length === 0}
                        >
                          {t("supplier.orders.assignAgent")}
                        </Button>
                      </div>
                    </>
                  )}
                  {order.status === "FAILED_DELIVERY" && (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <select
                        value={selectedAgents[order.id] || ""}
                        onChange={(e) => setSelectedAgents((prev) => ({ ...prev, [order.id]: e.target.value }))}
                        style={{
                          minWidth: "200px",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border)",
                          background: "var(--background)",
                        }}
                      >
                        <option value="">{t("supplier.orders.selectDeliveryAgent")}</option>
                        {availableAgents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {(agent.name || agent.email || `Agent #${agent.id}`)} ({agent.vehicleType || "Vehicle"}) {agent.rating ? `- ${agent.rating}` : ""}
                          </option>
                        ))}
                      </select>
                      <Button
                        className="btn square"
                        onClick={() => assignOrderToAgent(order.id, order)}
                        disabled={availableAgents.length === 0}
                      >
                        {t("supplier.orders.reassignAgent")}
                      </Button>
                    </div>
                  )}
                  {(order.status === "CONFIRMED" || order.status === "ASSIGNED" || order.status === "PICKED_UP" || order.status === "OUT_FOR_DELIVERY") && (
                    <Button
                      className="btn primary square"
                      onClick={() => updateOrderStatus(order.id, "DELIVERED", order)}
                    >
                      {t("common.actions.markDelivered")}
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
                      {t("common.actions.removeHistory")}
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

