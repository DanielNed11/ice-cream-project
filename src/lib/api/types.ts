// Mirrors the response records exposed by the Spring backend.

export type Role = "CUSTOMER" | "ADMIN" | "SUPERADMIN";

export type OrderStatus = "PLACED" | "DELIVERED" | "CANCELLED";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  name: string;
  email: string;
  role: Role;
}

export interface Product {
  slug: string;
  name: string;
  price: number;
  stockQuantity: number;
  active: boolean;
}

export interface CartItem {
  productSlug: string;
  productName: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface Cart {
  items: CartItem[];
  totalPrice: number;
}

export interface OrderItem {
  productSlug: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

/** The order number shown to the customer is `reference`; there is no id. */
export interface Order {
  reference: string;
  status: OrderStatus;
  totalPrice: number;
  placedAt: string;
  items: OrderItem[];
}

/** Spring's PagedModel shape. */
export interface Page<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

/** The body every error handler on the backend returns. */
export interface ApiErrorBody {
  status: number;
  message: string;
  path: string;
  timestamp: string;
}
