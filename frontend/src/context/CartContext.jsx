import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../api/axios";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("farmerCart");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("farmerCart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Add product to cart
  const addProduct = (product) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.type === "product"
      );
      if (existing) {
        toast.info("Product quantity updated in cart");
        return prev.map((item) =>
          item.id === product.id && item.type === "product"
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      toast.success("Product added to cart");
      return [
        ...prev,
        {
          id: product.id,
          type: "product",
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: 1,
        },
      ];
    });
  };

  // Add tool/equipment booking to cart
  const addToolBooking = (tool, startDate, endDate) => {
    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (days <= 0) {
      toast.error("End date must be after start date");
      return false;
    }

    const existing = cartItems.find(
      (item) => item.id === tool.id && item.type === "tool"
    );

    if (existing) {
      toast.info("Tool booking already in cart");
      return false;
    }

    setCartItems((prev) => [
      ...prev,
      {
        id: tool.id,
        type: "tool",
        name: tool.name,
        dailyRate: tool.dailyRate,
        imageUrl: tool.imageUrl,
        startDate,
        endDate,
        days,
        totalPrice: tool.dailyRate * days,
      },
    ]);

    toast.success("Tool booking added to cart");
    return true;
  };

  // Add crop to cart
  const addCrop = (crop) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.id === crop.id && item.type === "crop"
      );
      if (existing) {
        toast.info("Crop quantity updated in cart");
        return prev.map((item) =>
          item.id === crop.id && item.type === "crop"
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      toast.success("Crop added to cart");
      return [
        ...prev,
        {
          id: crop.id,
          type: "crop",
          name: crop.name,
          price: crop.price,
          imageUrl: crop.imageUrl,
          quantity: 1,
        },
      ];
    });
  };

  // Update quantity
  const updateQuantity = (itemId, itemType, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(itemId, itemType);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId && item.type === itemType
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Remove item from cart
  const removeItem = (itemId, itemType) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.id === itemId && item.type === itemType))
    );
    toast.success("Item removed from cart");
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
    toast.success("Cart cleared");
  };

  // Calculate totals
  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => {
      if (item.type === "tool") {
        return sum + item.totalPrice;
      }
      return sum + item.price * item.quantity;
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => {
      if (item.type === "tool") return count + 1;
      return count + item.quantity;
    }, 0);
  };

  // Checkout - place all orders and bookings
  const checkout = async () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return false;
    }

    try {
      // Separate products/crops from tools
      const products = cartItems.filter(
        (item) => item.type === "product" || item.type === "crop"
      );
      const tools = cartItems.filter((item) => item.type === "tool");

      // Place product orders
      if (products.length > 0) {
        const orderItems = products.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        }));

        await api.post("/farmer/orders", orderItems);
      }

      // Place tool bookings
      for (const tool of tools) {
        await api.post("/farmer/bookings", null, {
          params: {
            equipmentId: tool.id,
            startDate: tool.startDate,
            endDate: tool.endDate,
          },
        });
      }

      clearCart();
      toast.success("Order placed successfully!");
      return true;
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error("Failed to place order. Please try again.");
      return false;
    }
  };

  const value = {
    cartItems,
    addProduct,
    addToolBooking,
    addCrop,
    updateQuantity,
    removeItem,
    clearCart,
    getCartTotal,
    getCartCount,
    checkout,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
