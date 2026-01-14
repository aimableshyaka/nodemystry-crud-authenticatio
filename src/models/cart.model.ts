import { UUID } from "node:crypto";

interface CartItem {
  id: UUID;
  productId: UUID;
  quantity: number;
  price: number;
}

interface Cart {
  id: UUID;
  userId: number;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type { Cart, CartItem };
