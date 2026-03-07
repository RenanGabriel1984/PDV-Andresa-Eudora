'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import { ChevronDown, ChevronUp, Search, ShoppingCart, QrCode, Link as LinkIcon, Info, Plus, User, Package, Wallet, MapPin, CheckCircle2, X, Trash2, Edit, MessageCircle, Banknote } from 'lucide-react';
import { api, Client, Product, Sale, SaleItem } from '@/lib/api';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function Vendas() {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedClients, fetchedProducts, fetchedSales] = await Promise.all([
          api.getClients(),
          api.getProducts(),
          api.getSales()
        ]);
        setClients(fetchedClients);
        setProducts(fetchedProducts);
        setSales(fetchedSales);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const [selectedClientId, setSelectedClientId] = useState('');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('Pix');
  
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');

  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');

  const [showSummary, setShowSummary] = useState(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [activeTab, setActiveTab] = useState<'nova' | 'historico'>('nova');
  const [filterDate, setFilterDate] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);

  const clientsById = useMemo(() => {
    const map: Record<string, Client> = {};
    clients.forEach(c => {
      map[c.id] = c;
    });
    return map;
  }, [clients]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      let matchDate = true;
      let matchClient = true;

      if (filterDate) {
        matchDate = (sale.date || '').startsWith(filterDate);
      }
      if (filterClient) {
        const client = clientsById[sale.clientId];
        const searchTerm = filterClient.toLowerCase();
        matchClient = 
          (client?.name || '').toLowerCase().includes(searchTerm) || 
          (sale.clientId || '').toLowerCase().includes(searchTerm);
      }

      return matchDate && matchClient;
    }).sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [sales, filterDate, filterClient, clientsById]);

  const selectedClient = useMemo(() => clientsById[selectedClientId], [clientsById, selectedClientId]);
  const totalValue = useMemo(() => cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0), [cart]);

  const formatCurrency = (value: number) => {
    return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatPriceInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const amount = (parseInt(numbers) / 100).toFixed(2);
    return amount.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parsePriceInput = (value: string) => {
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  };

  const handleAddClient = async () => {
    if (!newClientName || !newClientPhone) return;
    
    try {
      const newClient = await api.addClient({
        name: newClientName,
        phone: newClientPhone.replace(/\D/g, ''),
        address: newClientAddress
      });
      
      setClients([...clients, newClient]);
      setSelectedClientId(newClient.id);
      setIsAddingClient(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientAddress('');
    } catch (error: any) {
      console.error('Error adding client:', error);
      alert(`Erro ao adicionar cliente: ${error.message || 'Erro desconhecido'}. Verifique se as variáveis de ambiente do Supabase estão configuradas no Vercel e se o RLS está desativado.`);
    }
  };

  const handleAddProduct = async () => {
    if (!newProductName || !newProductPrice) return;
    
    try {
      const newProduct = await api.addProduct({
        name: newProductName,
        price: parsePriceInput(newProductPrice),
        category: 'Outros',
        quantity: 0,
        isFavorite: false
      });
      
      setProducts([...products, newProduct]);
      
      // Add directly to cart
      setCart([...cart, { product: newProduct, quantity: 1 }]);
      
      setIsAddingProduct(false);
      setNewProductName('');
      setNewProductPrice('');
    } catch (error: any) {
      console.error('Error adding product:', error);
      alert(`Erro ao adicionar produto: ${error.message || 'Erro desconhecido'}. Verifique se as variáveis de ambiente do Supabase estão configuradas no Vercel e se o RLS está desativado.`);
    }
  };

  const handleAddToCart = () => {
    if (!selectedProductIdToAdd) return;
    const product = products.find(p => p.id === selectedProductIdToAdd);
    if (!product) return;

    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    setSelectedProductIdToAdd('');
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQ = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(null);
  const [editCartItemPrice, setEditCartItemPrice] = useState('');

  const handleEditCartItemPrice = (productId: string) => {
    if (!editCartItemPrice) return;
    
    const numericPrice = parseFloat(editCartItemPrice.replace(/\./g, '').replace(',', '.'));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      alert('Preço inválido.');
      return;
    }

    setCart(cart.map(item => {
      if (item.product.id === productId) {
        return { ...item, product: { ...item.product, price: numericPrice } };
      }
      return item;
    }));
    setEditingCartItemId(null);
    setEditCartItemPrice('');
  };

  const handleFinalizarVenda = async () => {
    if (!selectedClientId || cart.length === 0) {
      alert('Selecione um cliente e adicione pelo menos um produto.');
      return;
    }

    const paid = isPartialPayment && amountPaid ? parsePriceInput(amountPaid) : totalValue;
    const remaining = totalValue - paid;

    try {
      const saleItems = cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      }));

      if (editingSaleId) {
        const updatedSale = await api.updateSaleWithItems(editingSaleId, {
          clientId: selectedClientId,
          totalValue,
          amountPaid: paid,
          remainingValue: remaining,
          paymentMethod,
        }, saleItems);

        setSales(sales.map(s => s.id === editingSaleId ? updatedSale : s));
        setCurrentSale(updatedSale);
        setEditingSaleId(null);
      } else {
        const newSale = await api.addSale({
          clientId: selectedClientId,
          totalValue,
          amountPaid: paid,
          remainingValue: remaining,
          paymentMethod,
          date: new Date().toISOString()
        }, saleItems);

        setSales([...sales, newSale]);
        setCurrentSale(newSale);
      }
      
      setShowSummary(true);
    } catch (error: any) {
      console.error('Error finalizing sale:', error);
      alert(`Erro ao finalizar venda: ${error.message || 'Erro desconhecido'}. Verifique se as variáveis de ambiente do Supabase estão configuradas no Vercel e se o RLS está desativado.`);
    }
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSaleId(sale.id);
    setSelectedClientId(sale.clientId);
    setPaymentMethod(sale.paymentMethod);
    
    if (sale.amountPaid < sale.totalValue) {
      setIsPartialPayment(true);
      setAmountPaid(sale.amountPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    } else {
      setIsPartialPayment(false);
      setAmountPaid('');
    }

    // Reconstruct cart
    if (sale.items && sale.items.length > 0) {
      const newCart: CartItem[] = sale.items.map(item => ({
        product: {
          id: item.productId,
          name: item.name,
          price: item.price,
          category: 'Outros', // Fallback
          quantity: 0, // Fallback
          isFavorite: false // Fallback
        },
        quantity: item.quantity
      }));
      setCart(newCart);
    } else if (sale.productId) {
      // Legacy sale support
      const product = products.find(p => p.id === sale.productId);
      if (product) {
        setCart([{ product, quantity: 1 }]);
      }
    }

    setActiveTab('nova');
  };

  const handleWhatsApp = (saleToSend?: Sale) => {
    const sale = saleToSend || currentSale;
    if (!sale) return;
    
    const client = clientsById[sale.clientId] || selectedClient;
    if (!client) return;

    // Using Unicode escapes to prevent encoding issues on different devices/browsers
    const emojiFlower = '\uD83C\uDF38';
    const emojiBag = '\uD83D\uDECD\uFE0F';
    const emojiMoney = '\uD83D\uDCB0';
    const emojiCheck = '\u2705';
    const emojiHourglass = '\u23F3';
    const emojiSparkles = '\u2728';

    let message = `Olá ${client.name}! ${emojiFlower}\n\n`;
    message += `Aqui está o resumo da sua compra:\n`;
    
    sale.items?.forEach(item => {
      message += `${emojiBag} ${item.quantity}x *${item.name}* - ${formatCurrency(item.price * item.quantity)}\n`;
    });
    
    message += `\n${emojiMoney} Valor Total: *${formatCurrency(sale.totalValue)}*\n\n`;

    if (sale.remainingValue > 0) {
      message += `${emojiCheck} Valor Pago: *${formatCurrency(sale.amountPaid)}*\n`;
      message += `${emojiHourglass} Restante a pagar: *${formatCurrency(sale.remainingValue)}* (para o próximo mês)\n\n`;
    }

    message += `Forma de pagamento escolhida: *${sale.paymentMethod}*\n\n`;
    message += `Qualquer dúvida, estou à disposição! ${emojiSparkles}`;

    // Replace non-breaking spaces (generated by toLocaleString) with regular spaces
    // and ensure newlines are CRLF for maximum compatibility with WhatsApp
    const cleanMessage = message.replace(/[\u00A0\u202F]/g, ' ').replace(/\n/g, '\r\n');
    const encodedMessage = encodeURIComponent(cleanMessage);
    const whatsappUrl = `https://wa.me/55${client.phone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Reset form after sending only if it's the current sale
    if (!saleToSend) {
      setShowSummary(false);
      setSelectedClientId('');
      setCart([]);
      setIsPartialPayment(false);
      setAmountPaid('');
    }
  };

  return (
    <div className="min-h-screen bg-background-light">
      <Header showBack bgColor="bg-[#4a154b]" textColor="text-white" />
      
      <main className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        {/* TABS */}
        <div className="flex bg-white rounded-xl p-1 border border-primary/10 shadow-sm">
          <button 
            onClick={() => setActiveTab('nova')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'nova' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {editingSaleId ? 'Editar Venda' : 'Nova Venda'}
          </button>
          <button 
            onClick={() => setActiveTab('historico')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'historico' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Histórico
          </button>
        </div>

        {activeTab === 'nova' ? (
          <>
            {/* CLIENT SECTION */}
            <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary italic">Dados do Cliente</h3>
            {!isAddingClient && (
              <button onClick={() => setIsAddingClient(true)} className="text-primary flex items-center gap-1 text-xs font-bold bg-primary/10 px-2 py-1 rounded-lg">
                <Plus size={14} /> Novo Cliente
              </button>
            )}
          </div>

          {isAddingClient ? (
            <div className="bg-white p-4 rounded-xl border border-primary/20 space-y-3 shadow-sm">
              <input 
                type="text" 
                placeholder="Nome do Cliente" 
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full rounded-lg border-primary/20 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 outline-none"
              />
              <input 
                type="tel" 
                placeholder="WhatsApp (com DDD)" 
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                className="w-full rounded-lg border-primary/20 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 outline-none"
              />
              <textarea 
                placeholder="Endereço de Entrega" 
                value={newClientAddress}
                onChange={(e) => setNewClientAddress(e.target.value)}
                className="w-full rounded-lg border-primary/20 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary min-h-[80px] p-4 outline-none"
              />
              <div className="flex gap-2">
                <button onClick={() => setIsAddingClient(false)} className="flex-1 h-10 bg-slate-100 text-slate-600 rounded-lg font-bold">Cancelar</button>
                <button onClick={handleAddClient} className="flex-1 h-10 bg-primary text-white rounded-lg font-bold">Salvar</button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <label className="flex flex-col gap-1.5">
                <div className="relative">
                  <select 
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full rounded-xl border-primary/20 bg-white text-slate-900 focus:border-primary focus:ring-primary h-14 pl-11 pr-10 appearance-none outline-none border shadow-sm"
                  >
                    <option value="">Buscar cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gold" size={20} />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary" size={24} />
                </div>
              </label>
            </div>
          )}
        </section>

        {/* PRODUCT SECTION */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary italic">Produtos</h3>
            {!isAddingProduct && (
              <button onClick={() => setIsAddingProduct(true)} className="text-primary flex items-center gap-1 text-xs font-bold bg-primary/10 px-2 py-1 rounded-lg">
                <Plus size={14} /> Novo Produto
              </button>
            )}
          </div>

          {isAddingProduct ? (
            <div className="bg-white p-4 rounded-xl border border-primary/20 space-y-3 shadow-sm">
              <p className="text-xs text-slate-500 mb-2">Adicione um produto do catálogo ou fora do estoque.</p>
              <input 
                type="text" 
                placeholder="Nome do Produto" 
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                className="w-full rounded-lg border-primary/20 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 outline-none"
              />
              <input 
                type="text" 
                placeholder="Preço (R$ 0,00)" 
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(formatPriceInput(e.target.value))}
                className="w-full rounded-lg border-primary/20 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 outline-none"
              />
              <div className="flex gap-2">
                <button onClick={() => setIsAddingProduct(false)} className="flex-1 h-10 bg-slate-100 text-slate-600 rounded-lg font-bold">Cancelar</button>
                <button onClick={handleAddProduct} className="flex-1 h-10 bg-primary text-white rounded-lg font-bold">Salvar</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select 
                  value={selectedProductIdToAdd}
                  onChange={(e) => setSelectedProductIdToAdd(e.target.value)}
                  className="w-full rounded-xl border-primary/20 bg-white text-slate-900 focus:border-primary focus:ring-primary h-14 pl-11 pr-10 appearance-none outline-none border shadow-sm"
                >
                  <option value="">Buscar produto...</option>
                  {products.filter(p => p.quantity > 0).map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}</option>
                  ))}
                </select>
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gold" size={20} />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary" size={24} />
              </div>
              <button 
                onClick={handleAddToCart}
                className="h-14 px-5 bg-primary text-white rounded-xl font-bold shadow-sm hover:bg-primary/90 transition-colors"
              >
                Add
              </button>
            </div>
          )}

          {/* CART ITEMS */}
          {cart.length > 0 && (
            <div className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden mt-3">
              {cart.map(item => (
                <div key={item.product.id} className="p-3 border-b border-slate-100 last:border-0 flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-sm">{item.product.name}</p>
                    {editingCartItemId === item.product.id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input 
                          type="text" 
                          value={editCartItemPrice}
                          onChange={(e) => setEditCartItemPrice(formatPriceInput(e.target.value))}
                          className="w-28 rounded-lg border border-primary/30 px-2 py-1 text-sm font-bold text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          autoFocus
                        />
                        <button 
                          onClick={() => handleEditCartItemPrice(item.product.id)}
                          className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button 
                          onClick={() => { setEditingCartItemId(null); setEditCartItemPrice(''); }}
                          className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="text-primary font-bold text-sm cursor-pointer hover:underline flex items-center gap-1 mt-1"
                        onClick={() => { setEditingCartItemId(item.product.id); setEditCartItemPrice(formatPriceInput(item.product.price.toFixed(2))); }}
                      >
                        {formatCurrency(item.product.price)} un.
                        <span className="text-xs text-slate-400 font-normal">(editar)</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-100 rounded-lg">
                      <button onClick={() => updateCartQuantity(item.product.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-600 font-bold">-</button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.product.id, 1)} className="w-8 h-8 flex items-center justify-center text-slate-600 font-bold">+</button>
                    </div>
                    <button onClick={() => handleRemoveFromCart(item.product.id)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex justify-between items-center mt-4">
            <div>
              <p className="text-xs text-slate-500">Total da Venda</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</p>
            </div>
            <ShoppingCart className="text-primary" size={32} />
          </div>
        </section>

        {/* PAYMENT SECTION */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary italic">Forma de Pagamento</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label className="cursor-pointer group">
              <input type="radio" name="payment" value="Pix" checked={paymentMethod === 'Pix'} onChange={(e) => setPaymentMethod(e.target.value)} className="peer hidden" />
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-primary/10 bg-white peer-checked:border-gold peer-checked:bg-gradient-to-br peer-checked:from-primary/5 peer-checked:to-gold/10 transition-all group-hover:bg-primary/5">
                <QrCode className={paymentMethod === 'Pix' ? 'text-gold mb-2' : 'text-primary mb-2'} size={24} />
                <span className="text-sm font-semibold">Pix</span>
              </div>
            </label>
            
            <label className="cursor-pointer group">
              <input type="radio" name="payment" value="Link de Cartão" checked={paymentMethod === 'Link de Cartão'} onChange={(e) => setPaymentMethod(e.target.value)} className="peer hidden" />
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-primary/10 bg-white peer-checked:border-gold peer-checked:bg-gradient-to-br peer-checked:from-primary/5 peer-checked:to-gold/10 transition-all group-hover:bg-primary/5">
                <LinkIcon className={paymentMethod === 'Link de Cartão' ? 'text-gold mb-2' : 'text-primary mb-2'} size={24} />
                <span className="text-sm font-semibold">Link de Cartão</span>
              </div>
            </label>

            <label className="cursor-pointer group">
              <input type="radio" name="payment" value="À Vista" checked={paymentMethod === 'À Vista'} onChange={(e) => setPaymentMethod(e.target.value)} className="peer hidden" />
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-primary/10 bg-white peer-checked:border-gold peer-checked:bg-gradient-to-br peer-checked:from-primary/5 peer-checked:to-gold/10 transition-all group-hover:bg-primary/5">
                <Banknote className={paymentMethod === 'À Vista' ? 'text-gold mb-2' : 'text-primary mb-2'} size={24} />
                <span className="text-sm font-semibold">À Vista</span>
              </div>
            </label>

            <label className="cursor-pointer group">
              <input type="radio" name="payment" value="Parcelado 2x" checked={paymentMethod === 'Parcelado 2x'} onChange={(e) => setPaymentMethod(e.target.value)} className="peer hidden" />
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-primary/10 bg-white peer-checked:border-gold peer-checked:bg-gradient-to-br peer-checked:from-primary/5 peer-checked:to-gold/10 transition-all group-hover:bg-primary/5">
                <span className={`text-lg font-black mb-1 ${paymentMethod === 'Parcelado 2x' ? 'text-gold' : 'text-primary'}`}>2x</span>
                <span className="text-sm font-semibold text-center">Parcelado</span>
              </div>
            </label>

            <label className="cursor-pointer group">
              <input type="radio" name="payment" value="Parcelado 3x" checked={paymentMethod === 'Parcelado 3x'} onChange={(e) => setPaymentMethod(e.target.value)} className="peer hidden" />
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-primary/10 bg-white peer-checked:border-gold peer-checked:bg-gradient-to-br peer-checked:from-primary/5 peer-checked:to-gold/10 transition-all group-hover:bg-primary/5">
                <span className={`text-lg font-black mb-1 ${paymentMethod === 'Parcelado 3x' ? 'text-gold' : 'text-primary'}`}>3x</span>
                <span className="text-sm font-semibold text-center">Parcelado</span>
              </div>
            </label>

            <label className="cursor-pointer group">
              <input type="radio" name="payment" value="Parcelado 4x" checked={paymentMethod === 'Parcelado 4x'} onChange={(e) => setPaymentMethod(e.target.value)} className="peer hidden" />
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-primary/10 bg-white peer-checked:border-gold peer-checked:bg-gradient-to-br peer-checked:from-primary/5 peer-checked:to-gold/10 transition-all group-hover:bg-primary/5">
                <span className={`text-lg font-black mb-1 ${paymentMethod === 'Parcelado 4x' ? 'text-gold' : 'text-primary'}`}>4x</span>
                <span className="text-sm font-semibold text-center">Parcelado</span>
              </div>
            </label>
          </div>

          {/* PARTIAL PAYMENT TOGGLE */}
          <div className="bg-white p-4 rounded-xl border border-primary/10 shadow-sm space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Wallet className="text-primary" size={20} />
                <span className="font-semibold text-slate-700">Pagamento Parcial</span>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full bg-slate-200">
                <input 
                  type="checkbox" 
                  className="peer opacity-0 w-0 h-0" 
                  checked={isPartialPayment}
                  onChange={(e) => setIsPartialPayment(e.target.checked)}
                />
                <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-slate-200 rounded-full transition-colors peer-checked:bg-primary"></span>
                <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></span>
              </div>
            </label>

            {isPartialPayment && (
              <div className="pt-3 border-t border-slate-100 flex gap-4">
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-1">Valor Pago Agora</p>
                  <input 
                    type="text" 
                    placeholder="R$ 0,00" 
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(formatPriceInput(e.target.value))}
                    className="w-full rounded-lg border border-primary/20 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary h-10 px-3 outline-none text-sm font-bold text-emerald-600"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-1">Restante (Próx. Mês)</p>
                  <div className="w-full rounded-lg border border-slate-200 bg-slate-50 h-10 px-3 flex items-center text-sm font-bold text-orange-500">
                    {formatCurrency(Math.max(0, totalValue - (amountPaid ? parsePriceInput(amountPaid) : 0)))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-primary/10 bg-white flex items-start gap-3">
            <Info className="text-primary shrink-0" size={24} />
            <p className="text-xs leading-relaxed text-slate-600">
              As opções de parcelamento no cartão estarão disponíveis no link de pagamento enviado ao cliente.
            </p>
          </div>
        </section>

        <div className="pt-4 space-y-3">
          <button 
            onClick={handleFinalizarVenda}
            className="w-full h-14 bg-gradient-to-r from-primary via-[#a63499] to-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all border-b-4 border-gold/50"
          >
            {editingSaleId ? 'Salvar Alterações' : 'Finalizar Venda'}
          </button>
          
          {editingSaleId && (
            <button 
              onClick={() => {
                setEditingSaleId(null);
                setSelectedClientId('');
                setCart([]);
                setIsPartialPayment(false);
                setAmountPaid('');
                setActiveTab('historico');
              }}
              className="w-full h-12 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
            >
              Cancelar Edição
            </button>
          )}
        </div>
        </>
        ) : (
          <section className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-primary/10 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary italic mb-2">Filtros</h3>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="flex-1 rounded-lg border border-primary/20 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary h-10 px-3 outline-none text-sm text-slate-700"
                />
                <input 
                  type="text" 
                  placeholder="Nome ou ID do cliente" 
                  value={filterClient}
                  onChange={(e) => setFilterClient(e.target.value)}
                  className="flex-1 rounded-lg border border-primary/20 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary h-10 px-3 outline-none text-sm text-slate-700"
                />
              </div>
              {(filterDate || filterClient) && (
                <button 
                  onClick={() => { setFilterDate(''); setFilterClient(''); }}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Limpar Filtros
                </button>
              )}
            </div>

            <div className="space-y-3">
              {filteredSales.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-xl border border-primary/10">
                  <p className="text-slate-500">Nenhuma venda encontrada.</p>
                </div>
              ) : (
                filteredSales.map(sale => {
                  const client = clientsById[sale.clientId];
                  const isExpanded = expandedSaleId === sale.id;
                  
                  return (
                    <div 
                      key={sale.id} 
                      className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden transition-all"
                    >
                      <div 
                        className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-900">{client?.name || 'Cliente Desconhecido'}</p>
                            <p className="text-xs text-slate-500">{new Date(sale.date).toLocaleString('pt-BR')}</p>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <p className="font-bold text-primary">{formatCurrency(sale.totalValue)}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs text-slate-500">{sale.paymentMethod}</span>
                              {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                            </div>
                          </div>
                        </div>
                        {sale.remainingValue > 0 && (
                          <div className="flex justify-between items-center text-xs pt-3 mt-2 border-t border-slate-100">
                            <span className="text-emerald-600 font-semibold">Pago: {formatCurrency(sale.amountPaid)}</span>
                            <span className="text-orange-500 font-bold">Fiado: {formatCurrency(sale.remainingValue)}</span>
                          </div>
                        )}
                      </div>
                      
                      {isExpanded && (
                        <div className="bg-slate-50 p-4 border-t border-primary/10 animate-in slide-in-from-top-2 duration-200">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Produtos Comprados</h4>
                          {sale.items && sale.items.length > 0 ? (
                            <div className="space-y-2">
                              {sale.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-slate-200">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-primary/10 text-primary font-bold text-xs px-2 py-1 rounded">
                                      {item.quantity}x
                                    </span>
                                    <span className="font-medium text-slate-700">{item.name}</span>
                                  </div>
                                  <span className="text-slate-600 font-medium">{formatCurrency(item.price * item.quantity)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 italic">
                              {sale.productId ? 'Produto legado (sem detalhes)' : 'Nenhum produto registrado nesta venda.'}
                            </p>
                          )}
                          
                          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSale(sale);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 bg-white border border-primary/20 text-primary hover:bg-primary/5 py-2 rounded-lg text-sm font-bold transition-colors"
                            >
                              <Edit size={16} />
                              Editar Venda
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWhatsApp(sale);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white hover:bg-[#20bd5a] py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                            >
                              <MessageCircle size={16} />
                              Reenviar Recibo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}
      </main>

      {/* SUMMARY MODAL */}
      {showSummary && currentSale && selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-emerald-500 p-6 text-center text-white relative">
              <button 
                onClick={() => setShowSummary(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white"
              >
                <X size={24} />
              </button>
              <CheckCircle2 size={64} className="mx-auto mb-4 text-white" />
              <h2 className="text-2xl font-bold">Venda Finalizada!</h2>
              <p className="text-emerald-100 mt-1">A venda foi registrada com sucesso.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-500">Cliente</p>
                <p className="font-bold text-slate-900">{selectedClient.name}</p>
                <p className="text-sm text-slate-600 flex items-center gap-1"><MapPin size={14}/> {selectedClient.address || 'Endereço não cadastrado'}</p>
              </div>
              
              <div className="h-px bg-slate-100 w-full"></div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                <p className="text-sm text-slate-500">Produtos</p>
                {currentSale.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <p className="font-bold text-slate-900">{item.quantity}x {item.name}</p>
                    <p className="font-bold text-primary">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="h-px bg-slate-100 w-full"></div>

              <div className="space-y-2">
                <p className="text-sm text-slate-500">Pagamento: {currentSale.paymentMethod}</p>
                {currentSale.remainingValue > 0 ? (
                  <>
                    <div className="flex justify-between items-center text-emerald-600">
                      <p className="font-semibold">Valor Pago</p>
                      <p className="font-bold">{formatCurrency(currentSale.amountPaid)}</p>
                    </div>
                    <div className="flex justify-between items-center text-orange-500">
                      <p className="font-semibold">Restante</p>
                      <p className="font-bold">{formatCurrency(currentSale.remainingValue)}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center text-emerald-600">
                    <p className="font-semibold">Valor Pago</p>
                    <p className="font-bold">{formatCurrency(currentSale.totalValue)}</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => handleWhatsApp()}
                className="w-full h-14 mt-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.747-2.874-2.512-2.96-2.626-.087-.115-.708-.941-.708-1.793 0-.852.448-1.271.607-1.441.159-.171.348-.214.463-.214.116 0 .232.001.333.006.106.005.249-.04.389.298.144.347.491 1.2.535 1.287.043.086.072.188.014.304-.058.115-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.088.275.073.376-.044.101-.117.434-.506.549-.68.116-.174.232-.145.391-.087.158.058 1.012.477 1.186.564.173.088.289.13.333.203.043.073.043.419-.101.824z"></path>
                </svg>
                Enviar Resumo via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
