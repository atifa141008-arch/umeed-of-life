import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Layout from './components/Layout'
import MarketplaceLayout from './components/MarketplaceLayout'
import VendorShell from './components/VendorShell'
import RequireRole from './components/RequireRole'
import { CENTRAL_ROLES, MARKET_STAFF_ROLES } from './lib/format'
import { departments } from './data/site'
import { SiteProvider } from './context/SiteContext'
import { PermissionsProvider } from './context/PermissionsContext'
import { ToastProvider } from './components/Toast'
import { MODULES } from './lib/permissions'
import { PAGES, ModuleGuard } from './pages/management/modules'
import BannersAdmin from './pages/management/BannersAdmin'

import Home from './pages/Home'
import About from './pages/About'
import Departments from './pages/Departments'
import DepartmentPage from './pages/DepartmentPage'
import Impact from './pages/Impact'
import Careers from './pages/Careers'
import News from './pages/News'
import Contact from './pages/Contact'
import ManagementLogin from './pages/ManagementLogin'
import NotFound from './pages/NotFound'
import MarketNotFound from './components/MarketNotFound'
import ManagementLayout from './pages/management/ManagementLayout'

import MHome from './pages/marketplace/MHome'
import Categories from './pages/marketplace/Categories'
import Shop from './pages/marketplace/Shop'
import Product from './pages/marketplace/Product'
import Vendors from './pages/marketplace/Vendors'
import MAbout from './pages/marketplace/About'
import Policy from './pages/marketplace/Policy'
import Cart from './pages/marketplace/Cart'
import Checkout from './pages/marketplace/Checkout'
import Account from './pages/marketplace/Account'
import MarketLogin from './pages/marketplace/MarketLogin'

import AdminLayout from './pages/admin/AdminLayout'
import Applications from './pages/admin/Applications'
import AVendors from './pages/admin/AVendors'
import AProducts from './pages/admin/AProducts'
import AOrders from './pages/admin/AOrders'
import ACategories from './pages/admin/ACategories'

import VendorInfo from './pages/vendor/VendorInfo'
import Apply from './pages/vendor/Apply'
import ApplicationStatus from './pages/vendor/ApplicationStatus'
import VendorLogin from './pages/vendor/VendorLogin'
import VendorLayout from './pages/vendor/dashboard/VendorLayout'
import VOverview from './pages/vendor/dashboard/VOverview'
import VProducts from './pages/vendor/dashboard/VProducts'
import VOrders from './pages/vendor/dashboard/VOrders'
import VFinance from './pages/vendor/dashboard/VFinance'
import VStore from './pages/vendor/dashboard/VStore'

const M_LOGIN = '/marketplace/login'
const V_LOGIN = '/marketplace/vendor/login'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SiteProvider>
        <PermissionsProvider>
        <ToastProvider>
        <CartProvider>
          <Routes>
            {/* ===== Central website ===== */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/departments" element={<Departments />} />
              {departments.filter((d) => d.slug !== 'marketplace').map((d) => (
                <Route key={d.slug} path={`/${d.slug}`} element={<DepartmentPage slug={d.slug} />} />
              ))}
              <Route path="/impact" element={<Impact />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/news" element={<News />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/management/login" element={<ManagementLogin />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* ===== Central management dashboard (full screen, no public header/footer) ===== */}
            <Route path="/management" element={<RequireRole roles={CENTRAL_ROLES} loginPath="/management/login"><ManagementLayout /></RequireRole>}>
              {MODULES.map((m) => {
                const Page = PAGES[m.key]
                return <Route key={m.key} index={m.path === ''} path={m.path || undefined} element={<ModuleGuard module={m.key}><Page /></ModuleGuard>} />
              })}
            </Route>

            {/* ===== Vendor area: /marketplace/vendor (not linked from the shopping pages) ===== */}
            <Route path="/marketplace/vendor" element={<VendorShell />}>
              <Route index element={<VendorInfo />} />
              <Route path="apply" element={<Apply />} />
              <Route path="login" element={<VendorLogin />} />
              <Route path="application-status" element={<RequireRole roles={['applicant', 'vendor']} loginPath={V_LOGIN}><ApplicationStatus /></RequireRole>} />
              <Route path="dashboard" element={<RequireRole roles={['vendor']} loginPath={V_LOGIN}><VendorLayout /></RequireRole>}>
                <Route index element={<VOverview />} />
                <Route path="products" element={<VProducts />} />
                <Route path="orders" element={<VOrders />} />
                <Route path="finance" element={<VFinance />} />
                <Route path="store" element={<VStore />} />
              </Route>
              <Route path="*" element={<MarketNotFound home="/marketplace/vendor" label="Back to vendor page" />} />
            </Route>

            {/* ===== Marketplace (shopping only) ===== */}
            <Route path="/marketplace" element={<MarketplaceLayout />}>
              <Route index element={<MHome />} />
              <Route path="categories" element={<Categories />} />
              <Route path="shop" element={<Shop />} />
              <Route path="product/:slug" element={<Product />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="about" element={<MAbout />} />
              <Route path="cart" element={<Cart />} />
              <Route path="returns" element={<Policy kind="returns" />} />
              <Route path="terms" element={<Policy kind="terms" />} />
              <Route path="privacy" element={<Policy kind="privacy" />} />
              <Route path="login" element={<MarketLogin />} />
              <Route path="checkout" element={<RequireRole roles={['customer']} loginPath={M_LOGIN}><Checkout /></RequireRole>} />
              <Route path="account" element={<RequireRole roles={['customer']} loginPath={M_LOGIN}><Account /></RequireRole>} />
              <Route path="admin" element={<RequireRole roles={MARKET_STAFF_ROLES} loginPath={M_LOGIN}><AdminLayout /></RequireRole>}>
                <Route index element={<ModuleGuard module="mp_applications"><Applications /></ModuleGuard>} />
                <Route path="vendors" element={<ModuleGuard module="mp_vendors"><AVendors /></ModuleGuard>} />
                <Route path="products" element={<ModuleGuard module="mp_products"><AProducts /></ModuleGuard>} />
                <Route path="orders" element={<ModuleGuard module="mp_orders"><AOrders /></ModuleGuard>} />
                <Route path="categories" element={<ModuleGuard module="mp_categories"><ACategories /></ModuleGuard>} />
                <Route path="banners" element={<ModuleGuard module="banners"><BannersAdmin /></ModuleGuard>} />
              </Route>
              <Route path="*" element={<MarketNotFound />} />
            </Route>
          </Routes>
        </CartProvider>
        </ToastProvider>
        </PermissionsProvider>
        </SiteProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
