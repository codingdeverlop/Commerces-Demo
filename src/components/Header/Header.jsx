import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
// --- IMPORT SONNER ĐỂ THAY THẾ ALERT MẶC ĐỊNH ---
import { toast } from "sonner";
import { IoLogoDesignernews } from "react-icons/io";
import "./Header.css";
import { MdOutlineSupportAgent } from "react-icons/md";
import { MdDiscount } from "react-icons/md";
import { AiOutlineFileProtect } from "react-icons/ai";
import { FaShippingFast } from "react-icons/fa";
import { MdOutlineAddIcCall } from "react-icons/md";
import { PiShoppingCartDuotone } from "react-icons/pi";
import { IoSearch } from "react-icons/io5";
import { VscAccount } from "react-icons/vsc";

const Header = (props) => {
  const navigate = useNavigate();

  // Trạng thái lưu tên modal đang mở (null, "HỖ TRỢ TRẢ GÓP", "GIÁ ƯU ĐÃI NHẤT", hoặc "HOTLINE")
  const [activeModal, setActiveModal] = useState(null);
  // Trạng thái mở/đóng menu thả xuống của Tài khoản
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  // 🌟 THÊM: Trạng thái lưu tổng số lượng sản phẩm trong giỏ hàng
  const [cartCount, setCartCount] = useState(0);

  // 🌟 ĐỌC DỮ LIỆU ĐĂNG NHẬP THỰC TẾ TỪ LOCALSTORAGE
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const isLoggedIn = !!currentUser;
  const isAdmin = currentUser?.role === "admin";

  // 🌟 ĐÃ CẬP NHẬT: Hàm đồng bộ số lượng giỏ hàng kết hợp bộ cứu hộ chống lệch kiểu dữ liệu
  const fetchCartCount = async () => {
    if (!currentUser) {
      setCartCount(0);
      return;
    }
    try {
      // Bước 1: Thử gọi lọc theo cách thông thường qua URL
      const res = await fetch(
        `http://localhost:3000/cart?userId=${currentUser.id}`,
      );
      let cartData = [];

      if (res.ok) {
        cartData = await res.json();
      }

      // 🌟 BỘ CỨU HỘ CHUẨN ĐÉT: Nếu DB có hàng nhưng trả về rỗng do lệch kiểu dữ liệu (String vs Number)
      if (!cartData || cartData.length === 0) {
        const resAll = await fetch("http://localhost:3000/cart");
        if (resAll.ok) {
          const allCart = await resAll.json();
          // Tự dùng filter ép cả 2 vế về dạng String để so sánh an toàn
          cartData = allCart.filter(
            (item) => String(item.userId) === String(currentUser.id),
          );
        }
      }

      // Cộng dồn tất cả trường quantity của các sản phẩm có trong giỏ hàng
      const total = cartData.reduce(
        (sum, item) => sum + (Number(item.quantity) || 1),
        0,
      );
      setCartCount(total);
    } catch (error) {
      console.error("Lỗi khi lấy số lượng giỏ hàng trên Header:", error);
    }
  };

  // 🌟 THEO DÕI SỰ KIỆN: Chạy khi mount và lắng nghe tín hiệu phát ra từ các nút bấm chi tiết
  useEffect(() => {
    fetchCartCount(); // Chạy lần đầu khi vừa vào trang hoặc load lại trang

    window.addEventListener("cartUpdated", fetchCartCount);
    return () => {
      window.removeEventListener("cartUpdated", fetchCartCount);
    };
  }, [currentUser?.id]);

  // Trạng thái lưu thông tin form đăng ký (dành cho Trả góp / Ưu đãi)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    message: "",
  });

  // Khóa cuộn trang khi có bất kỳ Modal nào mở
  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeModal]);

  // Đóng menu tài khoản khi click ra ngoài tự do
  useEffect(() => {
    const handleCloseMenu = () => setShowAccountMenu(false);
    window.addEventListener("click", handleCloseMenu);
    return () => window.removeEventListener("click", handleCloseMenu);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success(
      `Xác nhận yêu cầu [${activeModal}] thành công! Chúng tôi sẽ liên hệ lại sớm nhất.`,
    );
    setFormData({ fullName: "", email: "", phone: "", message: "" });
    setActiveModal(null);
  };

  const getPlaceholderMessage = () => {
    if (activeModal === "HỖ TRỢ TRẢ GÓP") {
      return "Nhập sản phẩm bạn muốn mua trả góp hoặc số tiền dự định trả trước...";
    }
    if (activeModal === "GIÁ ƯU ĐÃI NHẤT") {
      return "Nhập sản phẩm bạn đang quan tâm để nhận báo giá chiết khấu tốt nhất...";
    }
    return "Nhập lời nhắn của bạn...";
  };

  // Xử lý Đăng xuất thực tế, xóa sạch LocalStorage và đá về Login
  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    toast.success("Đã đăng xuất tài khoản thành công!");
    navigate("/login");
  };

  return (
    <header className="header">
      {/* Header - top */}
      <div className="container">
        <div className="header-top">
          <div className="header-logo">
            <Link to="/">
              <IoLogoDesignernews style={{ cursor: "pointer" }} />
            </Link>
          </div>
          <nav className="header-nav">
            <ul className="header-menu">
              <li
                className="header-item clickable-item"
                onClick={() => setActiveModal("HỖ TRỢ TRẢ GÓP")}
              >
                <MdOutlineSupportAgent />
                Hỗ Trợ Trả Góp
              </li>
              <li
                className="header-item clickable-item"
                onClick={() => setActiveModal("GIÁ ƯU ĐÃI NHẤT")}
              >
                <MdDiscount />
                Giá Ưu Đãi Nhất
              </li>
              <li className="header-item">
                <AiOutlineFileProtect />
                Bảo Hành Tận Nhà
              </li>
              <li className="header-item">
                <FaShippingFast />
                Miễn Phí Vận Chuyển
              </li>
              <li
                className="header-item clickable-item"
                onClick={() => setActiveModal("HOTLINE")}
              >
                <MdOutlineAddIcCall />
                HOTLINE
              </li>
              <li
                className="header-item clickable-item cart-item"
                onClick={() => navigate("/cart")}
              >
                <div className="cart-icon">
                  <PiShoppingCartDuotone />
                  {/* Hiển thị biến state số lượng thực tế đã được đồng bộ hóa */}
                  <span className="cart-count">{cartCount}</span>
                </div>
                Giỏ Hàng
              </li>

              {/* TÀI KHOẢN DROPDOWN ĐÃ PHÂN QUYỀN THỰC TẾ */}
              <li
                className="header-item clickable-item account-dropdown-wrapper"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAccountMenu(!showAccountMenu);
                }}
              >
                <VscAccount />
                <span>{isLoggedIn ? currentUser.fullName : "Tài khoản"}</span>

                {/* Menu con hiển thị khi click vào */}
                {showAccountMenu && (
                  <ul className="account-dropdown-menu">
                    {!isLoggedIn ? (
                      <>
                        <li>
                          <Link to="/login">Đăng nhập</Link>
                        </li>
                        <li>
                          <Link to="/register">Đăng ký</Link>
                        </li>
                      </>
                    ) : (
                      <>
                        {isAdmin && (
                          <li>
                            <Link to="/admin">Trang Admin</Link>
                          </li>
                        )}
                        <li>
                          <Link to="/profile">Thông tin cá nhân</Link>
                        </li>
                        <li onClick={handleLogout} className="logout-item">
                          Đăng xuất
                        </li>
                      </>
                    )}
                  </ul>
                )}
              </li>
            </ul>
          </nav>
        </div>

        {/* Header - Bottom */}
        <div className="header-bottom">
          <div
            className="container"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              width: "100%",
            }}
          >
            <button className="category-btn">Danh Mục Sản Phẩm</button>
            <div className="search-box">
              <select className="category-select">
                <option>Danh Mục</option>
                <option>Laptop</option>
                <option>PC</option>
                <option>Con Chuột</option>
              </select>
              <input
                className="search-input"
                type="text"
                placeholder="Bạn cần tìm gì..."
              />
              <button className="search-btn" type="submit">
                <IoSearch />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GIAO DIỆN HIỂN THỊ CÁC MODAL */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div
            className="modal-content-custom"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`modal-header-blue ${activeModal === "HOTLINE" ? "bg-red" : ""}`}
            >
              <h3 className="modal-title-white">
                {activeModal === "HOTLINE"
                  ? "LIÊN HỆ KHẨN CẤP"
                  : "LIÊN HỆ VỚI CHÚNG TÔI"}
              </h3>
              <button
                className="modal-close-btn-white"
                onClick={() => setActiveModal(null)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body-content">
              {activeModal === "HOTLINE" ? (
                <>
                  <p className="modal-subtitle">
                    Vui lòng gọi trực tiếp cho các tổng đài viên dưới đây để
                    được xử lý sự cố lập tức!
                  </p>
                  <div className="hotline-list">
                    <div className="hotline-card">
                      <div className="hotline-info">
                        <span className="hotline-name">Quách Hoàng Hải</span>
                        <span className="hotline-role">
                          Hỗ trợ kỹ thuật phần cứng
                        </span>
                      </div>
                      <a href="tel:0911108133" className="hotline-call-btn">
                        0911.108.133
                      </a>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="modal-subtitle">
                    <span className="highlight-text">{activeModal}</span>. Vui
                    lòng để lại thông tin cá nhân dưới đây!
                  </p>
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label>Họ và tên *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        placeholder="Nhập họ và tên"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="example@gmail.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>Số điện thoại *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                    <div className="form-group">
                      <label>Nội dung chi tiết</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder={getPlaceholderMessage()}
                      ></textarea>
                    </div>
                    <button type="submit" className="modal-submit-btn">
                      Xác nhận
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
