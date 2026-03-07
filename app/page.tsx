'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import { Banknote, Star, TrendingUp, TrendingDown, ArrowUp, Wallet, PackageOpen, Plus, Users, Bell } from 'lucide-react';
import { api, Product, Sale } from '@/lib/api';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      try {
        const [fetchedSales, fetchedProducts] = await Promise.all([
          api.getSales(),
          api.getProducts()
        ]);
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

  // --- Calculations ---
  const { totalRevenue, totalPending, bestSellerName, bestSellerCount, last6Months, maxMonthlyRevenue, currentMonthRevenue, growth, topCategories } = useMemo(() => {
    // 1. Totals
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalValue, 0);
    const totalPending = sales.reduce((acc, sale) => acc + sale.remainingValue, 0);

    const productsById: Record<string, Product> = {};
    products.forEach(p => {
      productsById[p.id] = p;
    });

    // 2. Best Seller
    const productSales: Record<string, number> = {};
    sales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
        });
      } else if (sale.productId) {
        const p = productsById[sale.productId];
        if (p) productSales[p.name] = (productSales[p.name] || 0) + 1;
      }
    });
    
    const sortedProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]);
    const bestSellerName = sortedProducts.length > 0 ? sortedProducts[0][0] : 'Nenhum';
    const bestSellerCount = sortedProducts.length > 0 ? sortedProducts[0][1] : 0;

    // 3. Monthly Revenue (Last 6 months)
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentDate = new Date();
    
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5 + i, 1);
      return { 
        month: months[d.getMonth()], 
        year: d.getFullYear(), 
        revenue: 0,
        isCurrent: i === 5
      };
    });

    sales.forEach(sale => {
      const d = new Date(sale.date);
      const monthObj = last6Months.find(m => m.month === months[d.getMonth()] && m.year === d.getFullYear());
      if (monthObj) {
        monthObj.revenue += sale.totalValue;
      }
    });

    const maxMonthlyRevenue = Math.max(...last6Months.map(m => m.revenue), 100); // Minimum 100 to avoid div by 0
    const currentMonthRevenue = last6Months[5].revenue;
    const previousMonthRevenue = last6Months[4].revenue;
    
    let growth = 0;
    if (previousMonthRevenue > 0) {
      growth = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
    }

    // 4. Top Categories
    const categoryRevenue: Record<string, number> = {};
    sales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          const p = productsById[item.productId];
          const cat = p?.category || 'Outros';
          categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (item.price * item.quantity);
        });
      } else if (sale.productId) {
        const p = productsById[sale.productId];
        const cat = p?.category || 'Outros';
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + sale.totalValue;
      }
    });

    const topCategories = Object.entries(categoryRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, value], index) => {
        const colors = ['bg-gold', 'bg-primary/60', 'bg-primary/30'];
        return {
          name,
          value,
          percent: totalRevenue > 0 ? (value / totalRevenue) * 100 : 0,
          color: colors[index] || 'bg-slate-300'
        };
      });

    return { totalRevenue, totalPending, bestSellerName, bestSellerCount, last6Months, maxMonthlyRevenue, currentMonthRevenue, growth, topCategories };
  }, [sales, products]);

  if (!mounted) return null; // Prevent hydration mismatch

  const formatCurrency = (value: number) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const pendingPercentage = totalRevenue > 0 ? ((totalPending / totalRevenue) * 100).toFixed(1) : '0.0';
  const isPendingHigh = Number(pendingPercentage) > 30;

  return (
    <div className="min-h-screen bg-background-light">
      <Header 
        showMenu 
        showNotifications 
        showProfile 
        title="Dashboard" 
        bgColor="bg-primary" 
        textColor="text-white" 
      />
      
      <main className="max-w-2xl mx-auto p-4 md:p-6 space-y-6 pb-24">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-primary/10 shadow-sm mt-10">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Banknote className="text-primary" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Bem-vindo ao seu Dashboard!</h2>
            <p className="text-slate-500 mb-8 max-w-sm">
              Seu painel ganhará vida aqui. Que tal registrar sua primeira venda para começarmos?
            </p>
            <Link href="/vendas" className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center gap-2">
              <Plus size={20} />
              Registrar Primeira Venda
            </Link>
          </div>
        ) : (
          <>
            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3">
              <Link href="/vendas" className="flex flex-col items-center justify-center gap-2 bg-white p-3 rounded-xl border border-primary/10 shadow-sm hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Plus size={20} />
                </div>
                <span className="text-xs font-bold text-slate-700">Nova Venda</span>
              </Link>
              <Link href="/clientes" className="flex flex-col items-center justify-center gap-2 bg-white p-3 rounded-xl border border-primary/10 shadow-sm hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Users size={20} />
                </div>
                <span className="text-xs font-bold text-slate-700">Novo Cliente</span>
              </Link>
              <Link href="/clientes" className="flex flex-col items-center justify-center gap-2 bg-white p-3 rounded-xl border border-primary/10 shadow-sm hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <Bell size={20} />
                </div>
                <span className="text-xs font-bold text-slate-700">Cobrar Fiados</span>
              </Link>
            </div>

            <div className="flex flex-wrap gap-4">
              {/* Total Sales -> Vendas do Mês */}
              <div className="flex min-w-[280px] flex-1 flex-col gap-3 rounded-xl p-6 bg-white shadow-sm border border-primary/5">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-sm font-medium">Vendas do Mês</p>
                  <Banknote className="text-primary" size={20} />
                </div>
                <p className="text-3xl font-extrabold leading-tight text-gold">{formatCurrency(currentMonthRevenue)}</p>
                <div className="flex items-center gap-1">
                  {growth >= 0 ? (
                    <TrendingUp className="text-emerald-500" size={16} />
                  ) : (
                    <TrendingDown className="text-red-500" size={16} />
                  )}
                  <p className={`text-sm font-bold ${growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {growth >= 0 ? '+' : ''}{growth.toFixed(1)}% <span className="text-slate-400 font-normal">vs mês passado</span>
                  </p>
                </div>
              </div>

              {/* Pending Payments (Fiado) */}
              <div className={`flex min-w-[280px] flex-1 flex-col gap-3 rounded-xl p-6 text-white shadow-lg transition-colors ${isPendingHigh ? 'bg-orange-500 shadow-orange-500/40' : 'bg-primary shadow-primary/40'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-white/90 text-sm font-medium">Valores a Receber (Fiado)</p>
                  <Wallet size={20} />
                </div>
                <p className="text-3xl font-extrabold leading-tight">{formatCurrency(totalPending)}</p>
                <div className="flex items-center gap-1">
                  <p className="text-white text-sm font-bold">
                    {pendingPercentage}% <span className="text-white/80 font-normal">do faturamento total</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              {/* Best Seller */}
              <div className="flex min-w-[280px] flex-1 flex-col gap-3 rounded-xl p-6 bg-white shadow-sm border border-primary/5">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-sm font-medium">Produto Mais Vendido</p>
                  <Star className="text-primary" size={20} />
                </div>
                <p className="text-2xl font-extrabold leading-tight truncate" title={bestSellerName}>{bestSellerName}</p>
                <div className="flex items-center gap-1">
                  <PackageOpen className="text-primary/60" size={16} />
                  <p className="text-slate-600 text-sm font-bold">
                    {bestSellerCount} <span className="text-slate-400 font-normal">unidades vendidas</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Revenue Chart */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-primary/5">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Receita Mensal</h2>
                  <p className="text-slate-500 text-sm">Desempenho nos últimos 6 meses</p>
                </div>
              </div>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last6Months} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      tickFormatter={(value) => `R$ ${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [formatCurrency(value as number), 'Receita']}
                      labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                    />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                      {last6Months.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isCurrent ? '#F2A900' : '#4A154B'} fillOpacity={entry.isCurrent ? 1 : 0.7} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Categories */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-primary/5">
              <h3 className="text-lg font-bold mb-4">Categorias em Destaque</h3>
              
              {topCategories.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Nenhuma venda registrada ainda para calcular categorias.</p>
              ) : (
                <div className="space-y-4">
                  {topCategories.map((cat) => (
                    <div key={cat.name} className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span>{cat.name}</span>
                        <span>{formatCurrency(cat.value)}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`${cat.color} h-full rounded-full transition-all duration-1000`} 
                          style={{ width: `${cat.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
