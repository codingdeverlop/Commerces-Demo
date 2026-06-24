import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import InstallmentModal from "./InstallmentModal";
import Header from "../components/Header/Header";
import FooterUser from "../components/Footer/FooterUser";
import Sevicer from "../components/Sevicer/Sevicer";
import { FaShippingFast, FaAddressCard, FaCcApplePay } from "react-icons/fa";
import { MdCurrencyExchange } from "react-icons/md";
import { IoCall } from "react-icons/io5";
import { FaRocketchat } from "react-icons/fa6";
import { FcShipped } from "react-icons/fc";
import "./ProductMenu.css";

const ProductMenu = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showInstallment, setShowInstallment] = useState(false);
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // ================= FETCH SẢN PHẨM CHI TIẾT =================
  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:3000/ProductMenus")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        const found = data.find((item) => String(item.id) === String(id));
        setProduct(found || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi fetch API ProductMenus:", err);
        setLoading(false);
      });
  }, [id]);

  // ================= SCROLL LOCK MODAL =================
  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "auto";
  }, [showModal]);

  // ================= LOGIC XỬ LÝ GIỎ HÀNG (SỬA ĐỔI ĐỒNG BỘ CHỐNG LỖI) =================
  // ================= LOGIC XỬ LÝ GIỎ HÀNG (SỬA ĐỒNG BỘ CHỐNG GHI ĐÈ DATA) =================
  const handleAddToCart = async (redirectToCart = false) => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    // 1. Kiểm tra trạng thái đăng nhập của người dùng
    if (!currentUser) {
      toast.warning("Vui lòng đăng nhập để mua sản phẩm này!");
      navigate("/login");
      return;
    }

    // Đảm bảo lấy ID từ URL làm gốc để kiểm tra nhằm tránh bất đồng bộ state `product`
    const targetProductId = String(id);
    const targetFromTable = "ProductMenus"; // 🌟 ĐỊNH DANH BẢNG CỦA FILE NÀY

    try {
      // 2. Lấy toàn bộ giỏ hàng của User này về
      const cartRes = await fetch(
        `http://localhost:3000/cart?userId=${currentUser.id}`,
      );
      let cartItems = [];

      if (cartRes.ok) {
        cartItems = await cartRes.json();
      }

      // Bộ cứu hộ: Nếu filter theo userId trả về rỗng do lệch kiểu dữ liệu, ta fetch all rồi tự lọc
      if (!cartItems || cartItems.length === 0) {
        const resAll = await fetch("http://localhost:3000/cart");
        if (resAll.ok) {
          const allCart = await resAll.json();
          cartItems = allCart.filter(
            (item) => String(item.userId) === String(currentUser.id),
          );
        }
      }

      // 3. Tìm chính xác mục trùng ID VÀ bắt buộc phải trùng từ bảng "ProductMenus"
      const existingItem = cartItems.find(
        (item) =>
          String(item.productId) === targetProductId &&
          item.fromTable === targetFromTable, // 🌟 CHECK TRÙNG CẢ BẢNG XUẤT XỨ
      );

      if (existingItem) {
        // NẾU ĐÃ CÓ -> Tiến hành PATCH tăng số lượng lên 1
        console.log(
          "Sản phẩm đã tồn tại, tiến hành tăng số lượng lên:",
          existingItem.quantity + 1,
        );
        const updateRes = await fetch(
          `http://localhost:3000/cart/${existingItem.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quantity: Number(existingItem.quantity) + 1,
            }),
          },
        );

        if (updateRes.ok) {
          toast.success("Đã tăng số lượng sản phẩm trong giỏ hàng!");
          window.dispatchEvent(new Event("cartUpdated")); // Đồng bộ lại số lượng hiển thị trên Badge Header
          if (redirectToCart) navigate("/cart");
        }
      } else {
        // NẾU CHƯA CÓ -> Tiến hành POST thêm mới kèm định danh độc nhất không lo đè lên ID của Laptop/Component
        console.log("Sản phẩm mới, tiến hành lưu vào DB...");
        const newCartItem = {
          id: `cart-menu-${targetProductId}-${Date.now()}`, // 🌟 TẠO ID MỚI TRÁNH ĐÈ DATA TRONG DB.JSON
          userId: currentUser.id,
          productId: targetProductId,
          quantity: 1,
          fromTable: targetFromTable, // Đóng dấu xuất xứ để phân biệt với các bảng trùng ID khác
        };

        const postRes = await fetch("http://localhost:3000/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCartItem),
        });

        if (postRes.ok) {
          toast.success("Thêm vào giỏ hàng thành công!");
          window.dispatchEvent(new Event("cartUpdated")); // Đồng bộ Badge giỏ hàng trên Header
          if (redirectToCart) navigate("/cart");
        }
      }
    } catch (error) {
      console.error("Lỗi kết nối giỏ hàng:", error);
      toast.error("Không thể xử lý giỏ hàng vào lúc này!");
    }
  };

  // ================= GIAO DIỆN TRẠNG THÁI LOADING =================
  if (loading) {
    return (
      <>
        <Header />
        <div style={{ padding: "80px 0", textAlign: "center" }}>
          <h2>Đang tải thông tin chi tiết sản phẩm...</h2>
        </div>
        <FooterUser />
      </>
    );
  }

  // ================= GIAO DIỆN KHI KHÔNG TÌM THẤY SẢN PHẨM =================
  if (!product) {
    return (
      <>
        <Header />
        <div style={{ padding: "80px 0", textAlign: "center" }}>
          <h2>Sản phẩm không tồn tại hoặc đã bị gỡ bỏ!</h2>
          <Link
            to="/"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            Quay lại trang chủ
          </Link>
        </div>
        <FooterUser />
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="bread-bar">
        <div className="inner-bread">
          <Link to="/">
            <span>Trang chủ </span>
          </Link>
          <Link to="/">
            <span>Máy tính mới</span>
          </Link>
          <Link to="/page/:id">
            <span>Sản Phẩm Mới</span>
          </Link>
        </div>
      </div>

      <div className="product-menu-page">
        <div className="container">
          <div className="product-wrapper">
            {/* ================= KHU VỰC BÊN TRÁI ================= */}
            <div className="product-detail">
              <div className="product-left">
                <div className="product-image">
                  <img src={product.image} alt={product.name} />
                </div>

                <div className="spec-box">
                  <h3>THÔNG SỐ KỸ THUẬT</h3>
                  {product.specs &&
                    Object.entries(product.specs).map(([key, value]) => (
                      <div className="spec-row" key={key}>
                        <span>{key}</span>
                        <span>{value}</span>
                      </div>
                    ))}
                </div>

                <div className="support-sidebar-box">
                  <h4>Hỗ trợ mua hàng</h4>
                  <div className="support-item">
                    <span className="icon">
                      <IoCall />
                    </span>
                    <p>
                      Tổng đài tư vấn: <strong>1900.1515</strong>
                    </p>
                  </div>
                  <div className="support-item">
                    <span className="icon">
                      <FaRocketchat />
                    </span>
                    <p>Chat trực tuyến với nhân viên hỗ trợ</p>
                  </div>
                  <div className="support-item">
                    <span className="icon">
                      <FcShipped />
                    </span>
                    <p>Giao hàng miễn phí nội thành 2h</p>
                  </div>
                  <button className="btn-zalo-contact">Gọi Ngay</button>
                </div>
              </div>

              {/* ================= KHU VỰC Ở GIỮA ================= */}
              <div className="product-center">
                <h1>{product.name}</h1>

                <div className="product-meta">
                  <span>
                    <b>Thương hiệu:</b> {product.brand}
                  </span>
                  <span>
                    <b>Danh mục:</b> {product.category}
                  </span>
                  <span>
                    <b>Tình trạng:</b> {product.status}
                  </span>
                </div>

                <div className="price-box">
                  <span className="price">
                    {product.price?.toLocaleString()}đ
                  </span>
                  <span className="old-price">
                    {product.oldPrice?.toLocaleString()}đ
                  </span>
                </div>

                <div className="promotion-box">
                  <h3>🎁 Khuyến mãi đặc biệt</h3>
                  <ul>
                    {product.promotions?.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                {/* KHU VỰC HÀNH ĐỘNG NÚT BẤM ĐÃ ĐƯỢC LẮP LOGIC CHUẨN */}
                <div className="purchase-actions-groups">
                  <button
                    className="btn-add-to-cart-bits"
                    onClick={() => handleAddToCart(false)}
                  >
                    THÊM VÀO GIỎ HÀNG
                  </button>

                  <div className="sub-buy-buttons-rows">
                    <button
                      className="btn-buy-now-splits"
                      onClick={() => handleAddToCart(true)}
                    >
                      MUA NGAY
                    </button>

                    <button
                      className="btn-installment-splits"
                      onClick={() => setShowInstallment(true)}
                    >
                      TRẢ GÓP
                    </button>
                  </div>
                </div>

                <button
                  className="btn-show-description"
                  onClick={() => setShowModal(true)}
                >
                  Xem chi tiết mô tả sản phẩm
                </button>
              </div>

              {/* ================= KHU VỰC BÊN PHẢI ================= */}
              <div className="detail-right-policie">
                <h3>CHÍNH SÁCH</h3>
                <div className="policy-item-rows">
                  <FaShippingFast /> Giao hàng nhanh
                </div>
                <div className="policy-item-rows">
                  <FaAddressCard /> Trả góp linh hoạt
                </div>
                <div className="policy-item-rows">
                  <FaCcApplePay /> Thanh toán bảo mật
                </div>
                <div className="policy-item-rows">
                  <MdCurrencyExchange /> Đổi trả 7 ngày nhanh chóng
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL HIỂN THỊ MÔ TẢ CHI TIẾT ================= */}
      {(showModal || showInstallment) && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowModal(false)}>
              ×
            </button>
            <h2>{product.description?.title}</h2>
            {product.description?.content?.map((s, i) => (
              <div key={i}>
                <h3>{s.heading}</h3>
                <p>{s.text}</p>
                {s.image && <img src={s.image} alt="" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= DANH SÁCH SẢN PHẨM LIÊN QUAN ================= */}
      <section className="related-products">
        <h2>SẢN PHẨM LIÊN QUAN</h2>
        <div className="related-grid">
          {products
            .filter((p) => p.id !== product.id)
            .slice(0, 5)
            .map((item) => (
              <div key={item.id} className="related-card">
                <img src={item.image} alt={item.name} />
                <h4>{item.name}</h4>
                <p>{item.price?.toLocaleString()}đ</p>
                <Link to={`/menu/${item.id}`}>Xem chi tiết</Link>
              </div>
            ))}
        </div>
      </section>

      {product && (
        <InstallmentModal
          isOpen={showInstallment}
          onClose={() => setShowInstallment(false)}
          product={product}
        />
      )}

      <Sevicer />
      <FooterUser />
    </>
  );
};

export default ProductMenu;
