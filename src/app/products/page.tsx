"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/browser"

export default function Products() {
  const [client] = useState(() => createClient())
  const [products, setProducts] = useState<{ id: string | number; name: string }[]>([])

  useEffect(() => {
    async function getProducts() {
      const { data, error } = await client
        .from("products")
        .select("*")

      if (error) {
        console.error(error)
        return
      }

      setProducts(data)
    }

    getProducts()
  }, [client])

  return (
    <div>
      <h1>Products</h1>

      {products.map((product) => (
        <div key={product.id}>
          {product.name}
        </div>
      ))}
    </div>
  )
}
