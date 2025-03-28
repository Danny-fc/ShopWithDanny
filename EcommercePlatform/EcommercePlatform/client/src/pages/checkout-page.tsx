import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Loader2, CreditCard, Check } from "lucide-react";

// Form validation schema
const checkoutFormSchema = z.object({
  // Shipping information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required"),
  
  // Payment information
  paymentMethod: z.enum(["credit", "paypal", "bank"]),
  
  // Credit card fields (conditionally required)
  cardNumber: z.string().optional(),
  cardName: z.string().optional(),
  expMonth: z.string().optional(),
  expYear: z.string().optional(),
  cvv: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

// Steps of the checkout process
type CheckoutStep = "shipping" | "payment" | "review" | "confirmation";

const CheckoutPage = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("shipping");
  
  // Calculate order summary
  const subtotal = cartItems.reduce((total, item) => {
    return total + (Number(item.product.price) * item.quantity);
  }, 0);
  
  const shippingCost = subtotal > 0 ? 9.99 : 0;
  const taxRate = 0.08; // 8% tax
  const tax = subtotal * taxRate;
  const total = subtotal + shippingCost + tax;

  // Redirect if cart is empty
  if (cartItems.length === 0 && checkoutStep !== "confirmation") {
    navigate("/");
    return null;
  }
  
  // Form setup
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
      paymentMethod: "credit",
      cardNumber: "",
      cardName: "",
      expMonth: "",
      expYear: "",
      cvv: "",
    },
  });
  
  const watchPaymentMethod = form.watch("paymentMethod");
  
  // Handle form conditional validation
  const validatePaymentFields = (values: CheckoutFormValues) => {
    if (values.paymentMethod === "credit") {
      if (!values.cardNumber) return false;
      if (!values.cardName) return false;
      if (!values.expMonth) return false;
      if (!values.expYear) return false;
      if (!values.cvv) return false;
    }
    return true;
  };
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (formData: CheckoutFormValues) => {
      // Create order items from cart
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price
      }));
      
      // Calculate total
      const orderTotal = subtotal + shippingCost + tax;
      
      // Create order data
      const orderData = {
        total: orderTotal.toString(),
        status: "pending",
        userId: user!.id
      };
      
      // Submit order
      const response = await apiRequest("POST", "/api/orders", {
        orderData,
        items: orderItems
      });
      
      return await response.json();
    },
    onSuccess: () => {
      // Clear the cart and show confirmation
      clearCart();
      setCheckoutStep("confirmation");
    },
    onError: (error) => {
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "An error occurred during checkout",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission based on current step
  const onSubmit = (values: CheckoutFormValues) => {
    if (checkoutStep === "shipping") {
      setCheckoutStep("payment");
    } 
    else if (checkoutStep === "payment") {
      if (!validatePaymentFields(values)) {
        toast({
          title: "Payment information required",
          description: "Please fill in all payment fields",
          variant: "destructive",
        });
        return;
      }
      setCheckoutStep("review");
    }
    else if (checkoutStep === "review") {
      // Submit order
      createOrderMutation.mutate(values);
    }
  };
  
  // Handle going back to previous step
  const handleBack = () => {
    if (checkoutStep === "payment") {
      setCheckoutStep("shipping");
    } else if (checkoutStep === "review") {
      setCheckoutStep("payment");
    }
  };
  
  return (
    <>
      <Header />
      <main className="bg-slate-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>
            
            {/* Checkout Progress */}
            {checkoutStep !== "confirmation" && (
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      checkoutStep === "shipping" ? "bg-primary text-white" : "bg-primary text-white"
                    }`}>
                      {checkoutStep === "shipping" ? "1" : <Check className="h-5 w-5" />}
                    </div>
                    <span className="mt-2 text-sm font-medium">Shipping</span>
                  </div>
                  <div className="flex-1 h-1 mx-4 bg-gray-200">
                    <div className={`h-full bg-primary ${
                      checkoutStep === "shipping" ? "w-0" : "w-full"
                    }`}></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      checkoutStep === "shipping" ? "bg-gray-200 text-gray-600" : 
                      checkoutStep === "payment" ? "bg-primary text-white" : "bg-primary text-white"
                    }`}>
                      {checkoutStep === "payment" ? "2" : (checkoutStep === "review" || checkoutStep === "confirmation") ? <Check className="h-5 w-5" /> : "2"}
                    </div>
                    <span className="mt-2 text-sm font-medium">Payment</span>
                  </div>
                  <div className="flex-1 h-1 mx-4 bg-gray-200">
                    <div className={`h-full bg-primary ${
                      checkoutStep === "shipping" || checkoutStep === "payment" ? "w-0" : "w-full"
                    }`}></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      checkoutStep === "review" ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
                    }`}>
                      3
                    </div>
                    <span className="mt-2 text-sm font-medium">Review</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Main Checkout Form */}
            {checkoutStep !== "confirmation" ? (
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Shipping Information Step */}
                        {checkoutStep === "shipping" && (
                          <>
                            <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="John" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                      <Input placeholder="john.doe@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl>
                                      <Input placeholder="(123) 456-7890" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={form.control}
                              name="address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Address</FormLabel>
                                  <FormControl>
                                    <Input placeholder="123 Main St" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>City</FormLabel>
                                    <FormControl>
                                      <Input placeholder="New York" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>State</FormLabel>
                                    <FormControl>
                                      <Input placeholder="NY" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="zipCode"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>ZIP Code</FormLabel>
                                    <FormControl>
                                      <Input placeholder="10001" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={form.control}
                              name="country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Country</FormLabel>
                                  <FormControl>
                                    <Input placeholder="United States" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                        
                        {/* Payment Information Step */}
                        {checkoutStep === "payment" && (
                          <>
                            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                            
                            <FormField
                              control={form.control}
                              name="paymentMethod"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <RadioGroup
                                      onValueChange={field.onChange}
                                      value={field.value}
                                      className="space-y-4"
                                    >
                                      <div className="flex items-center space-x-2 border p-4 rounded-md">
                                        <RadioGroupItem value="credit" id="credit" />
                                        <label htmlFor="credit" className="flex items-center space-x-2 cursor-pointer flex-1">
                                          <CreditCard className="h-5 w-5" />
                                          <span>Credit or Debit Card</span>
                                        </label>
                                        <div className="flex space-x-2">
                                          <img src="https://cdn-icons-png.flaticon.com/512/196/196578.png" alt="Visa" className="h-8" />
                                          <img src="https://cdn-icons-png.flaticon.com/512/196/196561.png" alt="MasterCard" className="h-8" />
                                          <img src="https://cdn-icons-png.flaticon.com/512/179/179431.png" alt="Amex" className="h-8" />
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center space-x-2 border p-4 rounded-md">
                                        <RadioGroupItem value="paypal" id="paypal" />
                                        <label htmlFor="paypal" className="flex items-center space-x-2 cursor-pointer flex-1">
                                          <img src="https://cdn-icons-png.flaticon.com/512/174/174861.png" alt="PayPal" className="h-5" />
                                          <span>PayPal</span>
                                        </label>
                                      </div>
                                      
                                      <div className="flex items-center space-x-2 border p-4 rounded-md">
                                        <RadioGroupItem value="bank" id="bank" />
                                        <label htmlFor="bank" className="flex items-center space-x-2 cursor-pointer flex-1">
                                          <img src="https://cdn-icons-png.flaticon.com/512/2168/2168766.png" alt="Bank Transfer" className="h-5" />
                                          <span>Bank Transfer</span>
                                        </label>
                                      </div>
                                    </RadioGroup>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {/* Credit Card Details (shown only if credit card is selected) */}
                            {watchPaymentMethod === "credit" && (
                              <div className="bg-slate-50 p-4 rounded-md mt-4 space-y-4">
                                <FormField
                                  control={form.control}
                                  name="cardNumber"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Card Number</FormLabel>
                                      <FormControl>
                                        <Input placeholder="1234 5678 9012 3456" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="cardName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Name on Card</FormLabel>
                                      <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <div className="grid grid-cols-3 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="expMonth"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Exp. Month</FormLabel>
                                        <FormControl>
                                          <Input placeholder="MM" maxLength={2} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={form.control}
                                    name="expYear"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Exp. Year</FormLabel>
                                        <FormControl>
                                          <Input placeholder="YY" maxLength={2} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={form.control}
                                    name="cvv"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>CVV</FormLabel>
                                        <FormControl>
                                          <Input placeholder="123" maxLength={4} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Order Review Step */}
                        {checkoutStep === "review" && (
                          <>
                            <h2 className="text-xl font-semibold mb-4">Review Your Order</h2>
                            
                            <div className="space-y-6">
                              <div>
                                <h3 className="font-medium mb-2">Shipping Information</h3>
                                <div className="bg-slate-50 p-4 rounded-md">
                                  <p>{form.getValues("firstName")} {form.getValues("lastName")}</p>
                                  <p>{form.getValues("address")}</p>
                                  <p>{form.getValues("city")}, {form.getValues("state")} {form.getValues("zipCode")}</p>
                                  <p>{form.getValues("country")}</p>
                                  <p>{form.getValues("email")}</p>
                                  <p>{form.getValues("phone")}</p>
                                </div>
                              </div>
                              
                              <div>
                                <h3 className="font-medium mb-2">Payment Method</h3>
                                <div className="bg-slate-50 p-4 rounded-md">
                                  {form.getValues("paymentMethod") === "credit" && (
                                    <div className="flex items-center">
                                      <CreditCard className="h-5 w-5 mr-2" />
                                      <span>Credit Card ending in {form.getValues("cardNumber")?.slice(-4) || "****"}</span>
                                    </div>
                                  )}
                                  {form.getValues("paymentMethod") === "paypal" && (
                                    <div className="flex items-center">
                                      <img src="https://cdn-icons-png.flaticon.com/512/174/174861.png" alt="PayPal" className="h-5 mr-2" />
                                      <span>PayPal</span>
                                    </div>
                                  )}
                                  {form.getValues("paymentMethod") === "bank" && (
                                    <div className="flex items-center">
                                      <img src="https://cdn-icons-png.flaticon.com/512/2168/2168766.png" alt="Bank Transfer" className="h-5 mr-2" />
                                      <span>Bank Transfer</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <h3 className="font-medium mb-2">Items</h3>
                                <div className="bg-slate-50 p-4 rounded-md space-y-3">
                                  {cartItems.map((item) => (
                                    <div key={item.id} className="flex justify-between">
                                      <div className="flex items-center">
                                        <img 
                                          src={item.product.imageUrl} 
                                          alt={item.product.name} 
                                          className="w-12 h-12 object-cover rounded mr-3"
                                        />
                                        <div>
                                          <p className="font-medium">{item.product.name}</p>
                                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                      </div>
                                      <p className="font-medium">${(Number(item.product.price) * item.quantity).toFixed(2)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {/* Form Navigation Buttons */}
                        <div className="flex justify-between mt-8">
                          {checkoutStep !== "shipping" && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={handleBack}
                            >
                              Back
                            </Button>
                          )}
                          
                          <Button 
                            type="submit" 
                            className="ml-auto" 
                            disabled={createOrderMutation.isPending}
                          >
                            {createOrderMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : checkoutStep === "shipping" ? (
                              "Continue to Payment"
                            ) : checkoutStep === "payment" ? (
                              "Review Order"
                            ) : (
                              "Place Order"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                </div>
                
                {/* Order Summary */}
                <div className="md:col-span-1">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                    
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex py-3 border-b border-gray-100">
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name} 
                          className="w-16 h-16 object-cover rounded mr-3"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{item.product.name}</h3>
                          <div className="flex justify-between mt-1">
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            <p className="font-medium">${(Number(item.product.price) * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>${shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Order Confirmation
              <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Thank You for Your Order!</h2>
                <p className="text-gray-600 mb-6">Your order has been placed successfully and is being processed.</p>
                
                <div className="max-w-md mx-auto bg-gray-50 p-4 rounded-md mb-6">
                  <p className="font-medium">Order Reference: #{Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}</p>
                  <p className="text-sm text-gray-500">A confirmation email has been sent to {form.getValues("email")}</p>
                </div>
                
                <div className="space-x-4">
                  <Button onClick={() => navigate("/")}>
                    Continue Shopping
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/orders")}>
                    View My Orders
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default CheckoutPage;
