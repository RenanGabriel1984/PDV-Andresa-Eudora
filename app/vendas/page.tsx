"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import Header from "@/components/Header";
import { api, Client, Product, Sale, Payment } from "@/lib/api";
import { logPaymentAction } from "@/lib/auditLog";
import { getStoreSettings } from "@/lib/storeSettings";
import { exportToExcel, exportToPDF } from "@/lib/export";
import PaymentAuditModal from "@/components/PaymentAuditModal";

import { CartItem } from "@/components/vendas/types";
import VendasCarrinho from "@/components/vendas/VendasCarrinho";
import VendasOpcoesPagamento from "@/components/vendas/VendasOpcoesPagamento";
import VendasHistoricoList from "@/components/vendas/VendasHistoricoList";
import VendasSummaryModal from "@/components/vendas/VendasSummaryModal";
import VendasEditPaymentModal from "@/components/vendas/VendasEditPaymentModal";

export default function Vendas() {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedClients, fetchedProducts, fetchedSales] =
          await Promise.all([
            api.getClients(),
            api.getProducts(),
            api.getSales(),
          ]);
        setClients(fetchedClients);
        setProducts(fetchedProducts);
        setSales(fetchedSales);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const [selectedClientId, setSelectedClientId] = useState("");

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [paymentNotes, setPaymentNotes] = useState("");

  const [paymentStatus, setPaymentStatus] = useState<
    "pago" | "parcial" | "a_receber"
  >("pago");
  const [amountPaid, setAmountPaid] = useState("");

  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");

  const [showSummary, setShowSummary] = useState(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [activeTab, setActiveTab] = useState<"nova" | "historico">("nova");
  const [filterDate, setFilterDate] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "payment">("cart");

  // Edit payment modal state
  const [editingPayment, setEditingPayment] = useState<{
    saleId: string;
    payment: Payment;
  } | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState("");
  const [editPaymentDate, setEditPaymentDate] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("Pix");
  const [editPaymentNotes, setEditPaymentNotes] = useState("");
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Editing cart item price
  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(
    null,
  );
  const [editCartItemPrice, setEditCartItemPrice] = useState("");

  const clientsById = useMemo(() => {
    const map: Record<string, Client> = {};
    clients.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [clients]);

  const overduePendingSalesCount = useMemo(() => {
    const now = new Date().getTime();
    return sales.filter((s) => {
      if (!s.remainingValue || s.remainingValue <= 0) return false;
      const saleTime = s.date ? new Date(s.date).getTime() : 0;
      const diffDays = Math.floor((now - saleTime) / (1000 * 60 * 60 * 24));
      return diffDays > 30;
    }).length;
  }, [sales]);

  const filteredSales = useMemo(() => {
    return sales
      .filter((sale) => {
        let matchDate = true;
        let matchClient = true;

        if (filterDate) {
          matchDate = (sale.date || "").startsWith(filterDate);
        }
        if (filterClient) {
          const client = clientsById[sale.clientId];
          const searchTerm = filterClient.toLowerCase();
          matchClient =
            (client?.name || "").toLowerCase().includes(searchTerm) ||
            (sale.clientId || "").toLowerCase().includes(searchTerm);
        }

        if (filterOverdueOnly) {
          const now = new Date().getTime();
          const saleTime = sale.date ? new Date(sale.date).getTime() : 0;
          const diffDays = Math.floor((now - saleTime) / (1000 * 60 * 60 * 24));
          if (!((sale.remainingValue || 0) > 0 && diffDays > 30)) {
            return false;
          }
        }

        return matchDate && matchClient;
      })
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
  }, [sales, filterDate, filterClient, filterOverdueOnly, clientsById]);

  const selectedClient = useMemo(
    () => clientsById[selectedClientId] || null,
    [clientsById, selectedClientId],
  );

  const getClientDebt = (clientId: string) => {
    return sales
      .filter((s) => s.clientId === clientId && (s.remainingValue || 0) > 0)
      .reduce((sum, s) => sum + (s.remainingValue || 0), 0);
  };

  const totalValue = useMemo(
    () =>
      cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart],
  );

  const formatCurrency = (value: number) => {
    return (value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatPriceInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    const amount = (parseInt(numbers) / 100).toFixed(2);
    return amount.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parsePriceInput = (value: string) => {
    return parseFloat(value.replace(/\./g, "").replace(",", "."));
  };

  const handleAddClient = async () => {
    if (!newClientName || !newClientPhone) return;

    try {
      const newClient = await api.addClient({
        name: newClientName,
        phone: newClientPhone.replace(/\D/g, ""),
        address: newClientAddress,
      });

      setClients([...clients, newClient]);
      setSelectedClientId(newClient.id);
      setIsAddingClient(false);
      setNewClientName("");
      setNewClientPhone("");
      setNewClientAddress("");
    } catch (error: any) {
      console.error("Error adding client:", error);
      alert(
        `Erro ao adicionar cliente: ${error.message || "Erro desconhecido"}. Verifique se as variáveis de ambiente do Supabase estão configuradas no Vercel e se o RLS está desativado.`,
      );
    }
  };

  const handleAddProduct = async () => {
    if (!newProductName || !newProductPrice) return;

    try {
      const newProduct = await api.addProduct({
        name: newProductName,
        price: parsePriceInput(newProductPrice),
        category: "Outros",
        quantity: 0,
        isFavorite: false,
      });

      setProducts([...products, newProduct]);

      // Add directly to cart
      setCart([...cart, { product: newProduct, quantity: 1 }]);

      setIsAddingProduct(false);
      setNewProductName("");
      setNewProductPrice("");
    } catch (error: any) {
      console.error("Error adding product:", error);
      alert(
        `Erro ao adicionar produto: ${error.message || "Erro desconhecido"}. Verifique se as variáveis de ambiente do Supabase estão configuradas no Vercel e se o RLS está desativado.`,
      );
    }
  };

  const handleAddToCart = () => {
    if (!selectedProductIdToAdd) return;
    const product = products.find((p) => p.id === selectedProductIdToAdd);
    if (!product) return;

    const existingItem = cart.find((item) => item.product.id === product.id);
    const currentQuantityInCart = existingItem ? existingItem.quantity : 0;

    if (currentQuantityInCart + 1 > product.quantity) {
      alert(
        `Estoque insuficiente. Você só tem ${product.quantity} unidades de ${product.name} em estoque.`,
      );
      return;
    }

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    setSelectedProductIdToAdd("");
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(
      cart.map((item) => {
        if (item.product.id === productId) {
          const newQ = Math.max(1, item.quantity + delta);
          if (newQ > item.product.quantity) {
            alert(
              `Estoque insuficiente. Você só tem ${item.product.quantity} unidades de ${item.product.name} em estoque.`,
            );
            return item;
          }
          return { ...item, quantity: newQ };
        }
        return item;
      }),
    );
  };

  const handleEditCartItemPrice = (productId: string) => {
    if (!editCartItemPrice) return;

    const numericPrice = parseFloat(
      editCartItemPrice.replace(/\./g, "").replace(",", "."),
    );
    if (isNaN(numericPrice) || numericPrice <= 0) {
      alert("Preço inválido.");
      return;
    }

    setCart(
      cart.map((item) => {
        if (item.product.id === productId) {
          return { ...item, product: { ...item.product, price: numericPrice } };
        }
        return item;
      }),
    );
    setEditingCartItemId(null);
    setEditCartItemPrice("");
  };

  const handleFinalizarVenda = async () => {
    if (!selectedClientId || cart.length === 0) {
      alert("Selecione um cliente e adicione pelo menos um produto.");
      return;
    }

    const paid =
      paymentStatus === "pago"
        ? totalValue
        : paymentStatus === "parcial" && amountPaid
          ? parsePriceInput(amountPaid)
          : 0;
    const remaining = totalValue - paid;

    let defaultPayments: Payment[] = [];
    if (paid > 0) {
      defaultPayments = [
        {
          id: Math.random().toString(36).substring(2, 9),
          amount: paid,
          paymentDate: new Date().toISOString(),
          paymentMethod: paymentMethod,
          createdAt: new Date().toISOString(),
          notes: paymentNotes || "Pagamento inicial da venda",
        },
      ];
    }

    try {
      const saleItems = cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      }));

      if (editingSaleId) {
        // Find existing to preserve payments if editing
        const existingSale = sales.find((s) => s.id === editingSaleId);
        let updatedPayments = existingSale?.payments || [];

        if (updatedPayments.length === 0 && paid > 0) {
          updatedPayments = defaultPayments;
        }

        const updatedSale = await api.updateSaleWithItems(
          editingSaleId,
          {
            clientId: selectedClientId,
            totalValue,
            amountPaid: paid,
            remainingValue: remaining,
            paymentMethod,
            payments: updatedPayments,
          },
          saleItems,
        );

        setSales(sales.map((s) => (s.id === editingSaleId ? updatedSale : s)));
        setCurrentSale(updatedSale);
        setEditingSaleId(null);
      } else {
        const newSale = await api.addSale(
          {
            clientId: selectedClientId,
            totalValue,
            amountPaid: paid,
            remainingValue: remaining,
            paymentMethod,
            date: new Date().toISOString(),
            payments: defaultPayments,
          },
          saleItems,
        );

        setSales([...sales, newSale]);
        setCurrentSale(newSale);
      }

      // Update local products state to reflect new stock
      const updatedProducts = await api.getProducts();
      setProducts(updatedProducts);

      setShowSummary(true);
    } catch (error: any) {
      console.error("Error finalizing sale:", error);
      alert(
        `Erro ao finalizar venda: ${error.message || "Erro desconhecido"}. Verifique se as variáveis de ambiente do Supabase estão configuradas no Vercel e se o RLS está desativado.`,
      );
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita e o saldo do cliente será recalculado.",
      )
    )
      return;
    try {
      await api.deleteSale(saleId);
      setSales(sales.filter((s) => s.id !== saleId));

      // Update local products state to reflect reverted stock
      const updatedProducts = await api.getProducts();
      setProducts(updatedProducts);
    } catch (error) {
      console.error("Error deleting sale:", error);
      alert("Erro ao excluir a venda.");
    }
  };

  const handleOpenEditPayment = (saleId: string, payment: Payment) => {
    setEditingPayment({ saleId, payment });
    setEditPaymentAmount(formatPriceInput((payment.amount * 100).toFixed(0)));
    setEditPaymentDate(
      payment.paymentDate
        ? payment.paymentDate.split("T")[0]
        : new Date().toISOString().split("T")[0],
    );
    setEditPaymentMethod(payment.paymentMethod || "Pix");
    setEditPaymentNotes(payment.notes || "");
  };

  const handleSaveEditPayment = async () => {
    if (!editingPayment) return;
    const newAmount = parsePriceInput(editPaymentAmount);
    if (isNaN(newAmount) || newAmount <= 0) {
      alert("Por favor, digite um valor válido maior que zero.");
      return;
    }

    try {
      const currentTargetSale = sales.find((s) => s.id === editingPayment.saleId);
      if (!currentTargetSale) return;

      const updatedPayments = (currentTargetSale.payments || []).map((p) => {
        if (p.id === editingPayment.payment.id) {
          return {
            ...p,
            amount: newAmount,
            paymentDate: editPaymentDate
              ? new Date(editPaymentDate + "T12:00:00").toISOString()
              : p.paymentDate,
            paymentMethod: editPaymentMethod,
            notes: editPaymentNotes,
          };
        }
        return p;
      });

      const newAmountPaid = updatedPayments.reduce(
        (acc, p) => acc + p.amount,
        0,
      );
      const newRemainingValue = Math.max(
        0,
        currentTargetSale.totalValue - newAmountPaid,
      );

      await api.updateSale(editingPayment.saleId, {
        amountPaid: newAmountPaid,
        remainingValue: newRemainingValue,
        payments: updatedPayments,
      });

      // Audit log for payment edition
      const clientObj = clients.find((c) => c.id === currentTargetSale.clientId);
      await logPaymentAction({
        action: "EDIT",
        saleId: editingPayment.saleId,
        clientId: currentTargetSale.clientId,
        clientName: clientObj?.name,
        paymentId: editingPayment.payment.id,
        oldAmount: editingPayment.payment.amount,
        newAmount: newAmount,
        oldMethod: editingPayment.payment.paymentMethod,
        newMethod: editPaymentMethod,
        oldDate: editingPayment.payment.paymentDate,
        newDate: editPaymentDate,
        notes: editPaymentNotes,
      });

      setSales(
        sales.map((s) =>
          s.id === editingPayment.saleId
            ? {
                ...s,
                amountPaid: newAmountPaid,
                remainingValue: newRemainingValue,
                payments: updatedPayments,
              }
            : s,
        ),
      );

      setEditingPayment(null);
      alert("Pagamento atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating payment:", error);
      alert("Erro ao salvar alterações no pagamento.");
    }
  };

  const handleUndoPayment = async (
    saleId: string,
    paymentId: string,
    paymentAmount: number,
  ) => {
    const confirmed = window.confirm(
      `Deseja realmente excluir APENAS este pagamento de ${formatCurrency(paymentAmount)}?\n\nOs outros pagamentos desta venda continuarão salvos e preservados.`,
    );
    if (!confirmed) return;

    try {
      const currentTargetSale = sales.find((s) => s.id === saleId);
      if (!currentTargetSale) return;

      const paymentToDelete = (currentTargetSale.payments || []).find(
        (p) => p.id === paymentId,
      );
      const clientObj = clients.find((c) => c.id === currentTargetSale.clientId);

      // Record audit log for deletion
      await logPaymentAction({
        action: "DELETE",
        saleId: saleId,
        clientId: currentTargetSale.clientId,
        clientName: clientObj?.name,
        paymentId: paymentId,
        oldAmount: paymentAmount,
        newAmount: 0,
        oldMethod: paymentToDelete?.paymentMethod,
        oldDate: paymentToDelete?.paymentDate,
        notes: paymentToDelete?.notes || "Exclusão individual de pagamento",
      });

      const updatedPayments = (currentTargetSale.payments || []).filter(
        (p) => p.id !== paymentId,
      );

      const newAmountPaid = updatedPayments.reduce(
        (acc, p) => acc + p.amount,
        0,
      );
      const newRemainingValue = Math.max(
        0,
        currentTargetSale.totalValue - newAmountPaid,
      );

      await api.updateSale(saleId, {
        amountPaid: newAmountPaid,
        remainingValue: newRemainingValue,
        payments: updatedPayments,
      });

      setSales(
        sales.map((s) =>
          s.id === saleId
            ? {
                ...s,
                amountPaid: newAmountPaid,
                remainingValue: newRemainingValue,
                payments: updatedPayments,
              }
            : s,
        ),
      );
    } catch (error) {
      console.error("Error undoing payment:", error);
      alert("Erro ao desfazer o pagamento.");
    }
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSaleId(sale.id);
    setSelectedClientId(sale.clientId);
    setPaymentMethod(sale.paymentMethod);

    if (sale.amountPaid === 0) {
      setPaymentStatus("a_receber");
      setAmountPaid("");
    } else if (sale.amountPaid < sale.totalValue) {
      setPaymentStatus("parcial");
      setAmountPaid(
        sale.amountPaid.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      );
    } else {
      setPaymentStatus("pago");
      setAmountPaid("");
    }

    let newCart: CartItem[] = [];
    const adjustedProducts = [...products];

    if (sale.items && sale.items.length > 0) {
      newCart = sale.items.map((item) => {
        const actualProduct = products.find((p) => p.id === item.productId);

        if (actualProduct) {
          const productIndex = adjustedProducts.findIndex(
            (p) => p.id === actualProduct.id,
          );
          if (productIndex !== -1) {
            adjustedProducts[productIndex] = {
              ...adjustedProducts[productIndex],
              quantity: adjustedProducts[productIndex].quantity + item.quantity,
            };
          }

          return {
            product: actualProduct,
            quantity: item.quantity,
          };
        }

        return {
          product: {
            id: item.productId,
            name: item.name,
            price: item.price,
            category: "Outros",
            quantity: item.quantity,
            isFavorite: false,
          },
          quantity: item.quantity,
        };
      });
    } else if (sale.productId) {
      // Legacy sale support
      const actualProduct = products.find((p) => p.id === sale.productId);
      if (actualProduct) {
        const productIndex = adjustedProducts.findIndex(
          (p) => p.id === actualProduct.id,
        );
        if (productIndex !== -1) {
          adjustedProducts[productIndex] = {
            ...adjustedProducts[productIndex],
            quantity: adjustedProducts[productIndex].quantity + 1,
          };
        }
        newCart = [{ product: actualProduct, quantity: 1 }];
      }
    }

    setProducts(adjustedProducts);
    setCart(newCart);
    setActiveTab("nova");
  };

  const handleWhatsApp = (saleToSend?: Sale) => {
    const sale = saleToSend || currentSale;
    if (!sale) return;

    const client = clientsById[sale.clientId] || selectedClient;
    if (!client) return;

    const emojiFlower = "\uD83C\uDF38";
    const emojiBag = "\uD83D\uDECD\uFE0F";
    const emojiMoney = "\uD83D\uDCB0";
    const emojiCheck = "\u2705";
    const emojiHourglass = "\u23F3";
    const emojiSparkles = "\u2728";

    const settings = getStoreSettings();

    let message = `Olá ${client.name}! ${emojiFlower}\n\n`;
    if (settings.storeName) {
      message = `Olá ${client.name}! Aqui é da *${settings.storeName}* ${emojiFlower}\n\n`;
    }

    message += `Aqui está o resumo da sua compra:\n`;

    sale.items?.forEach((item) => {
      message += `${emojiBag} ${item.quantity}x *${item.name}* - ${formatCurrency(item.price * item.quantity)}\n`;
    });

    message += `\n${emojiMoney} Valor Total: *${formatCurrency(sale.totalValue)}*\n\n`;

    if (sale.remainingValue > 0) {
      message += `${emojiCheck} Valor Pago: *${formatCurrency(sale.amountPaid)}*\n`;

      if (sale.payments && sale.payments.length > 0) {
        message += `*Histórico de pagamentos:*\n`;
        sale.payments.forEach((payment) => {
          message += `  - ${new Date(payment.paymentDate).toLocaleDateString("pt-BR")}: ${formatCurrency(payment.amount)}\n`;
        });
      }

      message += `${emojiHourglass} Restante a pagar: *${formatCurrency(sale.remainingValue)}*\n\n`;
    }

    message += `Forma de pagamento escolhida: *${sale.paymentMethod}*\n\n`;

    if (sale.paymentMethod === "Pix" && settings.pixKey) {
      message += `Nossa chave PIX é: *${settings.pixKey}*\n\n`;
    }

    message += `Qualquer dúvida, estou à disposição! ${emojiSparkles}`;

    const cleanMessage = message
      .replace(/[\u00A0\u202F]/g, " ")
      .replace(/\n/g, "\r\n");
    const encodedMessage = encodeURIComponent(cleanMessage);
    const whatsappUrl = `https://wa.me/55${client.phone}?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");

    if (!saleToSend) {
      setShowSummary(false);
      setSelectedClientId("");
      setCart([]);
      setPaymentStatus("pago");
      setAmountPaid("");
      setPaymentNotes("");
      setEditingSaleId(null);
      setCheckoutStep("cart");
    }
  };

  const handleExportExcel = () => {
    const data = filteredSales.map((sale) => {
      const client = clients.find((c) => c.id === sale.clientId);
      return {
        Data: new Date(sale.date).toLocaleString("pt-BR"),
        Cliente: client?.name || "Desconhecido",
        "Valor Total": sale.totalValue,
        "Valor Pago": sale.amountPaid,
        "Valor Restante": sale.remainingValue,
        "Método de Pagamento": sale.paymentMethod,
        Itens:
          sale.items?.map((i) => `${i.quantity}x ${i.name}`).join(", ") || "",
      };
    });
    exportToExcel(data, "vendas");
  };

  const handleExportPDF = () => {
    const columns = ["Data", "Cliente", "Total", "Pago", "Restante", "Método"];
    const data = filteredSales.map((sale) => {
      const client = clients.find((c) => c.id === sale.clientId);
      return [
        new Date(sale.date).toLocaleDateString("pt-BR"),
        client?.name || "Desconhecido",
        formatCurrency(sale.totalValue),
        formatCurrency(sale.amountPaid),
        formatCurrency(sale.remainingValue),
        sale.paymentMethod,
      ];
    });
    exportToPDF("Relatório de Vendas", columns, data, "vendas");
  };

  return (
    <div className="min-h-screen bg-background-light">
      <Header showBack bgColor="bg-[#4a154b]" textColor="text-white" />

      <main className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        {/* TABS */}
        <div className="flex bg-white rounded-xl p-1 border border-primary/10 shadow-sm">
          <button
            onClick={() => {
              setActiveTab("nova");
              setCheckoutStep("cart");
            }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
              activeTab === "nova"
                ? "bg-primary text-white"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {editingSaleId ? "Editar Venda" : "Nova Venda"}
          </button>
          <button
            onClick={() => {
              setActiveTab("historico");
              setCheckoutStep("cart");
            }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
              activeTab === "historico"
                ? "bg-primary text-white"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Histórico
          </button>
        </div>

        {editingSaleId && activeTab === "nova" && (
          <div className="flex justify-between items-center bg-amber-50 border border-amber-200 p-3 rounded-xl">
            <span className="text-amber-800 text-sm font-bold">
              Editando Venda
            </span>
            <button
              onClick={async () => {
                setEditingSaleId(null);
                setCart([]);
                setSelectedClientId("");
                setPaymentStatus("pago");
                setAmountPaid("");
                setPaymentNotes("");
                setCheckoutStep("cart");
                const updatedProducts = await api.getProducts();
                setProducts(updatedProducts);
              }}
              className="text-amber-700 hover:text-amber-900 text-sm font-bold flex items-center gap-1"
            >
              <X size={16} /> Cancelar
            </button>
          </div>
        )}

        {activeTab === "nova" ? (
          <div className="space-y-6 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {checkoutStep === "cart" ? (
                <VendasCarrinho
                  clients={clients}
                  clientsById={clientsById}
                  selectedClientId={selectedClientId}
                  setSelectedClientId={setSelectedClientId}
                  isAddingClient={isAddingClient}
                  setIsAddingClient={setIsAddingClient}
                  newClientName={newClientName}
                  setNewClientName={setNewClientName}
                  newClientPhone={newClientPhone}
                  setNewClientPhone={setNewClientPhone}
                  newClientAddress={newClientAddress}
                  setNewClientAddress={setNewClientAddress}
                  handleAddClient={handleAddClient}
                  getClientDebt={getClientDebt}
                  products={products}
                  selectedProductIdToAdd={selectedProductIdToAdd}
                  setSelectedProductIdToAdd={setSelectedProductIdToAdd}
                  isAddingProduct={isAddingProduct}
                  setIsAddingProduct={setIsAddingProduct}
                  newProductName={newProductName}
                  setNewProductName={setNewProductName}
                  newProductPrice={newProductPrice}
                  setNewProductPrice={setNewProductPrice}
                  handleAddProduct={handleAddProduct}
                  handleAddToCart={handleAddToCart}
                  cart={cart}
                  handleRemoveFromCart={handleRemoveFromCart}
                  updateCartQuantity={updateCartQuantity}
                  editingCartItemId={editingCartItemId}
                  setEditingCartItemId={setEditingCartItemId}
                  editCartItemPrice={editCartItemPrice}
                  setEditCartItemPrice={setEditCartItemPrice}
                  handleEditCartItemPrice={handleEditCartItemPrice}
                  totalValue={totalValue}
                  formatCurrency={formatCurrency}
                  formatPriceInput={formatPriceInput}
                  onProceedToPayment={() => {
                    if (!selectedClientId) {
                      alert("Selecione ou crie um cliente para continuar.");
                      return;
                    }
                    if (cart.length === 0) {
                      alert("Adicione pelo menos um produto ao carrinho.");
                      return;
                    }
                    setCheckoutStep("payment");
                  }}
                />
              ) : (
                <VendasOpcoesPagamento
                  selectedClient={selectedClient || undefined}
                  totalValue={totalValue}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  paymentStatus={paymentStatus}
                  setPaymentStatus={setPaymentStatus}
                  amountPaid={amountPaid}
                  setAmountPaid={setAmountPaid}
                  paymentNotes={paymentNotes}
                  setPaymentNotes={setPaymentNotes}
                  editingSaleId={editingSaleId}
                  formatCurrency={formatCurrency}
                  formatPriceInput={formatPriceInput}
                  parsePriceInput={parsePriceInput}
                  handleFinalizarVenda={handleFinalizarVenda}
                  onBackToCart={() => setCheckoutStep("cart")}
                  onCancelEdit={() => {
                    setEditingSaleId(null);
                    setSelectedClientId("");
                    setCart([]);
                    setPaymentStatus("pago");
                    setAmountPaid("");
                    setPaymentNotes("");
                    setCheckoutStep("cart");
                    setActiveTab("historico");
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <VendasHistoricoList
              filteredSales={filteredSales}
              clientsById={clientsById}
              expandedSaleId={expandedSaleId}
              setExpandedSaleId={setExpandedSaleId}
              filterDate={filterDate}
              setFilterDate={setFilterDate}
              filterClient={filterClient}
              setFilterClient={setFilterClient}
              filterOverdueOnly={filterOverdueOnly}
              setFilterOverdueOnly={setFilterOverdueOnly}
              overduePendingSalesCount={overduePendingSalesCount}
              formatCurrency={formatCurrency}
              handleExportExcel={handleExportExcel}
              handleExportPDF={handleExportPDF}
              onOpenAuditModal={() => setIsAuditModalOpen(true)}
              onEditSale={handleEditSale}
              onWhatsApp={handleWhatsApp}
              onDeleteSale={handleDeleteSale}
              onOpenEditPayment={handleOpenEditPayment}
              onUndoPayment={handleUndoPayment}
            />
          </AnimatePresence>
        )}
      </main>

      {/* SUMMARY MODAL */}
      <VendasSummaryModal
        isOpen={showSummary && !!currentSale && !!selectedClient}
        currentSale={currentSale}
        selectedClient={selectedClient}
        formatCurrency={formatCurrency}
        onClose={() => {
          setShowSummary(false);
          setSelectedClientId("");
          setCart([]);
          setPaymentStatus("pago");
          setAmountPaid("");
          setPaymentNotes("");
          setEditingSaleId(null);
          setCheckoutStep("cart");
        }}
        onWhatsApp={() => handleWhatsApp()}
      />

      {/* EDIT PAYMENT MODAL */}
      <VendasEditPaymentModal
        editingPayment={editingPayment}
        editPaymentAmount={editPaymentAmount}
        setEditPaymentAmount={setEditPaymentAmount}
        editPaymentDate={editPaymentDate}
        setEditPaymentDate={setEditPaymentDate}
        editPaymentMethod={editPaymentMethod}
        setEditPaymentMethod={setEditPaymentMethod}
        editPaymentNotes={editPaymentNotes}
        setEditPaymentNotes={setEditPaymentNotes}
        onSave={handleSaveEditPayment}
        onClose={() => setEditingPayment(null)}
        formatPriceInput={formatPriceInput}
      />

      {/* AUDIT MODAL */}
      <PaymentAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        onPaymentRestored={async () => {
          const fetchedSales = await api.getSales();
          setSales(fetchedSales);
        }}
      />
    </div>
  );
}
