import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  
  // Không hiển thị Header/Footer cho trang login và admin
  const hideLayout = location.pathname === '/login' || location.pathname.startsWith('/admin');

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <div style={{ 
      background: 'var(--bg-color)', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
