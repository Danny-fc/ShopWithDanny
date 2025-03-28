import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertCartItemSchema, insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Products routes
  app.get("/api/products", async (req, res) => {
    const { 
      category, 
      featured, 
      page = '1', 
      limit = '12',
      search,
      sort
    } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;
    
    const products = await storage.getProducts({
      categoryId: category ? parseInt(category as string, 10) : undefined,
      featured: featured === 'true',
      offset,
      limit: limitNum,
      search: search as string,
      sort: sort as string
    });
    
    const total = await storage.getProductCount({
      categoryId: category ? parseInt(category as string, 10) : undefined,
      search: search as string
    });
    
    const totalPages = Math.ceil(total / limitNum);
    
    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  });
  
  app.get("/api/products/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const product = await storage.getProduct(id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json(product);
  });
  
  // Categories routes
  app.get("/api/categories", async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });
  
  // Cart routes
  app.get("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const cartItems = await storage.getCartItems(req.user!.id);
    res.json(cartItems);
  });
  
  app.post("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const validatedData = insertCartItemSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const cartItem = await storage.addCartItem(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Something went wrong" });
    }
  });
  
  app.put("/api/cart/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const id = parseInt(req.params.id, 10);
    const { quantity } = req.body;
    
    if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({ message: "Invalid quantity" });
    }
    
    const updatedItem = await storage.updateCartItem(id, quantity);
    
    if (!updatedItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    
    res.json(updatedItem);
  });
  
  app.delete("/api/cart/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const id = parseInt(req.params.id, 10);
    await storage.removeCartItem(id);
    
    res.status(204).send();
  });
  
  app.delete("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    await storage.clearCart(req.user!.id);
    res.status(204).send();
  });
  
  // Orders routes
  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { orderData, items } = req.body;
      
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Order must contain items" });
      }
      
      const validatedOrderData = insertOrderSchema.parse({
        ...orderData,
        userId: req.user!.id
      });
      
      const validatedItems = items.map(item => 
        insertOrderItemSchema.parse(item)
      );
      
      const order = await storage.createOrder(validatedOrderData, validatedItems);
      
      // Clear the cart after successful order
      await storage.clearCart(req.user!.id);
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Something went wrong" });
    }
  });
  
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const orders = await storage.getOrders(req.user!.id);
    res.json(orders);
  });
  
  app.get("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const id = parseInt(req.params.id, 10);
    const order = await storage.getOrder(id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    if (order.userId !== req.user!.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    res.json(order);
  });

  const httpServer = createServer(app);

  return httpServer;
}
