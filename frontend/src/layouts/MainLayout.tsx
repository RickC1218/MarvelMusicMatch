import { Outlet } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';

const MainLayout = () => (
  <div className="flex min-h-screen flex-col bg-background font-poppins text-primary">
    <Header />
    <main className="flex-grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default MainLayout;
