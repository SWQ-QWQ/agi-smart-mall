export const adminTools = [
  {
    type: 'function',
    function: {
      name: 'get_dashboard_stats',
      description: '获取仪表盘统计数据，包括总用户数、总商品数、总订单数、今日订单数、销售额等',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: '搜索商品，返回客观数据（名称、价格、库存、状态、销量），用于商品管理',
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: '搜索关键词（商品名称或描述）'
          },
          categoryId: {
            type: 'integer',
            description: '分类ID筛选'
          },
          status: {
            type: 'string',
            description: '商品状态筛选（active/inactive）'
          },
          minPrice: {
            type: 'number',
            description: '最低价格'
          },
          maxPrice: {
            type: 'number',
            description: '最高价格'
          },
          page: {
            type: 'integer',
            description: '页码（默认1）'
          },
          limit: {
            type: 'integer',
            description: '每页数量（默认10）'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_users',
      description: '分页查看用户列表，支持搜索关键词（用户名、邮箱）和状态筛选',
      parameters: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            description: '页码（默认1）'
          },
          limit: {
            type: 'integer',
            description: '每页数量（默认10）'
          },
          keyword: {
            type: 'string',
            description: '搜索关键词（用户名或邮箱）'
          },
          status: {
            type: 'string',
            description: '用户状态筛选（active/banned）'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'toggle_user_status',
      description: '封禁或启用用户（需要二次确认）',
      parameters: {
        type: 'object',
        properties: {
          userId: {
            type: 'integer',
            description: '用户ID'
          },
          status: {
            type: 'string',
            description: '目标状态（active或banned）'
          },
          confirm: {
            type: 'boolean',
            description: '是否确认操作（true表示已确认）'
          }
        },
        required: ['userId', 'status']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_all_orders',
      description: '查看所有用户订单，支持按状态筛选',
      parameters: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            description: '页码（默认1）'
          },
          limit: {
            type: 'integer',
            description: '每页数量（默认10）'
          },
          status: {
            type: 'string',
            description: '订单状态筛选（pending/paid/shipped/completed/cancelled）'
          },
          keyword: {
            type: 'string',
            description: '搜索关键词（订单号或用户名）'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_order_status',
      description: '修改订单状态（发货、完成等）',
      parameters: {
        type: 'object',
        properties: {
          orderId: {
            type: 'integer',
            description: '订单ID'
          },
          status: {
            type: 'string',
            description: '目标状态（paid/shipped/completed/cancelled）'
          },
          trackingNo: {
            type: 'string',
            description: '物流单号（发货时填写）'
          }
        },
        required: ['orderId', 'status']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_product',
      description: '添加新商品',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: '商品名称'
          },
          description: {
            type: 'string',
            description: '商品描述'
          },
          price: {
            type: 'number',
            description: '商品价格'
          },
          stock: {
            type: 'integer',
            description: '库存数量'
          },
          categoryId: {
            type: 'integer',
            description: '分类ID'
          },
          image: {
            type: 'string',
            description: '商品图片URL（可选）'
          }
        },
        required: ['title', 'price', 'stock', 'categoryId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'edit_product',
      description: '编辑商品信息（价格、库存、状态等）',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'integer',
            description: '商品ID'
          },
          title: {
            type: 'string',
            description: '商品名称（可选）'
          },
          description: {
            type: 'string',
            description: '商品描述（可选）'
          },
          price: {
            type: 'number',
            description: '商品价格（可选）'
          },
          stock: {
            type: 'integer',
            description: '库存数量（可选）'
          },
          categoryId: {
            type: 'integer',
            description: '分类ID（可选）'
          },
          status: {
            type: 'string',
            description: '商品状态（active/inactive，可选）'
          }
        },
        required: ['productId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_product',
      description: '删除商品（需要二次确认）',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'integer',
            description: '商品ID'
          },
          confirm: {
            type: 'boolean',
            description: '是否确认操作（true表示已确认）'
          }
        },
        required: ['productId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_category_stats',
      description: '查看各分类商品数量统计',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_sales_stats',
      description: '获取销售统计数据，包括近期订单数量、销售额、热销商品Top5等',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'integer',
            description: '统计天数（默认30天）'
          }
        },
        required: []
      }
    }
  }
]
