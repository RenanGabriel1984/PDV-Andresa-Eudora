'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { PlusCircle, Sparkles, Palette, Heart, Droplet, Scissors, Brush, MoreVertical, Package, Edit2, X, Check } from 'lucide-react';
import { api, Product } from '@/lib/api';

export default function Estoque() {
  const [categories, setCategories] = useState(['Perfume', 'Shampoo', 'Makeup', 'Body Splash']);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [isViewingAll, setIsViewingAll] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  // Edit state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editingQuantityId, setEditingQuantityId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const fetchedProducts = await api.getProducts();
        setProducts(fetchedProducts);
        
        // Extract unique categories from products
        setCategories(prevCategories => {
          const uniqueCategories = new Set(prevCategories);
          fetchedProducts.forEach(p => uniqueCategories.add(p.category));
          return Array.from(uniqueCategories);
        });
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const formatPrice = (value: string) => {
    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    
    // Converte para decimal
    const amount = (parseInt(numbers) / 100).toFixed(2);
    
    // Formata para moeda brasileira
    return amount.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(formatPrice(e.target.value));
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setCategory(newCategory.trim());
      setNewCategory('');
      setIsAddingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !category || !quantity || !price) return;

    // Converte o preço formatado (ex: 1.234,56) para número (1234.56)
    const numericPrice = parseFloat(price.replace(/\./g, '').replace(',', '.'));

    try {
      const newProduct = await api.addProduct({
        name,
        category,
        quantity: parseInt(quantity),
        price: numericPrice,
        isFavorite: false
      });

      // Adiciona no início da lista para aparecer primeiro nos recentes
      setProducts([newProduct, ...products]);

      // Limpa o formulário
      setName('');
      setCategory('');
      setQuantity('');
      setPrice('');
    } catch (error: any) {
      console.error('Error adding product:', error);
      alert(`Erro ao salvar produto: ${error.message || 'Erro desconhecido'}. Verifique se as variáveis de ambiente do Supabase estão configuradas no Vercel e se o RLS está desativado.`);
    }
  };

  const toggleFavorite = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    try {
      const updatedProduct = await api.updateProduct(id, { isFavorite: !product.isFavorite });
      setProducts(products.map(p => p.id === id ? updatedProduct : p));
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  };

  const handleEditPrice = async (id: string) => {
    if (!editPrice) return;
    
    const numericPrice = parseFloat(editPrice.replace(/\./g, '').replace(',', '.'));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      alert('Preço inválido.');
      return;
    }

    try {
      const updatedProduct = await api.updateProduct(id, { price: numericPrice });
      setProducts(products.map(p => p.id === id ? updatedProduct : p));
      setEditingProductId(null);
      setEditPrice('');
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Erro ao atualizar preço.');
    }
  };

  const handleEditQuantity = async (id: string) => {
    if (!editQuantity) return;
    
    const numericQuantity = parseInt(editQuantity);
    if (isNaN(numericQuantity) || numericQuantity < 0) {
      alert('Quantidade inválida.');
      return;
    }

    try {
      const updatedProduct = await api.updateProduct(id, { quantity: numericQuantity });
      setProducts(products.map(p => p.id === id ? updatedProduct : p));
      setEditingQuantityId(null);
      setEditQuantity('');
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Erro ao atualizar quantidade.');
    }
  };

  const getCategoryIcon = (cat: string, size = 24) => {
    const lowerCat = (cat || '').toLowerCase();
    if (lowerCat.includes('perfume')) return <Droplet size={size} />;
    if (lowerCat.includes('shampoo') || lowerCat.includes('cabelo')) return <Scissors size={size} />;
    if (lowerCat.includes('makeup') || lowerCat.includes('maquiagem') || lowerCat.includes('batom')) return <Brush size={size} />;
    return <Package size={size} />;
  };

  const inStockProducts = showOutOfStock ? products : products.filter(p => p.quantity > 0);
  const favorites = inStockProducts.filter(p => p.isFavorite);
  
  const displayedProducts = selectedCategory === 'Todos' 
    ? (isViewingAll ? inStockProducts : inStockProducts.slice(0, 5))
    : inStockProducts.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background-light">
      <Header showBack showSearch bgColor="bg-primary" textColor="text-white" />
      
      <main className="max-w-2xl mx-auto pb-24">
        <div className="px-4 pt-4">
          <h2 className="text-slate-900 text-lg font-bold leading-tight text-center uppercase tracking-widest text-primary/80">
            Estoque de Produtos
          </h2>
        </div>

        <div className="flex gap-3 p-4 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => { setSelectedCategory('Todos'); setIsViewingAll(true); }}
            className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 transition-colors ${selectedCategory === 'Todos' ? 'bg-gold text-white' : 'bg-primary/10 text-primary border border-gold/40'}`}
          >
            <p className="text-sm font-medium">Todos</p>
          </button>
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => { setSelectedCategory(cat); setIsViewingAll(true); }}
              className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 transition-colors ${selectedCategory === cat ? 'bg-gold text-white' : 'bg-primary/10 text-primary border border-gold/40'}`}
            >
              <p className="text-sm font-medium">{cat}</p>
            </button>
          ))}
        </div>

        <div className="px-4 py-4">
          <h3 className="text-slate-900 text-xl font-bold leading-tight mb-4">Adicionar Novo Produto</h3>
          <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-primary/10 shadow-sm">
            <label className="flex flex-col w-full">
              <p className="text-slate-700 text-sm font-semibold pb-2">Nome do Produto</p>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Perfume Floral Intenso" 
                required
                className="flex w-full rounded-lg text-slate-900 border border-primary/20 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base outline-none"
              />
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col w-full">
                <p className="text-slate-700 text-sm font-semibold pb-2">Categoria</p>
                {isAddingCategory ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Nova categoria" 
                      className="flex w-full rounded-lg text-slate-900 border border-primary/20 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base outline-none"
                    />
                    <button 
                      type="button"
                      onClick={handleAddCategory}
                      className="h-12 px-4 bg-primary text-white rounded-lg font-bold"
                    >
                      Add
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsAddingCategory(false)}
                      className="h-12 px-4 bg-slate-200 text-slate-600 rounded-lg font-bold"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <select 
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === 'new') {
                        setIsAddingCategory(true);
                        setCategory('');
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    required
                    className="flex w-full rounded-lg text-slate-900 border border-primary/20 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base outline-none"
                  >
                    <option value="">Selecione...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="new" className="font-bold text-primary">+ Nova Categoria</option>
                  </select>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col w-full">
                  <p className="text-slate-700 text-sm font-semibold pb-2">Quantidade</p>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0" 
                    min="0"
                    required
                    className="flex w-full rounded-lg text-slate-900 border border-primary/20 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base outline-none"
                  />
                </label>
                <label className="flex flex-col w-full">
                  <p className="text-slate-700 text-sm font-semibold pb-2">Preço (R$)</p>
                  <input 
                    type="text" 
                    value={price}
                    onChange={handlePriceChange}
                    placeholder="0,00" 
                    required
                    className="flex w-full rounded-lg text-slate-900 border border-primary/20 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base outline-none"
                  />
                </label>
              </div>
            </div>
            
            <button type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mt-4">
              <PlusCircle className="text-gold" size={24} />
              Salvar Produto
            </button>
          </form>
        </div>

        <div className="px-4 py-2 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-900 text-lg font-bold">Favoritos (Mais Vendidos)</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {favorites.length === 0 ? (
              <div className="w-full text-center py-4 text-slate-500 text-sm bg-white rounded-xl border border-primary/5">
                Nenhum produto marcado como favorito.
              </div>
            ) : (
              favorites.map(fav => (
                <div key={fav.id} className="min-w-[180px] bg-white p-5 rounded-2xl border border-gold/30 shadow-md flex flex-col gap-3 relative group shrink-0 hover:border-gold/60 transition-colors">
                  <button 
                    onClick={() => toggleFavorite(fav.id)}
                    className="absolute top-3 right-3 text-gold hover:scale-110 transition-transform"
                  >
                    <Heart size={20} fill="currentColor" />
                  </button>
                  
                  <div className="size-14 rounded-xl bg-gradient-to-br from-primary/10 to-gold/10 flex items-center justify-center text-primary shadow-inner">
                    {getCategoryIcon(fav.category, 28)}
                  </div>
                  
                  <div className="mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary/60 block mb-1">{fav.category}</span>
                    <p className="text-slate-900 font-bold text-base leading-tight line-clamp-2 pr-4">{fav.name}</p>
                  </div>
                  
                  <div className="mt-auto pt-2 border-t border-slate-100">
                    <p className="text-primary font-black text-lg">
                      R$ {(fav.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="px-4 py-2 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-900 text-lg font-bold">
              {selectedCategory === 'Todos' 
                ? (isViewingAll ? 'Todos os Produtos' : 'Itens Recentes') 
                : `Categoria: ${selectedCategory}`}
            </h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                <input 
                  type="checkbox" 
                  checked={showOutOfStock}
                  onChange={(e) => setShowOutOfStock(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                Mostrar esgotados
              </label>
              {(!isViewingAll || selectedCategory !== 'Todos') && (
                <span 
                  onClick={() => { setSelectedCategory('Todos'); setIsViewingAll(true); }}
                  className="text-sm font-bold cursor-pointer text-primary"
                >
                  Ver todos
                </span>
              )}
            </div>
          </div>
          
          {displayedProducts.length === 0 ? (
            <div className="w-full text-center py-8 text-slate-500 text-sm bg-white rounded-xl border border-primary/5">
              Nenhum produto encontrado nesta categoria.
            </div>
          ) : (
            displayedProducts.map(product => (
              <div key={product.id} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-primary/5 shadow-sm">
                <div className="size-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {getCategoryIcon(product.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 font-bold truncate">{product.name}</p>
                  <p className="text-slate-500 text-xs truncate">{product.category} • {product.quantity} un. em estoque</p>
                </div>
                <div className="text-right flex flex-col items-end shrink-0">
                  {editingProductId === product.id ? (
                    <div className="flex items-center gap-1 mb-1">
                      <input 
                        type="text" 
                        value={editPrice}
                        onChange={(e) => setEditPrice(formatPrice(e.target.value))}
                        className="w-20 rounded border border-primary/30 px-1 py-0.5 text-sm text-right font-bold text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleEditPrice(product.id)}
                        className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={() => { setEditingProductId(null); setEditPrice(''); }}
                        className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setEditingProductId(product.id); setEditPrice(formatPrice(product.price.toFixed(2))); }}>
                      <p className="text-primary font-bold">
                        R$ {(product.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <Edit2 size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <button 
                      onClick={() => toggleFavorite(product.id)}
                      className={`${product.isFavorite ? 'text-gold' : 'text-slate-300 hover:text-gold'}`}
                    >
                      <Heart size={18} fill={product.isFavorite ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
