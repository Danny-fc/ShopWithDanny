import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct,
  categories, type Category, type InsertCategory,
  cartItems, type CartItem, type InsertCartItem,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product methods
  getProduct(id: number): Promise<Product | undefined>;
  getProducts(options?: { 
    categoryId?: number; 
    featured?: boolean; 
    limit?: number; 
    offset?: number;
    search?: string;
    sort?: string;
  }): Promise<Product[]>;
  getProductCount(options?: { 
    categoryId?: number; 
    search?: string; 
  }): Promise<number>;
  
  // Category methods
  getCategory(id: number): Promise<Category | undefined>;
  getCategories(): Promise<Category[]>;
  
  // Cart methods
  getCartItems(userId: number): Promise<(CartItem & { product: Product })[]>;
  getCartItem(userId: number, productId: number): Promise<CartItem | undefined>;
  addCartItem(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeCartItem(id: number): Promise<void>;
  clearCart(userId: number): Promise<void>;
  
  // Order methods
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrders(userId: number): Promise<Order[]>;
  getOrder(id: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private categories: Map<number, Category>;
  private cartItems: Map<number, CartItem>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  
  sessionStore: session.SessionStore;
  
  // Track current IDs for auto-increment
  private userId = 1;
  private productId = 1;
  private categoryId = 1;
  private cartItemId = 1;
  private orderId = 1;
  private orderItemId = 1;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.categories = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Seed initial data
    this.seedData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }
  
  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async getProducts(options?: { 
    categoryId?: number; 
    featured?: boolean; 
    limit?: number; 
    offset?: number;
    search?: string;
    sort?: string;
  }): Promise<Product[]> {
    let results = Array.from(this.products.values());
    
    // Apply filters
    if (options?.categoryId) {
      results = results.filter(p => p.categoryId === options.categoryId);
    }
    
    if (options?.featured) {
      results = results.filter(p => p.isFeatured);
    }
    
    if (options?.search) {
      const search = options.search.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.description.toLowerCase().includes(search)
      );
    }
    
    // Apply sorting
    if (options?.sort) {
      switch (options.sort) {
        case 'price-asc':
          results.sort((a, b) => Number(a.price) - Number(b.price));
          break;
        case 'price-desc':
          results.sort((a, b) => Number(b.price) - Number(a.price));
          break;
        case 'newest':
          results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'rating':
          results.sort((a, b) => Number(b.rating) - Number(a.rating));
          break;
        default:
          // Default sort by id
          results.sort((a, b) => a.id - b.id);
      }
    }
    
    // Apply pagination
    if (options?.offset !== undefined && options?.limit !== undefined) {
      results = results.slice(options.offset, options.offset + options.limit);
    }
    
    return results;
  }
  
  async getProductCount(options?: { 
    categoryId?: number; 
    search?: string; 
  }): Promise<number> {
    let count = this.products.size;
    
    if (options?.categoryId || options?.search) {
      let filteredProducts = Array.from(this.products.values());
      
      if (options.categoryId) {
        filteredProducts = filteredProducts.filter(p => p.categoryId === options.categoryId);
      }
      
      if (options.search) {
        const search = options.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(search) || 
          p.description.toLowerCase().includes(search)
        );
      }
      
      count = filteredProducts.length;
    }
    
    return count;
  }
  
  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  // Cart methods
  async getCartItems(userId: number): Promise<(CartItem & { product: Product })[]> {
    const items = Array.from(this.cartItems.values())
      .filter(item => item.userId === userId);
      
    return await Promise.all(items.map(async item => {
      const product = await this.getProduct(item.productId);
      return {
        ...item,
        product: product!
      };
    }));
  }
  
  async getCartItem(userId: number, productId: number): Promise<CartItem | undefined> {
    return Array.from(this.cartItems.values())
      .find(item => item.userId === userId && item.productId === productId);
  }
  
  async addCartItem(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if this product is already in the cart
    const existingItem = await this.getCartItem(
      insertCartItem.userId, 
      insertCartItem.productId
    );
    
    if (existingItem) {
      // If it exists, update the quantity
      const updatedItem = { 
        ...existingItem, 
        quantity: existingItem.quantity + insertCartItem.quantity 
      };
      this.cartItems.set(existingItem.id, updatedItem);
      return updatedItem;
    }
    
    // Otherwise create a new cart item
    const id = this.cartItemId++;
    const cartItem: CartItem = { ...insertCartItem, id };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }
  
  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) return undefined;
    
    const updatedItem = { ...cartItem, quantity };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async removeCartItem(id: number): Promise<void> {
    this.cartItems.delete(id);
  }
  
  async clearCart(userId: number): Promise<void> {
    const userCartItems = Array.from(this.cartItems.values())
      .filter(item => item.userId === userId);
      
    for (const item of userCartItems) {
      this.cartItems.delete(item.id);
    }
  }
  
  // Order methods
  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const id = this.orderId++;
    const now = new Date();
    
    const order: Order = {
      ...orderData,
      id,
      createdAt: now
    };
    
    this.orders.set(id, order);
    
    // Add order items
    for (const item of items) {
      const orderItemId = this.orderItemId++;
      const orderItem: OrderItem = {
        ...item,
        id: orderItemId,
        orderId: id
      };
      this.orderItems.set(orderItemId, orderItem);
    }
    
    return order;
  }
  
  async getOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getOrder(id: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const orderItems = Array.from(this.orderItems.values())
      .filter(item => item.orderId === id);
      
    const itemsWithProducts = await Promise.all(orderItems.map(async item => {
      const product = await this.getProduct(item.productId);
      return {
        ...item,
        product: product!
      };
    }));
    
    return {
      ...order,
      items: itemsWithProducts
    };
  }
  
  // Seed initial data
  private seedData() {
    // Seed categories
    const categoryData: InsertCategory[] = [
      { name: 'Electronics', icon: 'laptop' },
      { name: 'Clothing', icon: 'tshirt' },
      { name: 'Home & Kitchen', icon: 'home' },
      { name: 'Beauty', icon: 'spa' },
      { name: 'Sports', icon: 'running' }
    ];
    
    for (const category of categoryData) {
      const id = this.categoryId++;
      this.categories.set(id, { ...category, id });
    }
    
    // Seed products
    const productData: InsertProduct[] = [
      {
        name: 'Wireless Headphones',
        description: 'Premium sound quality with noise cancellation',
        price: '129.99',
        oldPrice: '159.99',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        categoryId: 1,
        rating: '4.5',
        reviews: 128,
        inStock: true,
        isNew: true,
        isFeatured: true,
        isPopular: false,
        isSale: false,
        createdAt: new Date('2023-03-01')
      },
      {
        name: 'Smart Watch Series 5',
        description: 'Fitness tracking with heart rate monitor',
        price: '89.99',
        oldPrice: '119.99',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1399&q=80',
        categoryId: 1,
        rating: '4.0',
        reviews: 96,
        inStock: true,
        isNew: false,
        isFeatured: true,
        isPopular: false,
        isSale: true,
        createdAt: new Date('2023-02-15')
      },
      {
        name: 'Slim Fit Dress Shirt',
        description: '100% cotton, wrinkle-resistant fabric',
        price: '49.99',
        oldPrice: null,
        imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        categoryId: 2,
        rating: '4.9',
        reviews: 215,
        inStock: true,
        isNew: false,
        isFeatured: true,
        isPopular: false,
        isSale: false,
        createdAt: new Date('2023-01-20')
      },
      {
        name: 'Urban Runner Sneakers',
        description: 'Lightweight with cushioned insole',
        price: '79.99',
        oldPrice: '99.99',
        imageUrl: 'https://images.unsplash.com/photo-1525904097878-94fb15835963?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        categoryId: 2,
        rating: '4.2',
        reviews: 175,
        inStock: true,
        isNew: false,
        isFeatured: true,
        isPopular: true,
        isSale: false,
        createdAt: new Date('2023-02-01')
      },
      {
        name: 'Designer Sunglasses',
        description: 'UV protection with stylish frame',
        price: '59.99',
        oldPrice: null,
        imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1160&q=80',
        categoryId: 2,
        rating: '4.0',
        reviews: 88,
        inStock: true,
        isNew: true,
        isFeatured: false,
        isPopular: false,
        isSale: false,
        createdAt: new Date('2023-03-10')
      },
      {
        name: 'Outdoor Adventure Backpack',
        description: 'Durable, water-resistant design',
        price: '79.99',
        oldPrice: null,
        imageUrl: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1364&q=80',
        categoryId: 5,
        rating: '4.4',
        reviews: 112,
        inStock: true,
        isNew: true,
        isFeatured: false,
        isPopular: false,
        isSale: false,
        createdAt: new Date('2023-03-05')
      },
      {
        name: 'Smart Coffee Maker',
        description: 'Programmable with app control',
        price: '129.99',
        oldPrice: null,
        imageUrl: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        categoryId: 3,
        rating: '4.7',
        reviews: 143,
        inStock: true,
        isNew: true,
        isFeatured: false,
        isPopular: false,
        isSale: false,
        createdAt: new Date('2023-03-15')
      },
      {
        name: 'Performance Running Shoes',
        description: 'Lightweight with responsive cushioning',
        price: '119.99',
        oldPrice: null,
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        categoryId: 5,
        rating: '4.8',
        reviews: 201,
        inStock: true,
        isNew: true,
        isFeatured: false,
        isPopular: false,
        isSale: false,
        createdAt: new Date('2023-03-20')
      },
      {
        name: 'Premium Smartwatch',
        description: 'Health tracking with AMOLED display',
        price: '199.99',
        oldPrice: null,
        imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1064&q=80',
        categoryId: 1,
        rating: '4.9',
        reviews: 188,
        inStock: true,
        isNew: true,
        isFeatured: false,
        isPopular: false,
        isSale: false,
        createdAt: new Date('2023-03-25')
      },
      {
        name: 'Luxury Skincare Set',
        description: 'Organic ingredients, vegan-friendly',
        price: '89.99',
        oldPrice: null,
        imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1015&q=80',
        categoryId: 4,
        rating: '4.6',
        reviews: 156,
        inStock: true,
        isNew: true,
        isFeatured: false,
        isPopular: false,
        isSale: false,
        createdAt: new Date('2023-03-18')
      },
      {
        name: 'Aromatherapy Candle Set',
        description: 'Natural soy wax with essential oils',
        price: '39.99',
        oldPrice: null,
        imageUrl: 'https://images.unsplash.com/photo-1600086827875-a63b01f1335c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
        categoryId: 3,
        rating: '4.3',
        reviews: 124,
        inStock: true,
        isNew: true,
        isFeatured: false,
        isPopular: false,
        isSale: false,
        createdAt: new Date('2023-03-22')
      },
      {
        name: 'Waterproof Bluetooth Speaker',
        description: '24-hour battery with deep bass',
        price: '69.99',
        oldPrice: null,
        imageUrl: 'https://images.unsplash.com/photo-1585155770447-2f66e2a397b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1932&q=80',
        categoryId: 1,
        rating: '4.5',
        reviews: 134,
        inStock: true,
        isNew: true,
        isFeatured: false,
        isPopular: false,
        isSale: false,
        createdAt: new Date('2023-03-28')
      },
      // New Sports Products (Football cleats, jerseys, socks)
      {
        name: 'Pro Football Cleats',
        description: 'High traction, lightweight cleats for optimal performance on the field',
        price: '89.99',
        oldPrice: '119.99',
        imageUrl: 'https://m.media-amazon.com/images/I/71Z8tlCrM6L._AC_SL1500_.jpg',
        categoryId: 5,
        rating: '4.7',
        reviews: 156,
        inStock: true,
        isNew: true,
        isFeatured: true,
        isPopular: false,
        isSale: true,
        createdAt: new Date('2023-03-29')
      },
      {
        name: 'Team Football Jersey',
        description: 'Official team jersey with moisture-wicking technology',
        price: '69.99',
        oldPrice: null,
        imageUrl: 'https://printfactory.com.ng/wp-content/uploads/2018/12/original-club-jersey-print-printfactory-ng.png',
        categoryId: 5,
        rating: '4.5',
        reviews: 128,
        inStock: true,
        isNew: true,
        isFeatured: false,
        isPopular: true,
        isSale: false,
        createdAt: new Date('2023-03-30')
      },
      {
        name: 'Athletic Performance Socks',
        description: 'Cushioned, anti-blister socks for all sports',
        price: '14.99',
        oldPrice: '19.99',
        imageUrl: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        categoryId: 5,
        rating: '4.3',
        reviews: 98,
        inStock: true,
        isNew: false,
        isFeatured: false,
        isPopular: false,
        isSale: true,
        createdAt: new Date('2023-03-15')
      },
      // New Home & Kitchen Products (kitchen utensils)
      {
        name: 'Premium Knife Set',
        description: 'Professional grade stainless steel knife set with wooden block',
        price: '129.99',
        oldPrice: '159.99',
        imageUrl: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        categoryId: 3,
        rating: '4.8',
        reviews: 187,
        inStock: true,
        isNew: true,
        isFeatured: true,
        isPopular: false,
        isSale: true,
        createdAt: new Date('2023-03-25')
      },
      {
        name: 'Silicone Cooking Utensil Set',
        description: 'Heat-resistant, non-stick silicone utensils for everyday cooking',
        price: '34.99',
        oldPrice: null,
        imageUrl: 'https://images.unsplash.com/photo-1639544799091-1c1aeeff5553?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80',
        categoryId: 3,
        rating: '4.6',
        reviews: 134,
        inStock: true,
        isNew: false,
        isFeatured: false,
        isPopular: true,
        isSale: false,
        createdAt: new Date('2023-02-20')
      },
      {
        name: 'Digital Kitchen Scale',
        description: 'Precise measurements for all your cooking and baking needs',
        price: '19.99',
        oldPrice: '24.99',
        imageUrl: 'https://images.unsplash.com/photo-1558705438-2908eda7d172?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        categoryId: 3,
        rating: '4.4',
        reviews: 112,
        inStock: true,
        isNew: false,
        isFeatured: false,
        isPopular: false,
        isSale: true,
        createdAt: new Date('2023-01-15')
      },
      // New Clothing Products (plain t-shirts, joggers)
      {
        name: 'Essential Cotton T-Shirt',
        description: 'Soft, breathable 100% cotton t-shirt in a variety of colors',
        price: '19.99',
        oldPrice: null,
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1480&q=80',
        categoryId: 2,
        rating: '4.4',
        reviews: 245,
        inStock: true,
        isNew: false,
        isFeatured: false,
        isPopular: true,
        isSale: false,
        createdAt: new Date('2023-02-10')
      },
      {
        name: 'Comfort Fit Joggers',
        description: 'Casual, tapered joggers with elastic waistband and pockets',
        price: '39.99',
        oldPrice: '49.99',
        imageUrl: 'https://images.unsplash.com/photo-1515110371136-7e393289662c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1326&q=80',
        categoryId: 2,
        rating: '4.7',
        reviews: 178,
        inStock: true,
        isNew: true,
        isFeatured: true,
        isPopular: false,
        isSale: true,
        createdAt: new Date('2023-03-05')
      }
    ];
    
    for (const product of productData) {
      const id = this.productId++;
      this.products.set(id, { ...product, id });
    }
  }
}

export const storage = new MemStorage();
