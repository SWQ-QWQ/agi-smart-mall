<template>
  <div class="admin-layout">
    <header class="admin-header">
      <div class="header-content">
        <div class="logo">
          <h2>🏪 AGI商城后台</h2>
        </div>
        <div class="user-info">
          <span>{{ adminStore.admin?.username || '管理员' }}</span>
          <button @click="logout" class="logout-btn">退出</button>
        </div>
      </div>
    </header>
    
    <div class="admin-main">
      <aside class="admin-sidebar">
        <nav>
          <router-link to="/admin/dashboard" class="nav-item" active-class="active">
            📊 数据概览
          </router-link>
          <router-link to="/admin/products" class="nav-item" active-class="active">
            📦 商品管理
          </router-link>
          <router-link to="/admin/orders" class="nav-item" active-class="active">
            🛒 订单管理
          </router-link>
          <router-link to="/admin/users" class="nav-item" active-class="active">
            👥 用户管理
          </router-link>
          <router-link to="/admin/categories" class="nav-item" active-class="active">
            📂 分类管理
          </router-link>
          <router-link to="/admin/settings" class="nav-item" active-class="active">
            ⚙️ 系统设置
          </router-link>
        </nav>
      </aside>
      
      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

const router = useRouter()
const adminStore = useAdminStore()

const logout = () => {
  adminStore.logout()
  router.push('/admin/login')
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #f5f5f5;
}

.admin-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header-content {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.logo h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logout-btn {
  padding: 6px 16px;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: rgba(255,255,255,0.3);
}

.admin-main {
  display: flex;
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
  gap: 20px;
}

.admin-sidebar {
  width: 220px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 15px 0;
  flex-shrink: 0;
}

.admin-sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nav-item {
  padding: 12px 20px;
  color: #666;
  text-decoration: none;
  transition: all 0.3s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: #f0f0f0;
  color: #667eea;
}

.nav-item.active {
  background: #f0f5ff;
  color: #667eea;
  border-left-color: #667eea;
  font-weight: 500;
}

.admin-content {
  flex: 1;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 25px;
  min-height: calc(100vh - 140px);
}
</style>