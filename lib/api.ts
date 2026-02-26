import { supabase } from './supabase';

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
}

export const api = {
  // Clients
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase.from('clients').select('*').order('name');
    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
    return data as Client[];
  },
  async addClient(client: Omit<Client, 'id'>): Promise<Client> {
    const { data, error } = await supabase.from('clients').insert([client]).select().single();
    if (error) throw error;
    return data as Client;
  },
  async updateClient(id: string, client: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase.from('clients').update(client).eq('id', id).select().single();
    if (error) throw error;
    return data as Client;
  },
  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    return data.map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      category: p.category,
      quantity: p.quantity,
      isFavorite: p.is_favorite
    }));
  },
  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const dbProduct = {
      name: product.name,
      price: product.price,
      category: product.category,
      quantity: product.quantity,
      is_favorite: product.isFavorite
    };
    const { data, error } = await supabase.from('products').insert([dbProduct]).select().single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      price: Number(data.price),
      category: data.category,
      quantity: data.quantity,
      isFavorite: data.is_favorite
    };
  },
  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const dbProduct: any = {};
    if (product.name !== undefined) dbProduct.name = product.name;
    if (product.price !== undefined) dbProduct.price = product.price;
    if (product.category !== undefined) dbProduct.category = product.category;
    if (product.quantity !== undefined) dbProduct.quantity = product.quantity;
    if (product.isFavorite !== undefined) dbProduct.is_favorite = product.isFavorite;

    const { data, error } = await supabase.from('products').update(dbProduct).eq('id', id).select().single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      price: Number(data.price),
      category: data.category,
      quantity: data.quantity,
      isFavorite: data.is_favorite
    };
  },
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  // Sales
  async getSales(): Promise<Sale[]> {
    const { data, error } = await supabase.from('sales').select('*, sale_items(*)').order('date', { ascending: false });
    if (error) {
      console.error('Error fetching sales:', error);
      return [];
    }
    return data.map(s => ({
      id: s.id,
      clientId: s.client_id,
      totalValue: Number(s.total_value),
      amountPaid: Number(s.amount_paid),
      remainingValue: Number(s.remaining_value),
      paymentMethod: s.payment_method,
      date: s.date,
      items: s.sale_items?.map((item: any) => ({
        productId: item.product_id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity
      })) || []
    }));
  },
  async addSale(sale: Omit<Sale, 'id' | 'items'>, items: SaleItem[]): Promise<Sale> {
    // Insert sale
    const dbSale = {
      client_id: sale.clientId,
      total_value: sale.totalValue,
      amount_paid: sale.amountPaid,
      remaining_value: sale.remainingValue,
      payment_method: sale.paymentMethod,
      date: sale.date || new Date().toISOString()
    };
    
    const { data: newSale, error: saleError } = await supabase.from('sales').insert([dbSale]).select().single();
    if (saleError) throw saleError;

    // Insert items
    if (items && items.length > 0) {
      const dbItems = items.map(item => ({
        sale_id: newSale.id,
        product_id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));
      const { error: itemsError } = await supabase.from('sale_items').insert(dbItems);
      if (itemsError) throw itemsError;
    }

    return {
      id: newSale.id,
      clientId: newSale.client_id,
      totalValue: Number(newSale.total_value),
      amountPaid: Number(newSale.amount_paid),
      remainingValue: Number(newSale.remaining_value),
      paymentMethod: newSale.payment_method,
      date: newSale.date,
      items: items
    };
  }
};
