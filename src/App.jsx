// 🌟 Đã bổ sung import "Navigate" vào đây để tránh lỗi Crash ứng dụng
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import "nprogress/nprogress.css";
import LoadingBar from "./components/NProgress/LoadingBar";
import ProductPage from "./pages/ProductPages/ProductPage";
import LaptopPage from "./pages/LaptopPages/LaptopPage";
import ComponentPage from "./pages/ComponentPages/ComponentPage";
import ProductMenu from "./pages/ProductMenu";
import Login from "./components/LogUserPage/Login";
import Admin from "./components/AdminDashboash/Admin";
import ProductManager from "./components/AdminDashboash/ProductManager";
import Register from "./components/LogUserPage/Register";
import Profile from "./components/AdminDashboash/Profile";
import UserManager from "./components/AdminDashboash/UserManager";
import { Toaster } from "sonner";
import UserOrders from "./components/AdminDashboash/UserOrders";
import Checkout from "./components/AdminDashboash/Checkout";
import AdminOrders from "./components/AdminDashboash/AdminOrders";

// 🌟 Hãy kiểm tra chắc chắn đường dẫn này trỏ đúng đến file Cart.jsx thông minh chúng ta vừa viết
import Cart from "./pages/CartUser/Cart";
import Statistics from "./components/AdminDashboash/Statistics";
import Discount from "./components/AdminDashboash/DiscountUser";
import EditProfile from "./components/AdminDashboash/EditProfile";
import News from "./components/Sidebar/News";
import NewsDetail from "./components/Sidebar/NewsDetail";
import CategoryPage from "./components/Catenogy/CategoryPage";
import LaptopMenu from "./components/Newlaptop/LaptopMenu";

// 🛡️ BỘ BẢO VỆ ROUTE ADMIN
const AdminProtectedRoute = ({ children }) => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  // Nếu chưa đăng nhập HOẶC đăng nhập rồi nhưng không phải admin -> Đá thẳng về trang login
  if (!currentUser || currentUser.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <LoadingBar />
      <Routes>
        {/* ================= USER ROUTES ================= */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/edit" element={<EditProfile />} />

        {/* Tuyến đường sản phẩm chi tiết */}
        <Route path="/laptop/:category" element={<LaptopMenu />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/news" element={<News />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/page/:id" element={<ProductPage />} />
        <Route path="/menu/:id" element={<ProductMenu />} />
        <Route path="/laptop-detail/:id" element={<LaptopPage />} />
        <Route path="/component/:id" element={<ComponentPage />} />

        {/* Giỏ hàng & Thanh toán */}
        <Route path="/admin/discount" element={<Discount />} />
        <Route path="/admin/statistics" element={<Statistics />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<UserOrders />} />

        {/* ================= ADMIN ROUTES (BẢO MẬT) ================= */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <Admin />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminProtectedRoute>
              <ProductManager />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminProtectedRoute>
              <UserManager />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminProtectedRoute>
              <AdminOrders />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/statistics"
          element={
            <AdminProtectedRoute>
              <statistics />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/discount"
          element={
            <AdminProtectedRoute>
              <Admin />
            </AdminProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
