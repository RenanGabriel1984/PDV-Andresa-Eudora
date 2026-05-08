import { supabase } from "./supabase";

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity: number;
  isFavorite: boolean;
}

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  createdAt?: string;
  notes?: string;
}

export interface Sale {
  id: string;
  clientId: string;
  totalValue: number;
  amountPaid: number;
  remainingValue: number;
  paymentMethod: string;
  date: string;
  items?: SaleItem[];
  productId?: string; // For backward compatibility
  // Optional extension fields
  paidAmount?: number;
  remainingAmount?: number;
  payments?: Payment[];
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: "in" | "out";
  quantity: number;
  description: string;
  date: string;
}

export const api = {
  // Clients
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("name");
    if (error) {
      console.error("Error fetching clients:", error);
      return [];
    }
    return (data || []) as Client[];
  },
  async addClient(client: Omit<Client, "id">): Promise<Client> {
    const dbClient = {
      name: client.name,
      phone: client.phone,
      address: client.address || null,
    };
    const { data, error } = await supabase
      .from("clients")
      .insert([dbClient])
      .select()
      .single();
    if (error) throw error;
    return data as Client;
  },
  async updateClient(id: string, client: Partial<Client>): Promise<Client> {
    const dbClient: any = {};
    if (client.name !== undefined) dbClient.name = client.name;
    if (client.phone !== undefined) dbClient.phone = client.phone;
    if (client.address !== undefined) dbClient.address = client.address || null;

    const { data, error } = await supabase
      .from("clients")
      .update(dbClient)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Client;
  },
  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw error;
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");
    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }
    return (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      category: p.category,
      quantity: p.quantity,
      isFavorite: p.is_favorite,
    }));
  },
  async addProduct(product: Omit<Product, "id">): Promise<Product> {
    const dbProduct = {
      name: product.name,
      price: product.price,
      category: product.category,
      quantity: product.quantity,
      is_favorite: product.isFavorite,
    };
    const { data, error } = await supabase
      .from("products")
      .insert([dbProduct])
      .select()
      .single();
    if (error) throw error;

    if (product.quantity > 0) {
      await this.addStockMovement({
        product_id: data.id,
        type: "in",
        quantity: product.quantity,
        description: "Estoque inicial",
      });
    }

    return {
      id: data.id,
      name: data.name,
      price: Number(data.price),
      category: data.category,
      quantity: data.quantity,
      isFavorite: data.is_favorite,
    };
  },
  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    // Get current product to check quantity difference
    const { data: currentProduct } = await supabase
      .from("products")
      .select("quantity")
      .eq("id", id)
      .single();

    const dbProduct: any = {};
    if (product.name !== undefined) dbProduct.name = product.name;
    if (product.price !== undefined) dbProduct.price = product.price;
    if (product.category !== undefined) dbProduct.category = product.category;
    if (product.quantity !== undefined) dbProduct.quantity = product.quantity;
    if (product.isFavorite !== undefined)
      dbProduct.is_favorite = product.isFavorite;

    const { data, error } = await supabase
      .from("products")
      .update(dbProduct)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    if (
      currentProduct &&
      product.quantity !== undefined &&
      product.quantity !== currentProduct.quantity
    ) {
      const diff = product.quantity - (currentProduct.quantity || 0);
      await this.addStockMovement({
        product_id: id,
        type: diff > 0 ? "in" : "out",
        quantity: Math.abs(diff),
        description: "Ajuste manual de estoque",
      });
    }

    return {
      id: data.id,
      name: data.name,
      price: Number(data.price),
      category: data.category,
      quantity: data.quantity,
      isFavorite: data.is_favorite,
    };
  },
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  },

  // Stock Movements
  async getStockMovements(): Promise<StockMovement[]> {
    const { data, error } = await supabase
      .from("stock_movements")
      .select("*")
      .order("date", { ascending: false });
    if (error) {
      console.warn(
        "Error fetching stock movements (table might not exist):",
        error,
      );
      return [];
    }
    return data as StockMovement[];
  },
  async addStockMovement(
    movement: Omit<StockMovement, "id" | "date">,
  ): Promise<void> {
    const { error } = await supabase.from("stock_movements").insert([movement]);
    if (error) {
      console.warn(
        "Error adding stock movement (table might not exist):",
        error,
      );
    }
  },

  // Sales
  async getSales(): Promise<Sale[]> {
    const { data, error } = await supabase
      .from("sales")
      .select("*, sale_items(*)")
      .order("date", { ascending: false });
    if (error) {
      console.error("Error fetching sales:", error);
      return [];
    }
    return (data || []).map((s) => ({
      id: s.id,
      clientId: s.client_id,
      totalValue: Number(s.total_value),
      amountPaid: Number(s.amount_paid),
      remainingValue: Number(s.remaining_value),
      paymentMethod: s.payment_method,
      date: s.date,
      // Optional extension fields
      paidAmount: Number(s.amount_paid),
      remainingAmount: Number(s.remaining_value),
      payments: s.payments || [],
      items:
        s.sale_items?.map((item: any) => ({
          productId: item.product_id,
          name: item.name,
          price: Number(item.price),
          quantity: item.quantity,
        })) || [],
    }));
  },
  async addSale(
    sale: Omit<Sale, "id" | "items">,
    items: SaleItem[],
  ): Promise<Sale> {
    // Insert sale
    const dbSale: any = {
      client_id: sale.clientId,
      total_value: sale.totalValue,
      amount_paid: sale.amountPaid !== undefined ? sale.amountPaid : (sale.paidAmount || 0),
      remaining_value: sale.remainingValue !== undefined ? sale.remainingValue : (sale.remainingAmount || 0),
      payment_method: sale.paymentMethod,
      date: sale.date || new Date().toISOString(),
    };

    if (sale.payments) {
       dbSale.payments = sale.payments;
    }

    let { data: newSale, error: saleError } = await supabase
      .from("sales")
      .insert([dbSale])
      .select()
      .single();

    // Fallback if payments column doesn't exist
    if (saleError && saleError.code === '42703' && dbSale.payments) {
       console.warn("Column 'payments' not found in Supabase. Falling back to simple numeric update.");
       delete dbSale.payments;
       const fallbackResult = await supabase
         .from("sales")
         .insert([dbSale])
         .select()
         .single();
       newSale = fallbackResult.data;
       saleError = fallbackResult.error;
    }

    if (saleError) throw saleError;

    // Insert items
    if (items && items.length > 0) {
      const dbItems = items.map((item) => ({
        sale_id: newSale.id,
        product_id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));
      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(dbItems);
      if (itemsError) throw itemsError;

      // Deduct stock and add movement
      for (const item of items) {
        // Get current product
        const { data: product } = await supabase
          .from("products")
          .select("quantity")
          .eq("id", item.productId)
          .single();
        if (product) {
          const newQuantity = (product.quantity || 0) - item.quantity;
          await supabase
            .from("products")
            .update({ quantity: newQuantity })
            .eq("id", item.productId);

          // Add movement
          await this.addStockMovement({
            product_id: item.productId,
            type: "out",
            quantity: item.quantity,
            description: `Venda #${newSale.id.substring(0, 8)}`,
          });
        }
      }
    }

    return {
      id: newSale.id,
      clientId: newSale.client_id,
      totalValue: Number(newSale.total_value),
      amountPaid: Number(newSale.amount_paid),
      remainingValue: Number(newSale.remaining_value),
      paymentMethod: newSale.payment_method,
      date: newSale.date,
      items: items,
    };
  },
  async updateSale(id: string, updates: Partial<Sale>): Promise<Sale> {
    const dbSale: any = {};
    if (updates.amountPaid !== undefined)
      dbSale.amount_paid = updates.amountPaid;
    if (updates.paidAmount !== undefined && dbSale.amount_paid === undefined)
      dbSale.amount_paid = updates.paidAmount;

    if (updates.remainingValue !== undefined)
      dbSale.remaining_value = updates.remainingValue;
    if (updates.remainingAmount !== undefined && dbSale.remaining_value === undefined)
      dbSale.remaining_value = updates.remainingAmount;

    if (updates.paymentMethod !== undefined)
      dbSale.payment_method = updates.paymentMethod;
    if (updates.totalValue !== undefined)
      dbSale.total_value = updates.totalValue;
    
    if (updates.date !== undefined)
      dbSale.date = updates.date;

    if (updates.payments !== undefined)
      dbSale.payments = updates.payments;

    let { data, error } = await supabase
      .from("sales")
      .update(dbSale)
      .eq("id", id)
      .select()
      .single();

    // Fallback if payments column doesn't exist
    if (error && error.code === '42703' && dbSale.payments !== undefined) {
       console.warn("Column 'payments' not found in Supabase. Falling back to simple numeric update.");
       delete dbSale.payments;
       const fallbackResult = await supabase
         .from("sales")
         .update(dbSale)
         .eq("id", id)
         .select()
         .single();
       data = fallbackResult.data;
       error = fallbackResult.error;
    }

    if (error) throw error;

    return {
      id: data.id,
      clientId: data.client_id,
      totalValue: Number(data.total_value),
      amountPaid: Number(data.amount_paid),
      remainingValue: Number(data.remaining_value),
      paymentMethod: data.payment_method,
      date: data.date,
    };
  },
  async updateSaleWithItems(
    id: string,
    updates: Partial<Sale>,
    items: SaleItem[],
  ): Promise<Sale> {
    // 1. Update the main sale record
    const updatedSale = await this.updateSale(id, updates);

    // 1.5 Revert stock for existing items
    const { data: existingItems } = await supabase
      .from("sale_items")
      .select("*")
      .eq("sale_id", id);
    if (existingItems && existingItems.length > 0) {
      for (const item of existingItems) {
        const { data: product } = await supabase
          .from("products")
          .select("quantity")
          .eq("id", item.product_id)
          .single();
        if (product) {
          const newQuantity = (product.quantity || 0) + item.quantity;
          await supabase
            .from("products")
            .update({ quantity: newQuantity })
            .eq("id", item.product_id);

          await this.addStockMovement({
            product_id: item.product_id,
            type: "in",
            quantity: item.quantity,
            description: `Edição de Venda #${id.substring(0, 8)} (Estorno)`,
          });
        }
      }
    }

    // 2. Delete existing items
    const { error: deleteError } = await supabase
      .from("sale_items")
      .delete()
      .eq("sale_id", id);
    if (deleteError) throw deleteError;

    // 3. Insert new items
    if (items && items.length > 0) {
      const dbItems = items.map((item) => ({
        sale_id: id,
        product_id: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(dbItems);
      if (itemsError) throw itemsError;

      // Deduct stock for new items
      for (const item of items) {
        const { data: product } = await supabase
          .from("products")
          .select("quantity")
          .eq("id", item.productId)
          .single();
        if (product) {
          const newQuantity = (product.quantity || 0) - item.quantity;
          await supabase
            .from("products")
            .update({ quantity: newQuantity })
            .eq("id", item.productId);

          await this.addStockMovement({
            product_id: item.productId,
            type: "out",
            quantity: item.quantity,
            description: `Edição de Venda #${id.substring(0, 8)} (Nova Baixa)`,
          });
        }
      }
    }

    return { ...updatedSale, items };
  },
  async deleteSale(id: string): Promise<void> {
    // Revert stock before deleting
    const { data: existingItems } = await supabase
      .from("sale_items")
      .select("*")
      .eq("sale_id", id);
    if (existingItems && existingItems.length > 0) {
      for (const item of existingItems) {
        const { data: product } = await supabase
          .from("products")
          .select("quantity")
          .eq("id", item.product_id)
          .single();
        if (product) {
          const newQuantity = (product.quantity || 0) + item.quantity;
          await supabase
            .from("products")
            .update({ quantity: newQuantity })
            .eq("id", item.product_id);

          await this.addStockMovement({
            product_id: item.product_id,
            type: "in",
            quantity: item.quantity,
            description: `Exclusão de Venda #${id.substring(0, 8)} (Estorno)`,
          });
        }
      }
    }

    const { error: itemsError } = await supabase
      .from("sale_items")
      .delete()
      .eq("sale_id", id);
    if (itemsError) throw itemsError;

    const { error: saleError } = await supabase
      .from("sales")
      .delete()
      .eq("id", id);
    if (saleError) throw saleError;
  },
};
