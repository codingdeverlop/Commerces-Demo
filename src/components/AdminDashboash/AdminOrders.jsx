import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import {
  FaShoppingBag,
  FaUser,
  FaCheck,
  FaTruck,
  FaTrash,
  FaBan,
} from "react-icons/fa";
import "./AdminOrders.css";

const API_URL = "http://localhost:3000";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/orders`);
      if (!response.ok) throw new Error("Không thể lấy danh sách đơn hàng.");
      const data = await response.json();
      setOrders(data.reverse()); // Sắp xếp đơn mới nhất lên đầu
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải danh sách đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (
      newStatus === "cancelled" &&
      !window.confirm("Bạn có chắc chắn muốn HỦY đơn hàng này?")
    )
      return;
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        toast.success(
          newStatus === "cancelled"
            ? "Đã hủy đơn hàng!"
            : "Cập nhật trạng thái thành công!",
        );
        fetchOrders();
      } else {
        toast.error("Không thể cập nhật trạng thái.");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra.");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (
      !window.confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN đơn hàng này khỏi hệ thống?",
      )
    )
      return;
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Xóa vĩnh viễn đơn hàng thành công!");
        fetchOrders();
      } else {
        toast.error("Không thể xóa đơn hàng.");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa.");
    }
  };

  const filteredOrders = orders.filter((order) =>
    activeTab === "all" ? true : order.status === activeTab,
  );
  const getCountByStatus = (status) =>
    status === "all"
      ? orders.length
      : orders.filter((o) => o.status === status).length;
  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  if (loading)
    return <div className="loading-box">Đang tải danh sách đơn hàng...</div>;

  return (
    <div className="admin-orders-page">
      <h2 className="admin-title">
        <FaShoppingBag /> QUẢN LÝ ĐƠN HÀNG
      </h2>

      <div className="admin-order-tabs">
        {[
          "all",
          "pending",
          "confirmed",
          "shipping",
          "completed",
          "cancelled",
        ].map((tab) => (
          <button
            key={tab}
            className={`tab-item ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "all" && "Tất cả"}
            {tab === "pending" && "Chờ xử lý"}
            {tab === "confirmed" && "Đã xác nhận"}
            {tab === "shipping" && "Đang giao"}
            {tab === "completed" && "Thành công"}
            {tab === "cancelled" && "Đã hủy"}
            {` (${getCountByStatus(tab)})`}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="no-orders">Không có đơn hàng nào trong mục này.</div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Mã đơn hàng</th>
                <th>Khách hàng</th>
                <th>Sản phẩm mua</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="order-code">
                    <strong>{order.orderCode}</strong>
                  </td>
                  <td>
                    <div className="customer-info">
                      <p>
                        <FaUser /> {order.customerName}
                      </p>
                      <p>SĐT: {order.phone}</p>
                      <p className="address-text">ĐC: {order.address}</p>
                    </div>
                  </td>
                  <td>
                    <div className="order-products-list">
                      {order.products?.map((prod, idx) => (
                        <div key={idx} className="product-item-summary">
                          <img
                            src={
                              prod.image &&
                              (prod.image.startsWith("http") ||
                                prod.image.startsWith("data:") ||
                                prod.image.startsWith("/images"))
                                ? prod.image
                                : "https://placehold.co/40x40?text=PC"
                            }
                            alt={prod.name}
                            width="40"
                            height="40"
                            style={{ objectFit: "cover", borderRadius: "4px" }}
                          />
                          <span>
                            {prod.name || `Sản phẩm #${prod.productId}`} (x
                            {prod.quantity})
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="order-amount">
                    {/* Tính tổng động dự phòng tránh hoàn toàn lỗi lưu dữ liệu cũ bị NaN hoặc bằng 0 */}
                    {formatPrice(
                      order.totalAmount > 0
                        ? order.totalAmount
                        : (order.products || []).reduce(
                            (sum, p) => sum + p.unitPrice * p.quantity,
                            0,
                          ),
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${order.status}`}>
                      {order.status === "pending" && "Chờ xử lý"}
                      {order.status === "confirmed" && "Đã xác nhận"}
                      {order.status === "shipping" && "Đang giao"}
                      {order.status === "completed" && "Thành công"}
                      {order.status === "cancelled" && "Đã hủy đơn"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {order.status === "pending" && (
                        <>
                          <button
                            className="btn-approve"
                            onClick={() =>
                              handleUpdateStatus(order.id, "confirmed")
                            }
                          >
                            <FaCheck /> Duyệt
                          </button>
                          <button
                            className="btn-cancel"
                            onClick={() =>
                              handleUpdateStatus(order.id, "cancelled")
                            }
                          >
                            <FaBan /> Hủy
                          </button>
                        </>
                      )}
                      {order.status === "confirmed" && (
                        <button
                          className="btn-ship"
                          onClick={() =>
                            handleUpdateStatus(order.id, "shipping")
                          }
                        >
                          <FaTruck /> Giao hàng
                        </button>
                      )}
                      {order.status === "shipping" && (
                        <button
                          className="btn-complete"
                          onClick={() =>
                            handleUpdateStatus(order.id, "completed")
                          }
                        >
                          Hoàn thành
                        </button>
                      )}
                      {(order.status === "cancelled" ||
                        order.status === "completed") && (
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          <FaTrash /> Xóa hẳn
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default AdminOrders;
