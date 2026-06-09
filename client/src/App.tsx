import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SiteProvider } from './context/SiteContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { NewProducts } from './pages/NewProducts';
import { NewArrivals } from './pages/NewArrivals';
import { About } from './pages/About';
import { Customise } from './pages/Customise';
import { ProductDetail } from './pages/ProductDetail';
import  Profile  from './pages/profile.tsx';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Orders } from './pages/Orders';
import { Admin } from './pages/Admin';
import { Wishlist } from './pages/Wishlist.tsx';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentFailure } from './pages/PaymentFailure';
import { Credit } from './pages/Credit';
import EmiLanding from './pages/emi/Landing';
import EmiApply from './pages/emi/Apply';
import EmiAdmin from './pages/emi/Admin';

export default function App() {
  return (
    <AuthProvider>
      <SiteProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="shop" element={<Shop />} />
              <Route path="new-arrivals" element={<NewArrivals />} />
              <Route path="new-products" element={<NewProducts />} />
              <Route path="about" element={<About />} />
              <Route path="customise" element={<Customise />} />
              <Route path="product/:slug" element={<ProductDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route
  path="/profile"
  element={<Profile />}
/>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="orders" element={<Orders />} />
              <Route path="admin" element={<Admin />} />
              <Route path="payment-success" element={<PaymentSuccess />} />
              <Route path="payment-failure" element={<PaymentFailure />} />
              <Route path="emi" element={<EmiLanding />} />
              <Route path="emi/apply" element={<EmiApply />} />
              <Route path="admin/emi" element={<EmiAdmin />} />
              <Route path="credit" element={<Credit />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SiteProvider>
    </AuthProvider>
  );
}
