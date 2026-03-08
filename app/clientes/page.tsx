'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import { Plus, Search, MapPin, Phone, Edit2, Trash2, ChevronDown, ChevronUp, AlertCircle, ShoppingBag, User, CheckCircle, Wallet, MessageCircle } from 'lucide-react';
import { api, Client, Sale, Product } from '@/lib/api';

export default function Clientes() {
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Payment state
  const [payingSaleId, setPayingSaleId] = useState<string | null>(null);
  const [payingClientId, setPayingClientId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedClients, fetchedSales, fetchedProducts] = await Promise.all([
          api.getClients(),
          api.getSales(),
          api.getProducts()
        ]);
        setClients(fetchedClients);
        setSales(fetchedSales);
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    try {
      if (editingId) {
        const updatedClient = await api.updateClient(editingId, { name, phone, address });
        setClients(clients.map(c => c.id === editingId ? updatedClient : c));
        setEditingId(null);
      } else {
        const newClient = await api.addClient({ name, phone, address });
        setClients([...clients, newClient]);
      }

      setName('');
      setPhone('');
      setAddress('');
      setIsAdding(false);
    } catch (error: any) {
      console.error('Error saving client:', error);
      alert(`Erro ao salvar cliente: ${error.message || 'Erro desconhecido'}. Verifique se as variáveis de ambiente do Supabase estão configuradas no Vercel e se o RLS está desativado.`);
    }
  };

  const handleEdit = (client: Client) => {
    setName(client.name);
    setPhone(client.phone);
    setAddress(client.address || '');
    setEditingId(client.id);
    setIsAdding(true);
  };

  const confirmDelete = async (id: string) => {
    try {
      await api.deleteClient(id);
      setClients(clients.filter(c => c.id !== id));
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Erro ao excluir cliente.');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedClientId(expandedClientId === id ? null : id);
  };

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

  const handleSendWhatsApp = (client: Client, openBalance: number, clientSales: Sale[]) => {
    if (!client.phone) {
      alert('Cliente não possui telefone cadastrado.');
      return;
    }

    const phone = client.phone.replace(/\D/g, '');
    if (phone.length < 10) {
      alert('Telefone inválido para envio de WhatsApp.');
      return;
    }

    const unpaidSales = clientSales.filter(s => s.remainingValue > 0).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const formatCurrency = (value: number) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    let message = `Olá, ${client.name}! Tudo bem?\n\n`;
    message += `Passando para lembrar que você tem um saldo em aberto no valor de *${formatCurrency(openBalance)}*.\n\n`;
    
    if (unpaidSales.length > 0) {
      message += `*Detalhes das compras em aberto:*\n`;
      unpaidSales.forEach(sale => {
        message += `- ${new Date(sale.date).toLocaleDateString('pt-BR')}: ${formatCurrency(sale.remainingValue)}\n`;
      });
    }

    message += `\nQualquer dúvida, estou à disposição!`;

    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleRegisterClientPayment = async (clientId: string, totalDebt: number) => {
    const amount = parsePriceInput(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Digite um valor válido.');
      return;
    }

    if (amount > totalDebt) {
      alert('O valor do pagamento não pode ser maior que a dívida total.');
      return;
    }

    try {
      const clientSales = getClientSales(clientId)
        .filter(s => s.remainingValue > 0)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Oldest first

      let remainingPayment = amount;
      const updatedSales = [...sales];

      for (const sale of clientSales) {
        if (remainingPayment <= 0) break;

        const paymentForThisSale = Math.min(remainingPayment, sale.remainingValue);
        const newAmountPaid = sale.amountPaid + paymentForThisSale;
        const newRemainingValue = sale.remainingValue - paymentForThisSale;

        const updatedSale = await api.updateSale(sale.id, {
          amountPaid: newAmountPaid,
          remainingValue: newRemainingValue
        });

        const index = updatedSales.findIndex(s => s.id === updatedSale.id);
        if (index !== -1) {
          updatedSales[index] = { ...updatedSale, items: sale.items };
        }

        remainingPayment -= paymentForThisSale;
      }

      setSales(updatedSales);
      setPayingClientId(null);
      setPaymentAmount('');
      alert('Pagamento registrado com sucesso!');
    } catch (error) {
      console.error('Error registering client payment:', error);
      alert('Erro ao registrar pagamento do cliente.');
    }
  };

  const handleRegisterPayment = async (saleId: string, currentAmountPaid: number, remainingValue: number) => {
    if (!paymentAmount) return;
    
    const amountToPay = parsePriceInput(paymentAmount);
    if (amountToPay <= 0 || amountToPay > remainingValue) {
      alert('Valor inválido. O valor deve ser maior que zero e menor ou igual ao restante.');
      return;
    }

    try {
      const newAmountPaid = currentAmountPaid + amountToPay;
      const newRemainingValue = remainingValue - amountToPay;

      const updatedSale = await api.updateSale(saleId, {
        amountPaid: newAmountPaid,
        remainingValue: newRemainingValue
      });

      setSales(sales.map(s => s.id === saleId ? { ...s, amountPaid: newAmountPaid, remainingValue: newRemainingValue } : s));
      setPayingSaleId(null);
      setPaymentAmount('');
    } catch (error) {
      console.error('Error registering payment:', error);
      alert('Erro ao registrar pagamento.');
    }
  };

  const salesByClient = useMemo(() => {
    const map: Record<string, Sale[]> = {};
    sales.forEach(sale => {
      if (!map[sale.clientId]) map[sale.clientId] = [];
      map[sale.clientId].push(sale);
    });
    return map;
  }, [sales]);

  const getClientSales = (clientId: string) => {
    return salesByClient[clientId] || [];
  };

  const getClientOpenBalance = (clientId: string) => {
    const clientSales = getClientSales(clientId);
    return clientSales.reduce((total, sale) => total + sale.remainingValue, 0);
  };

  const productsById = useMemo(() => {
    const map: Record<string, Product> = {};
    products.forEach(p => {
      map[p.id] = p;
    });
    return map;
  }, [products]);

  const getProductName = (productId: string) => {
    const product = productsById[productId];
    return product ? product.name : 'Produto Desconhecido';
  };

  const filteredClients = useMemo(() => clients.filter(c => 
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone || '').includes(searchQuery)
  ), [clients, searchQuery]);

  return (
    <div className="min-h-screen bg-background-light">
      <Header showBack bgColor="bg-[#4a154b]" textColor="text-white" />
      
      <main className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Meus Clientes</h2>
          <button 
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingId(null);
              setName('');
              setPhone('');
              setAddress('');
            }}
            className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou telefone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-xl border border-primary/10 bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm"
          />
        </div>

        {/* ADD/EDIT FORM */}
        {isAdding && (
          <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-primary/10 shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-200">
            <h3 className="font-bold text-slate-900">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h3>
            
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Nome completo" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-xl border border-primary/10 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
              <input 
                type="tel" 
                placeholder="WhatsApp (com DDD)" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-xl border border-primary/10 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
              <textarea 
                placeholder="Endereço de Entrega" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full min-h-[80px] p-4 rounded-xl border border-primary/10 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 h-12 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex-1 h-12 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                {editingId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </form>
        )}

        {/* CLIENTS LIST */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Total: {filteredClients.length} clientes
          </p>

          {filteredClients.map(client => {
            const clientSales = getClientSales(client.id);
            const openBalance = getClientOpenBalance(client.id);
            const isExpanded = expandedClientId === client.id;

            return (
              <div key={client.id} className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden transition-all">
                {/* Client Header (Clickable) */}
                <div 
                  onClick={() => toggleExpand(client.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                      {(client.name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{client.name || 'Sem Nome'}</h4>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                        <Phone size={14} />
                        <span>{client.phone || 'Sem Telefone'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {openBalance > 0 && (
                      <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-1 rounded-lg text-xs font-bold">
                        <AlertCircle size={14} />
                        {formatCurrency(openBalance)}
                      </div>
                    )}
                    {isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 animate-in slide-in-from-top-2 duration-200">
                    
                    {/* Address */}
                    <div className="flex items-start gap-2 text-sm text-slate-600 mb-4 bg-white p-3 rounded-xl border border-slate-100">
                      <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                      <p>{client.address || 'Nenhum endereço cadastrado.'}</p>
                    </div>

                    {/* Resumo Financeiro */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Comprado</span>
                        <span className="text-lg font-bold text-slate-800">{formatCurrency(clientSales.reduce((acc, s) => acc + s.totalValue, 0))}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Devendo</span>
                        <span className={`text-lg font-bold ${openBalance > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>{formatCurrency(openBalance)}</span>
                      </div>
                    </div>

                    {/* Sales History */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <ShoppingBag size={14} /> Histórico de Compras
                      </h5>
                      
                      {clientSales.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">Nenhuma compra registrada.</p>
                      ) : (
                        <div className="space-y-2">
                          {clientSales.map(sale => (
                            <div key={sale.id} className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col gap-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {new Date(sale.date).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-primary">{formatCurrency(sale.totalValue)}</p>
                                  {sale.remainingValue > 0 && (
                                    <p className="text-xs font-bold text-orange-500">Resta: {formatCurrency(sale.remainingValue)}</p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                {sale.items ? (
                                  <ul className="space-y-1">
                                    {sale.items.map((item, idx) => (
                                      <li key={idx} className="text-sm text-slate-700 flex justify-between">
                                        <span><span className="font-bold text-slate-400">{item.quantity}x</span> {item.name}</span>
                                        <span className="text-slate-500">{formatCurrency(item.price * item.quantity)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-slate-700">{getProductName(sale.productId || '')}</p>
                                )}
                              </div>
                              
                              {sale.remainingValue > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                  {payingSaleId === sale.id ? (
                                    <div className="flex gap-2 items-center">
                                      <input 
                                        type="text" 
                                        placeholder="R$ 0,00" 
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(formatPriceInput(e.target.value))}
                                        className="flex-1 rounded-lg border border-primary/20 bg-white focus:border-primary focus:ring-1 focus:ring-primary h-9 px-3 outline-none text-sm font-bold text-emerald-600"
                                      />
                                      <button 
                                        onClick={() => handleRegisterPayment(sale.id, sale.amountPaid, sale.remainingValue)}
                                        className="h-9 px-3 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors"
                                      >
                                        Salvar
                                      </button>
                                      <button 
                                        onClick={() => { setPayingSaleId(null); setPaymentAmount(''); }}
                                        className="h-9 px-3 bg-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-300 transition-colors"
                                      >
                                        X
                                      </button>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => { setPayingSaleId(sale.id); setPaymentAmount(formatPriceInput(sale.remainingValue.toFixed(2))); }}
                                      className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold py-2 rounded-lg hover:bg-emerald-100 transition-colors"
                                    >
                                      <CheckCircle size={14} /> Registrar Pagamento
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-200">
                      {payingClientId === client.id ? (
                        <div className="flex flex-col gap-2 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Registrar Pagamento (Dívida Total: {formatCurrency(openBalance)})</p>
                          <div className="flex gap-2 items-center">
                            <input 
                              type="text" 
                              placeholder="R$ 0,00" 
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(formatPriceInput(e.target.value))}
                              className="flex-1 rounded-lg border border-emerald-200 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 h-10 px-3 outline-none text-sm font-bold text-emerald-700"
                            />
                            <button 
                              onClick={() => handleRegisterClientPayment(client.id, openBalance)}
                              className="h-10 px-4 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors"
                            >
                              Salvar
                            </button>
                            <button 
                              onClick={() => { setPayingClientId(null); setPaymentAmount(''); }}
                              className="h-10 px-4 bg-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-300 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : deletingId === client.id ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => confirmDelete(client.id)}
                            className="flex-1 bg-red-500 text-white text-sm font-bold py-2 rounded-lg"
                          >
                            Confirmar Exclusão
                          </button>
                          <button 
                            onClick={() => setDeletingId(null)}
                            className="flex-1 bg-slate-200 text-slate-700 text-sm font-bold py-2 rounded-lg"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          {openBalance > 0 && (
                            <>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setPayingClientId(client.id); 
                                  setPaymentAmount(formatPriceInput(openBalance.toFixed(2))); 
                                  setPayingSaleId(null);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
                              >
                                <Wallet size={16} /> Quitar Dívida
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(client, openBalance, clientSales); }}
                                className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm font-bold py-2 px-4 rounded-lg hover:bg-emerald-100 transition-colors"
                              >
                                <MessageCircle size={16} /> Cobrar
                              </button>
                            </>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(client); }}
                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-primary/20 text-primary text-sm font-bold py-2 px-4 rounded-lg hover:bg-primary/5 transition-colors"
                          >
                            <Edit2 size={16} /> Editar
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDeletingId(client.id); }}
                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-red-200 text-red-500 text-sm font-bold py-2 px-4 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={16} /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredClients.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-primary/10">
              <User className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-slate-500 font-medium">Nenhum cliente encontrado.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
