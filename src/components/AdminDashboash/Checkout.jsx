import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast, Toaster } from "sonner";
import { FaUser, FaCreditCard, FaShoppingBag, FaTag } from "react-icons/fa";
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

const formatPrice = (amount) => amount.toLocaleString("vi-VN") + "₫";

const generateOrderCode = () => {
  const now = new Date();
  return `DH-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
};

const vouchers = [
  {
    code: "SANMUAHE50k",
    type: "percent",
    value: 20,
    des: "Giảm 50k Cho Sản phẩm đầu tiên",
  },
  {
    code: "SANMUAHE100k",
    type: "percent",
    value: 20,
    des: "Giảm 100k cho khách hàng vip",
  },
  {
    code: "SANMUAHE200k",
    type: "percent",
    value: 20,
    des: "Giảm 200k khách hàng thân thiết",
  },
];

const PAYMENT_METHODS = [
  {
    value: "cod",
    label: "Thanh toán khi nhận hàng",
    desc: "COD — thanh toán bằng tiền mặt khi nhận",
    icon: "💵",
    iconBg: "#fef3c7",
  },
  {
    value: "bank",
    label: "Chuyển khoản ngân hàng",
    desc: "Thanh toán qua tài khoản ngân hàng",
    icon: "🏦",
    iconBg: "#e0f2fe",
  },
  {
    value: "momo",
    label: "Ví MoMo",
    desc: "Thanh toán nhanh qua ví điện tử MoMo",
    icon: "📱",
    iconBg: "#fce7f3",
  },
];

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const buyNowItem = location.state?.buyNowItem;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({
    fullName: "",
    phone: "",
    email: "",
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
        email: currentUser.email || "",
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
            return { ...pData, ...item, cartId: item.id, table };
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

  const subTotal = cartItems.reduce(
    (sum, item) => sum + cleanPrice(item.price) * item.quantity,
    0,
  );
  const shipping = subTotal > 500000 ? 0 : 30000;
  const totalAmount = Math.max(0, subTotal + shipping - discount);

  const handleApplyCoupon = () => {
    const foundVoucher = vouchers.find((v) => v.code === couponCode);
    if (foundVoucher) {
      let discountAmount = 0;
      if (foundVoucher.type === "percent") {
        discountAmount = (subTotal * foundVoucher.value) / 100;
      }
      setDiscount(discountAmount);
      toast.success(`Đã áp dụng mã ${foundVoucher.code}!`);
    } else {
      toast.error("Mã giảm giá không hợp lệ");
    }
  };

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
        totalAmount,
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
              <div className="checkout-card">
                <h3 className="checkout-section-title">
                  <FaUser /> <span>THÔNG TIN GIAO HÀNG</span>
                </h3>
                <div className="checkout-form">
                  <div className="checkout-group">
                    <label>Họ và tên *</label>
                    <input
                      required
                      placeholder="Nguyễn Văn A"
                      value={customerInfo.fullName}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          fullName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="checkout-row-2">
                    <div className="checkout-group">
                      <label>Số điện thoại *</label>
                      <input
                        required
                        placeholder="0912 345 678"
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
                      <label>Email</label>
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={customerInfo.email}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="checkout-group">
                    <label>Địa chỉ *</label>
                    <input
                      required
                      placeholder="Số nhà, đường..."
                      value={customerInfo.address}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="checkout-group">
                    <label>Ghi chú</label>
                    <textarea
                      rows={2}
                      value={customerInfo.note}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          note: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="checkout-card">
                <h3 className="checkout-section-title">
                  <FaCreditCard /> <span>PHƯƠNG THỨC THANH TOÁN</span>
                </h3>
                <div className="pay-methods">
                  {PAYMENT_METHODS.map((pm) => (
                    <label
                      key={pm.value}
                      className={`pay-opt ${customerInfo.paymentMethod === pm.value ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={pm.value}
                        checked={customerInfo.paymentMethod === pm.value}
                        onChange={() =>
                          setCustomerInfo({
                            ...customerInfo,
                            paymentMethod: pm.value,
                          })
                        }
                      />
                      <div
                        className="pay-icon"
                        style={{ background: pm.iconBg }}
                      >
                        {pm.icon}
                      </div>
                      <div className="pay-label">
                        <strong>{pm.label}</strong>
                        <span>{pm.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="checkout-right">
              <div className="checkout-card">
                <h3>ĐƠN HÀNG CỦA BẠN</h3>
                {cartItems.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <p>
                      {item.name} x {item.quantity}
                    </p>
                    <span>
                      {formatPrice(cleanPrice(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="sum-rows">
                  <p>Tạm tính: {formatPrice(subTotal)}</p>
                  {discount > 0 && (
                    <p style={{ color: "red" }}>
                      Giảm giá: -{formatPrice(discount)}
                    </p>
                  )}
                  <p>
                    Phí ship:{" "}
                    {shipping === 0 ? "Miễn phí" : formatPrice(shipping)}
                  </p>
                  <p>
                    <strong>Tổng cộng: {formatPrice(totalAmount)}</strong>
                  </p>
                </div>
              </div>
              <div className="checkout-card coupon-card">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Nhập mã..."
                />
                <button type="button" onClick={handleApplyCoupon}>
                  Áp dụng
                </button>
              </div>
              <button type="submit" disabled={submitting}>
                XÁC NHẬN ĐẶT HÀNG
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
