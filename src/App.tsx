import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './store/StoreContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BillsList from './pages/BillsList';
import BillItemDetail from './pages/BillItemDetail';
import BillItemForm from './pages/BillItemForm';
import PaymentMethods from './pages/PaymentMethods';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <StoreProvider>
      <AppWithStore />
    </StoreProvider>
  );
}

function AppWithStore() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bills" element={<BillsList />} />
          <Route path="/bills/add" element={<BillItemForm />} />
          <Route path="/bills/:id" element={<BillItemDetail />} />
          <Route path="/bills/:id/edit" element={<BillItemForm />} />
          <Route path="/payment-methods" element={<PaymentMethods />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
