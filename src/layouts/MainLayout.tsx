import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface MainLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  showHeader = true, 
  showFooter = true,
  className = ""
}) => {
  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      {showHeader && <Header />}
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
};

export default MainLayout;