"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { BigNumber } from "bignumber.js";

const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Product name is required"),
  price: z.instanceof(BigNumber).refine((val) => val.isGreaterThan(0), "Price must be a positive number"),
});

type Product = z.infer<typeof ProductSchema>;

export default function Home() {
  const router = useRouter();
  const [cart, setCart] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({ name: "", price: "" });
  const [error, setError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const addToCart = () => {
    try {
      const product: Product = ProductSchema.parse({
        id: uuidv7(),
        name: newProduct.name,
        price: new BigNumber(newProduct.price),
      });
      setCart([...cart, product]);
      setNewProduct({ name: "", price: "" });
      setError(null);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total.plus(item.price), new BigNumber(0)).toFixed(4);
  };

  const handleCheckout = () => {
    const totalAmount = getTotalPrice();
    if (new BigNumber(totalAmount).isGreaterThan(0)) {
      router.push(`/checkout?amount=${totalAmount}`);
    } else {
      setCheckoutError("Cart is empty. Please add items before checkout.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">Solana POS</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Add Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <Input
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
              />
              <Input
                placeholder="Price (SOL)"
                type="number"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
              />
              {error && <p className="text-red-500">{error}</p>}
              <Button onClick={addToCart}>Add to Cart</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cart</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price (SOL)</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((item: Product) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.price.toFixed(9)}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4">
              <p className="font-bold">Total: {getTotalPrice()} SOL</p>
              <Button className="mt-2" onClick={handleCheckout}>
                Checkout
              </Button>
              {checkoutError && <p className="text-red-500">{checkoutError}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
