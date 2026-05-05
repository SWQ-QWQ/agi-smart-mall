import { createRouter, createWebHistory } from 'vue-router'
import UserLayout from '@/layouts/UserLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { useAdminStore } from '@/stores/admin'
import { useUserStore } from '@/stores/user'

const routes = [
  // User Routes
  {
    path: '/',
    component: UserLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/user/Home.vue')
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/user/ProductList.vue')
      },
      {
        path: 'product/:id',
        name: 'ProductDetail',
        component: () => import('@/views/user/ProductDetail.vue')
      },
      {
        path: 'announcements',
        name: 'Announcements',
        component: () => import('@/views/user/Announcements.vue')
      },
      {
        path: 'promotions',
        name: 'Promotions',
        component: () => import('@/views/user/Promotions.vue')
      },
      {
        path: 'cart',
        name: 'Cart',
        component: () => import('@/views/user/Cart.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'checkout',
        name: 'Checkout',
        component: () => import('@/views/user/Checkout.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'payment/:id',
        name: 'Payment',
        component: () => import('@/views/user/Payment.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/user/Orders.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'order/:id',
        name: 'OrderDetail',
        component: () => import('@/views/user/OrderDetail.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'address',
        name: 'Address',
        component: () => import('@/views/user/Address.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'addresses',
        name: 'Addresses',
        component: () => import('@/views/user/Address.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'favorites',
        name: 'Favorites',
        component: () => import('@/views/user/Favorites.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/user/Profile.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'hot',
        name: 'HotProducts',
        component: () => import('@/views/user/HotProducts.vue')
      },
      {
        path: 'new',
        name: 'NewProducts',
        component: () => import('@/views/user/NewProducts.vue')
      },
      {
        path: 'recommend',
        name: 'RecommendProducts',
        component: () => import('@/views/user/RecommendProducts.vue')
      },
      {
        path: 'flash-sale',
        name: 'FlashSale',
        component: () => import('@/views/user/FlashSale.vue')
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/user/Login.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/user/Register.vue'),
    meta: { guestOnly: true }
  },
  
  // Admin Routes
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/admin/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: 'dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue')
      },
      {
        path: 'products',
        name: 'AdminProducts',
        component: () => import('@/views/admin/Products.vue')
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: () => import('@/views/admin/Orders.vue')
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: () => import('@/views/admin/Categories.vue')
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('@/views/admin/Settings.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const adminStore = useAdminStore()
  const userStore = useUserStore()

  // Initialize stores from localStorage
  if (!adminStore.isAuthenticated) {
    adminStore.initFromStorage()
  }
  if (!userStore.isAuthenticated) {
    userStore.initFromStorage()
  }

  // Admin Auth
  if (to.meta.requiresAdmin && !adminStore.isAuthenticated) {
    next('/admin/login')
  } else if (to.meta.requiresGuest && adminStore.isAuthenticated) {
    next('/admin/dashboard')
  }
  // User Auth
  else if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if (to.meta.guestOnly && userStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
