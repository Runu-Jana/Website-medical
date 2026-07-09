import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import Login from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import ProductForm from './pages/ProductForm.jsx';
import Categories from './pages/Categories.jsx';
import Brands from './pages/Brands.jsx';
import Banners from './pages/Banners.jsx';
import Popups from './pages/Popups.jsx';
import Posts from './pages/Posts.jsx';
import Prescriptions from './pages/Prescriptions.jsx';
import Orders from './pages/Orders.jsx';
import Offers from './pages/Offers.jsx';
import Customers from './pages/Customers.jsx';
import Refills from './pages/Refills.jsx';
import Messages from './pages/Messages.jsx';
import SupportChats from './pages/SupportChats.jsx';
import Admins from './pages/Admins.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/:id/edit" element={<ProductForm />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/banners" element={<Banners />} />
        <Route path="/popups" element={<Popups />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/prescriptions" element={<Prescriptions />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/refills" element={<Refills />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/support-chats" element={<SupportChats />} />
        <Route path="/admins" element={<Admins />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
