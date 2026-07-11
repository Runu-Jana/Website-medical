import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Login from './pages/Login'
import Register from './pages/Register'
import Account from './pages/Account'
import About from './pages/About'
import Contact from './pages/Contact'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Brands from './pages/Brands'
import HealthClub from './pages/HealthClub'
import DoctorConsultation from './pages/DoctorConsultation'
import DoctorProfile from './pages/DoctorProfile'
import LabTests from './pages/LabTests'
import Wishlist from './pages/Wishlist'
import PrescriptionUpload from './pages/PrescriptionUpload'
import LegalPage from './pages/LegalPage'
import Invoice from './pages/Invoice'
import CategoryRedirect from './pages/CategoryRedirect'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/category/:slug" element={<CategoryRedirect />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/prescription" element={<PrescriptionUpload />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success/:id" element={<OrderSuccess />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/health-club" element={<HealthClub />} />
        <Route path="/doctors" element={<DoctorConsultation />} />
        <Route path="/doctors/:idOrSlug" element={<DoctorProfile />} />
        <Route path="/lab-tests" element={<LabTests />} />
        <Route path="/privacy-policy" element={<LegalPage docKey="privacy-policy" />} />
        <Route path="/terms" element={<LegalPage docKey="terms" />} />
        <Route path="/refund-policy" element={<LegalPage docKey="refund-policy" />} />
        <Route path="/shipping-policy" element={<LegalPage docKey="shipping-policy" />} />
        <Route path="/disclaimer" element={<LegalPage docKey="disclaimer" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      {/* Standalone (no nav/footer) for clean printing */}
      <Route path="/invoice/:id" element={<Invoice />} />
    </Routes>
  )
}
