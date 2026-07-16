import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Spinner from './components/Spinner'
import Home from './pages/Home' // eager: the landing page, keep first paint fast

// Everything else is code-split so each route ships only what it needs,
// shrinking the initial bundle a first-time visitor downloads.
const Shop = lazy(() => import('./pages/Shop'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Account = lazy(() => import('./pages/Account'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Brands = lazy(() => import('./pages/Brands'))
const HealthClub = lazy(() => import('./pages/HealthClub'))
const DoctorConsultation = lazy(() => import('./pages/DoctorConsultation'))
const DoctorProfile = lazy(() => import('./pages/DoctorProfile'))
const LabTests = lazy(() => import('./pages/LabTests'))
const HealthRecords = lazy(() => import('./pages/HealthRecords'))
const HealthAssistant = lazy(() => import('./pages/HealthAssistant'))
const BecomeSeller = lazy(() => import('./pages/BecomeSeller'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const PrescriptionUpload = lazy(() => import('./pages/PrescriptionUpload'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
const Invoice = lazy(() => import('./pages/Invoice'))
const CategoryRedirect = lazy(() => import('./pages/CategoryRedirect'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  return (
    <Suspense fallback={<Spinner className="py-32" />}>
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
          <Route path="/health-assistant" element={<HealthAssistant />} />
          <Route path="/sell" element={<BecomeSeller />} />
          <Route
            path="/health-records"
            element={
              <ProtectedRoute>
                <HealthRecords />
              </ProtectedRoute>
            }
          />
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
    </Suspense>
  )
}
