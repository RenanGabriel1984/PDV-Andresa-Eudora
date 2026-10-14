"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  ChevronDown,
  X,
  Plus,
  Package,
  ShoppingCart,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { Client, Product } from "@/lib/api";
import { CartItem } from "./types";

interface VendasCarrinhoProps {
  clients: Client[];
  clientsById: Record<string, Client>;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  isAddingClient: boolean;
  setIsAddingClient: (val: boolean) => void;
  newClientName: string;
  setNewClientName: (val: string) => void;
  newClientPhone: string;
  setNewClientPhone: (val: string) => void;
  newClientAddress: string;
  setNewClientAddress: (val: string) => void;
  handleAddClient: () => Promise<void>;
  getClientDebt: (clientId: string) => number;

  products: Product[];
  selectedProductIdToAdd: string;
  setSelectedProductIdToAdd: (id: string) => void;
  isAddingProduct: boolean;
  setIsAddingProduct: (val: boolean) => void;
  newProductName: string;
  setNewProductName: (val: string) => void;
  newProductPrice: string;
  setNewProductPrice: (val: string) => void;
  handleAddProduct: () => Promise<void>;
  handleAddToCart: () => void;

  cart: CartItem[];
  handleRemoveFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, delta: number) => void;
  editingCartItemId: string | null;
  setEditingCartItemId: (id: string | null) => void;
  editCartItemPrice: string;
  setEditCartItemPrice: (val: string) => void;
  handleEditCartItemPrice: (productId: string) => void;

  totalValue: number;
  formatCurrency: (val: number) => string;
  formatPriceInput: (val: string) => string;
  onProceedToPayment: () => void;
}

export default function VendasCarrinho({
  clients,
  clientsById,
  selectedClientId,
  setSelectedClientId,
  isAddingClient,
  setIsAddingClient,
  newClientName,
  setNewClientName,
  newClientPhone,
  setNewClientPhone,
  newClientAddress,
  setNewClientAddress,
  handleAddClient,
  getClientDebt,

  products,
  selectedProductIdToAdd,
  setSelectedProductIdToAdd,
  isAddingProduct,
  setIsAddingProduct,
  newProductName,
  setNewProductName,
  newProductPrice,
  setNewProductPrice,
  handleAddProduct,
  handleAddToCart,

  cart,
  handleRemoveFromCart,
  updateCartQuantity,
  editingCartItemId,
  setEditingCartItemId,
  editCartItemPrice,
  setEditCartItemPrice,
  handleEditCartItemPrice,

  totalValue,
  formatCurrency,
  formatPriceInput,
  onProceedToPayment,
}: VendasCarrinhoProps) {
  // Autocomplete UI states
  const [clientSearchText, setClientSearchText] = useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  const [productSearchText, setProductSearchText] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target as Node)
      ) {
        setIsClientDropdownOpen(false);
      }
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProductDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.div
      key="cart"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* CLIENT SECTION */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary italic">
            Dados do Cliente
          </h3>
          {!isAddingClient && (
            <button
              onClick={() => setIsAddingClient(true)}
              className="text-primary flex items-center gap-1 text-xs font-bold bg-primary/10 px-2 py-1 rounded-lg hover:bg-primary/20 transition-colors"
            >
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
              <button
                onClick={() => setIsAddingClient(false)}
                className="flex-1 h-10 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddClient}
                className="flex-1 h-10 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        ) : (
          <div className="relative" ref={clientDropdownRef}>
            <label className="flex flex-col gap-1.5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={
                    isClientDropdownOpen
                      ? clientSearchText
                      : selectedClientId
                        ? clientsById[selectedClientId]?.name
                        : ""
                  }
                  onChange={(e) => {
                    setClientSearchText(e.target.value);
                    setIsClientDropdownOpen(true);
                    if (selectedClientId) setSelectedClientId("");
                  }}
                  onFocus={() => setIsClientDropdownOpen(true)}
                  className="w-full rounded-xl border-primary/20 bg-white text-slate-900 focus:border-primary focus:ring-primary h-14 pl-11 pr-10 outline-none border shadow-sm transition-all"
                />
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gold"
                  size={20}
                />
                {isClientDropdownOpen && clientSearchText ? (
                  <button
                    onClick={() => {
                      setClientSearchText("");
                      setSelectedClientId("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={18} />
                  </button>
                ) : (
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary"
                    size={24}
                  />
                )}
              </div>
            </label>

            <AnimatePresence>
              {isClientDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-xl border border-primary/10 max-h-60 overflow-y-auto"
                >
                  {clients.filter((c) =>
                    c.name
                      .toLowerCase()
                      .includes(clientSearchText.toLowerCase()),
                  ).length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">
                      Nenhum cliente encontrado.
                    </div>
                  ) : (
                    clients
                      .filter((c) =>
                        c.name
                          .toLowerCase()
                          .includes(clientSearchText.toLowerCase()),
                      )
                      .map((c) => {
                        const debt = getClientDebt(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedClientId(c.id);
                              setIsClientDropdownOpen(false);
                              setClientSearchText("");
                            }}
                            className="px-4 py-3 hover:bg-primary/5 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center"
                          >
                            <span className="font-bold text-slate-700">
                              {c.name}
                            </span>
                            {debt > 0 && (
                              <span className="text-[10px] uppercase font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                Débito: {formatCurrency(debt)}
                              </span>
                            )}
                          </div>
                        );
                      })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* PRODUCT SECTION */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary italic">
            Produtos
          </h3>
          {!isAddingProduct && (
            <button
              onClick={() => setIsAddingProduct(true)}
              className="text-primary flex items-center gap-1 text-xs font-bold bg-primary/10 px-2 py-1 rounded-lg hover:bg-primary/20 transition-colors"
            >
              <Plus size={14} /> Novo Produto
            </button>
          )}
        </div>

        {isAddingProduct ? (
          <div className="bg-white p-4 rounded-xl border border-primary/20 space-y-3 shadow-sm">
            <p className="text-xs text-slate-500 mb-2">
              Adicione um produto do catálogo ou fora do estoque.
            </p>
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
              onChange={(e) =>
                setNewProductPrice(formatPriceInput(e.target.value))
              }
              className="w-full rounded-lg border-primary/20 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsAddingProduct(false)}
                className="flex-1 h-10 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddProduct}
                className="flex-1 h-10 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1" ref={productDropdownRef}>
              <input
                type="text"
                placeholder="Buscar produto..."
                value={
                  isProductDropdownOpen
                    ? productSearchText
                    : selectedProductIdToAdd
                      ? products.find((p) => p.id === selectedProductIdToAdd)?.name
                      : ""
                }
                onChange={(e) => {
                  setProductSearchText(e.target.value);
                  setIsProductDropdownOpen(true);
                  if (selectedProductIdToAdd) setSelectedProductIdToAdd("");
                }}
                onFocus={() => setIsProductDropdownOpen(true)}
                className="w-full rounded-xl border-primary/20 bg-white text-slate-900 focus:border-primary focus:ring-primary h-14 pl-11 pr-10 outline-none border shadow-sm transition-all"
              />
              <Package
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gold"
                size={20}
              />
              {isProductDropdownOpen && productSearchText ? (
                <button
                  onClick={() => {
                    setProductSearchText("");
                    setSelectedProductIdToAdd("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              ) : (
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary"
                  size={24}
                />
              )}

              <AnimatePresence>
                {isProductDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-xl border border-primary/10 max-h-60 overflow-y-auto"
                  >
                    {products.filter(
                      (p) =>
                        p.quantity > 0 &&
                        p.name
                          .toLowerCase()
                          .includes(productSearchText.toLowerCase()),
                    ).length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-sm">
                        Nenhum produto em estoque.
                      </div>
                    ) : (
                      products
                        .filter(
                          (p) =>
                            p.quantity > 0 &&
                            p.name
                              .toLowerCase()
                              .includes(productSearchText.toLowerCase()),
                        )
                        .map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedProductIdToAdd(p.id);
                              setIsProductDropdownOpen(false);
                              setProductSearchText("");
                            }}
                            className="px-4 py-3 hover:bg-primary/5 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center"
                          >
                            <span className="font-bold text-slate-700">
                              {p.name}
                            </span>
                            <span className="text-sm text-primary font-bold">
                              {formatCurrency(p.price)}
                            </span>
                          </div>
                        ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={handleAddToCart}
              className="h-14 px-5 bg-primary text-white rounded-xl font-bold shadow-sm hover:bg-primary/90 transition-transform active:scale-95"
            >
              Add
            </button>
          </div>
        )}

        {/* CART ITEMS */}
        {cart.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary italic flex items-center gap-2">
              <ShoppingCart size={16} /> Carrinho
            </h3>
            <div className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3 border-b border-slate-100 last:border-0 flex justify-between items-center"
                >
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-sm">
                      {item.product.name}
                    </p>
                    {editingCartItemId === item.product.id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={editCartItemPrice}
                          onChange={(e) =>
                            setEditCartItemPrice(
                              formatPriceInput(e.target.value),
                            )
                          }
                          className="w-28 rounded-lg border border-primary/30 px-2 py-1 text-sm font-bold text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          autoFocus
                        />
                        <button
                          onClick={() =>
                            handleEditCartItemPrice(item.product.id)
                          }
                          className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCartItemId(null);
                            setEditCartItemPrice("");
                          }}
                          className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="text-primary font-bold text-sm cursor-pointer hover:underline flex items-center gap-1 mt-1"
                        onClick={() => {
                          setEditingCartItemId(item.product.id);
                          setEditCartItemPrice(
                            formatPriceInput(item.product.price.toFixed(2)),
                          );
                        }}
                      >
                        {formatCurrency(item.product.price)} un.
                        <span className="text-xs text-slate-400 font-normal">
                          (editar)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-100 rounded-lg">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, -1)}
                        className="w-10 h-10 flex items-center justify-center text-slate-600 font-bold active:scale-95 transition-transform"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-sm font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, 1)}
                        className="w-10 h-10 flex items-center justify-center text-slate-600 font-bold active:scale-95 transition-transform"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.product.id)}
                      className="text-red-400 hover:text-red-600 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex justify-between items-center mt-4">
          <div>
            <p className="text-xs text-slate-500">Total da Venda</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(totalValue)}
            </p>
          </div>
          <ShoppingCart className="text-primary" size={32} />
        </div>
      </section>

      <div className="pt-4">
        <button
          onClick={onProceedToPayment}
          className="w-full h-14 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          Prosseguir para Pagamento
        </button>
      </div>
    </motion.div>
  );
}
