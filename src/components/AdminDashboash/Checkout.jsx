import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast, Toaster } from "sonner";
import { FaUser, FaCreditCard } from "react-icons/fa";
import Header from "../../components/Header/Header";
import FooterUser from "../../components/Footer/FooterUser";
import Sevicer from "../Sevicer/Sevicer";
import "./Checkout.css";

const API_URL = "http://localhost:3000";

const cleanPrice = (priceInput) => {
  if (typeof priceInput === "number") return priceInput;
  if (!priceInput) return 0;
  const cleaned = priceInput
    .toString()
    .replace(/\./g, "")
    .replace(/,/g, "")
    .replace(/[^0-9]/g, "");
  return parseInt(cleaned, 10) || 0;
};

const generateOrderCode = () => {
  const now = new Date();
  return `DH-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const buyNowItem = location.state?.buyNowItem;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
    note: "",
    paymentMethod: "cod",
  });

  useEffect(() => {
    const init = async () => {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setCustomerInfo((prev) => ({
        ...prev,
        fullName: currentUser.fullName || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
      }));

      if (buyNowItem) {
        setCartItems([{ ...buyNowItem, quantity: buyNowItem.quantity || 1 }]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/cart`);
        const allCart = await res.json();
        const myCart = allCart.filter(
          (item) => String(item.userId) === String(currentUser.id),
        );

        if (myCart.length === 0) {
          toast.warning("Giỏ hàng đang trống!");
          navigate("/cart");
          return;
        }

        const itemsWithDetails = await Promise.all(
          myCart.map(async (item) => {
            const table = item.fromTable || "catenogies";
            const pRes = await fetch(`${API_URL}/${table}/${item.productId}`);
            const pData = pRes.ok ? await pRes.json() : {};

            // 🌟 GIẢI PHÁP: Lưu ID giỏ hàng vào 'cartId' để không bị pData đè mất
            return {
              ...pData,
              ...item,
              cartId: item.id, // ID gốc của bảng cart
              table,
            };
          }),
        );
        setCartItems(itemsWithDetails);
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải giỏ hàng.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [buyNowItem, navigate]);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    try {
      const formattedProducts = cartItems.map((item) => ({
        productId: item.productId,
        name: item.name || "Sản phẩm",
        image: item.image,
        quantity: item.quantity,
        unitPrice: cleanPrice(item.price),
        subtotal: cleanPrice(item.price) * item.quantity,
        fromTable: item.table,
      }));

      const newOrder = {
        orderCode: generateOrderCode(),
        userId: currentUser.id,
        ...customerInfo,
        status: "pending",
        totalAmount: formattedProducts.reduce((sum, p) => sum + p.subtotal, 0),
        createdAt: new Date().toISOString(),
        products: formattedProducts,
      };

      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });

      if (!res.ok) throw new Error("Lỗi khi gửi đơn hàng");

      if (!buyNowItem) {
        // 🌟 SỬ DỤNG cartId ĐÃ LƯU TRƯỚC ĐÓ
        await Promise.all(
          cartItems.map((item) => {
            if (item.cartId) {
              return fetch(`${API_URL}/cart/${item.cartId}`, {
                method: "DELETE",
              });
            }
          }),
        );
        window.dispatchEvent(new Event("cartUpdated"));
      }

      toast.success("Đặt hàng thành công!");
      setTimeout(() => navigate("/orders"), 1000);
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi đặt hàng.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-box">Đang tải...</div>;

  return (
    <>
      <Header />
      <div className="product-detail-pages">
        <div className="inner-breads">
          <Link to="/">
            <span>Trang chủ</span>
          </Link>
          <Link to="/cart">
            <span>Giỏ hàng</span>
          </Link>
          <span>Thanh toán</span>
        </div>
        <div className="container">
          <form className="checkout-wrapper" onSubmit={handleSubmitOrder}>
            <div className="checkout-left">
              <h3 className="checkout-section-title">
                <FaUser /> <span>THÔNG TIN GIAO HÀNG</span>
              </h3>
              <div className="checkout-form">
                <div className="checkout-group">
                  <label>Họ và tên *</label>
                  <input
                    required
                    value={customerInfo.fullName}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        fullName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="checkout-group">
                  <label>Số điện thoại *</label>
                  <input
                    required
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="checkout-group">
                  <label>Địa chỉ *</label>
                  <input
                    required
                    value={customerInfo.address}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        address: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <h3 className="checkout-section-title-payment">
                <FaCreditCard /> <span>PHƯƠNG THỨC THANH TOÁN</span>
              </h3>
              <button
                type="submit"
                className="btn-confirm-checkout"
                disabled={submitting}
              >
                {submitting ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐẶT HÀNG"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Sevicer />
      <FooterUser />
      <Toaster />
    </>
  );
};

export default Checkout;
