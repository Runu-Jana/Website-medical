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
import Wishlist from './pages/Wishlist'
import PrescriptionUpload from './pages/PrescriptionUpload'
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
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
