import { UUID } from "node:crypto";

interface CartItem {
  id: UUID;
  productId: string;
  quantity: number;
  price: number;
}

interface Cart {
  id: UUID;
  userId: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type { Cart, CartItem };
