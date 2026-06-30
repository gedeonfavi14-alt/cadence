import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';

// Layouts
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';
import Stats from './pages/Stats';
import Menu from './pages/Menu';
import AddEditDish from './pages/AddEditDish';
import Profile from './pages/Profile';
import QRCodePage from './pages/QRCode';
import CustomerMenu from './pages/CustomerMenu';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-primary">
        <div className="w-10 h-10 border-4 border-olive border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Client Route - Public */}
      <Route path="/menu/:restaurantId" element={<CustomerMenu />} />

      {/* Protected Restaurant Routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/orders" replace />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/menu-manage" element={<Menu />} />
        <Route path="/menu-manage/add" element={<AddEditDish />} />
        <Route path="/menu-manage/edit/:id" element={<AddEditDish />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/qrcode" element={<QRCodePage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
