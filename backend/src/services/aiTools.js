export const tools = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: '根据关键词搜索商品，支持分类和价格筛选。如果用户提到"电子产品"、"服装"、"家居"等分类名称，请将其作为keyword参数传递进行搜索。搜索会同时匹配商品标题、描述以及分类名称。',
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: '搜索关键词，可以是商品名称、描述或分类名称，如"耳机"、"T恤"、"电子产品"、"家居"'
          },
          categoryId: {
            type: 'integer',
            description: '分类ID（可选）：1=电子产品，2=服装，3=家居'
          },
          minPrice: {
            type: 'number',
            description: '最低价格（可选）'
          },
          maxPrice: {
            type: 'number',
            description: '最高价格（可选）'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_product_detail',
      description: '根据商品ID获取商品详细信息',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'integer',
            description: '商品ID'
          }
        },
        required: ['productId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_to_cart',
      description: '将商品添加到购物车。支持通过productId、索引或商品名称/关键词添加（优先级从高到低）。索引是指上一次search_products返回的商品列表中的位置，从1开始。如果提供索引或名称，会先查找对应的商品。',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'integer',
            description: '商品ID（首选方式）'
          },
          index: {
            type: 'integer',
            description: '商品索引（来自上一次搜索结果，从1开始，可选）'
          },
          productName: {
            type: 'string',
            description: '商品名称或关键词（可选，会在搜索结果或购物车中模糊匹配）'
          },
          quantity: {
            type: 'integer',
            description: '数量（默认1）'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_cart',
      description: '获取当前用户的购物车列表及商品详情，包含购物车项ID、商品名称、数量、价格等。',
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
      name: 'update_cart_item',
      description: '修改购物车中商品的数量或选中状态。支持通过cartItemId、索引或商品名称/关键词修改（优先级从高到低）。索引是指上一次get_cart返回的商品列表中的位置，从1开始。',
      parameters: {
        type: 'object',
        properties: {
          cartItemId: {
            type: 'integer',
            description: '购物车项ID（首选方式）'
          },
          index: {
            type: 'integer',
            description: '商品索引（来自上一次get_cart结果，从1开始，可选）'
          },
          productName: {
            type: 'string',
            description: '商品名称或关键词（可选，会在购物车中模糊匹配）'
          },
          quantity: {
            type: 'integer',
            description: '新的数量（可选）'
          },
          selected: {
            type: 'boolean',
            description: '是否选中（可选）'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'remove_from_cart',
      description: '从购物车中删除指定商品。支持通过cartItemId、索引或商品名称/关键词删除（优先级从高到低）。索引是指上一次get_cart返回的商品列表中的位置，从1开始。',
      parameters: {
        type: 'object',
        properties: {
          cartItemId: {
            type: 'integer',
            description: '购物车项ID（首选方式）'
          },
          index: {
            type: 'integer',
            description: '商品索引（来自上一次get_cart结果，从1开始，可选）'
          },
          productName: {
            type: 'string',
            description: '商品名称或关键词（可选，会在购物车中模糊匹配）'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_order',
      description: '从购物车创建订单。如果未指定addressId，会自动选择默认地址。',
      parameters: {
        type: 'object',
        properties: {
          addressId: {
            type: 'integer',
            description: '收货地址ID（可选，不提供则使用默认地址）'
          },
          useDefaultAddress: {
            type: 'boolean',
            description: '是否使用默认地址（可选，true则使用默认地址）'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_my_orders',
      description: '获取当前用户的所有订单列表',
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
      name: 'cancel_order',
      description: '取消指定订单（仅限待付款或已付款状态）',
      parameters: {
        type: 'object',
        properties: {
          orderId: {
            type: 'integer',
            description: '订单ID'
          }
        },
        required: ['orderId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_addresses',
      description: '获取当前用户的收货地址列表，默认地址会高亮显示',
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
      name: 'add_address',
      description: '新增收货地址',
      parameters: {
        type: 'object',
        properties: {
          receiver_name: {
            type: 'string',
            description: '收货人姓名'
          },
          phone: {
            type: 'string',
            description: '联系电话'
          },
          province: {
            type: 'string',
            description: '省份'
          },
          city: {
            type: 'string',
            description: '城市'
          },
          district: {
            type: 'string',
            description: '区县'
          },
          detail: {
            type: 'string',
            description: '详细地址'
          },
          is_default: {
            type: 'boolean',
            description: '是否设为默认地址（可选，默认false）'
          }
        },
        required: ['receiver_name', 'phone', 'province', 'city', 'district', 'detail']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_address',
      description: '修改指定收货地址',
      parameters: {
        type: 'object',
        properties: {
          addressId: {
            type: 'integer',
            description: '地址ID'
          },
          receiver_name: {
            type: 'string',
            description: '收货人姓名（可选）'
          },
          phone: {
            type: 'string',
            description: '联系电话（可选）'
          },
          province: {
            type: 'string',
            description: '省份（可选）'
          },
          city: {
            type: 'string',
            description: '城市（可选）'
          },
          district: {
            type: 'string',
            description: '区县（可选）'
          },
          detail: {
            type: 'string',
            description: '详细地址（可选）'
          },
          is_default: {
            type: 'boolean',
            description: '是否设为默认地址（可选）'
          }
        },
        required: ['addressId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_address',
      description: '删除指定收货地址',
      parameters: {
        type: 'object',
        properties: {
          addressId: {
            type: 'integer',
            description: '地址ID'
          }
        },
        required: ['addressId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_user_info',
      description: '获取当前登录用户的个人信息（用户名、邮箱、手机号、头像等）',
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
      name: 'update_user_info',
      description: '修改当前用户的个人信息',
      parameters: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: '邮箱（可选）'
          },
          phone: {
            type: 'string',
            description: '手机号（可选）'
          },
          avatar: {
            type: 'string',
            description: '头像URL（可选）'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'change_password',
      description: '修改当前用户的密码',
      parameters: {
        type: 'object',
        properties: {
          oldPassword: {
            type: 'string',
            description: '旧密码'
          },
          newPassword: {
            type: 'string',
            description: '新密码（至少6位）'
          }
        },
        required: ['oldPassword', 'newPassword']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_promotions',
      description: '获取当前所有有效的促销活动列表',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  }
]
