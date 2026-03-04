'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import { Banknote, Star, TrendingUp, TrendingDown, ArrowUp, Wallet, PackageOpen } from 'lucide-react';
import { api, Product, Sale } from '@/lib/api';

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
        ) : (
          <>
            <div className="flex flex-wrap gap-4">
              {/* Total Sales */}
              <div className="flex min-w-[280px] flex-1 flex-col gap-3 rounded-xl p-6 bg-white shadow-sm border border-primary/5">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-sm font-medium">Total de Vendas</p>
                  <Banknote className="text-primary" size={20} />
                </div>
                <p className="text-3xl font-extrabold leading-tight text-gold">{formatCurrency(totalRevenue)}</p>
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

              {/* Pending Payments (Fiado) */}
              <div className="flex min-w-[280px] flex-1 flex-col gap-3 rounded-xl p-6 bg-primary text-white shadow-lg shadow-primary/40">
                <div className="flex items-center justify-between">
                  <p className="text-white/80 text-sm font-medium">Valores a Receber (Fiado)</p>
                  <Wallet size={20} />
                </div>
                <p className="text-3xl font-extrabold leading-tight">{formatCurrency(totalPending)}</p>
                <div className="flex items-center gap-1">
                  <p className="text-white text-sm font-bold">
                    <span className="text-white/70 font-normal">Acompanhe suas cobranças</span>
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
                <div className="text-right">
                  <p className="text-3xl font-black text-gold">{formatCurrency(currentMonthRevenue)}</p>
                  <p className="text-emerald-500 text-sm font-bold flex items-center justify-end">
                    <ArrowUp size={16} className="mr-1" />
                    Mês Atual
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-6 gap-4 items-end h-64 px-2">
                {last6Months.map((item, idx) => {
                  const heightPercent = Math.max((item.revenue / maxMonthlyRevenue) * 100, 5); // min 5% height for visibility
                  
                  return (
                    <div key={idx} className="flex flex-col items-center gap-3 h-full justify-end group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {formatCurrency(item.revenue)}
                      </div>
                      
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          item.isCurrent 
                            ? 'bg-gold shadow-lg shadow-gold/30' 
                            : 'bg-primary/20 hover:bg-primary/40'
                        }`} 
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                      <p className={`text-xs font-bold uppercase tracking-wider ${
                        item.isCurrent ? 'text-gold font-black' : 'text-slate-500'
                      }`}>
                        {item.month}
                      </p>
                    </div>
                  );
                })}
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
