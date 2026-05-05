# AGI赋能全栈智能商城

基于前后端分离与AGI赋能的现代化技术体系设计的智能电商平台。

## 项目背景

传统电商平台面临用户体验单一、交互方式有限等挑战，本项目通过引入AGI（通用人工智能）能力，实现从被动响应到主动执行的跨越，构建真正智能的商城交互体验。

## 核心定位

- 基础商城全链路功能：用户体系、商品展示、交易管理
- AGI智能交互核心：自然语言控制、智能导购、7x24小时客服
- 技术架构：前后端分离，模块化设计，高可扩展性

## 技术栈

### 前端技术栈
- Vue 3 (Composition API)
- TailwindCSS
- Vue Router
- Pinia
- Axios

### 后端技术栈
- Node.js
- Express
- MySQL
- Pinecone/Chroma (向量数据库)

## 项目结构

```
agi-smart-mall/
├── frontend/          # 前端项目
│   ├── public/        # 静态资源
│   ├── src/
│   │   ├── api/       # API接口
│   │   ├── assets/    # 资源文件
│   │   ├── components/# 公共组件
│   │   ├── layouts/   # 布局组件
│   │   ├── router/    # 路由配置
│   │   ├── stores/    # 状态管理
│   │   ├── utils/     # 工具函数
│   │   ├── views/     # 页面视图
│   │   ├── App.vue    # 根组件
│   │   └── main.js    # 入口文件
│   ├── package.json
│   └── vite.config.js
├── backend/           # 后端项目
│   ├── src/
│   │   ├── config/    # 配置文件
│   │   ├── controllers/# 控制器
│   │   ├── middleware/# 中间件
│   │   ├── models/    # 数据模型
│   │   ├── routes/    # 路由
│   │   ├── services/  # 业务服务
│   │   └── index.js   # 入口文件
│   ├── package.json
│   └── ...
└── README.md
```

## 快速开始

### 安装依赖
```bash
npm run install:all
```

### 开发模式
```bash
# 同时启动前后端
npm run dev

# 或分别启动
npm run dev:frontend
npm run dev:backend
```

### 生产构建
```bash
npm run build
```

## 核心功能

### 基础商城功能
- 用户注册登录、个人中心管理
- 多级分类筛选、商品详情展示
- 购物车结算、订单全流程追踪

### AGI智能功能
- 自然语言全流程控制
- 智能导购与场景推荐
- 7x24小时智能客服
- 购物全周期陪伴

## 开发实施里程碑

1. **第一阶段（1-2周）**：全栈基础搭建
2. **第二阶段（2-3周）**：AGI能力集成
3. **第三阶段（1周）**：联调优化上线

## 许可证

MIT
