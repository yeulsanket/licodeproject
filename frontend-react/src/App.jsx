import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import Login from './pages/Login';
import MainApp from './pages/MainApp';
import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<MainApp />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0d1220',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#f0f4ff',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.88rem',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#fb7185', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  );
}
