import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Trash2,
  Users,
  Check,
  Split,
  Calculator,
  Edit2,
  RefreshCcw,
  X,
  Save,
  PieChart,
  ShoppingBag,
  Share2,
  Percent,
} from "lucide-react";

// --- TYPES ---
interface User {
  id: string;
  name: string;
}

type DistributionType = "ALL" | "SPLIT_BY_PERSON" | "BY_UNIT";

interface Item {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  type: DistributionType;
  details: Record<string, number>;
}

// --- COMPONENT ---
export default function HissaApp() {
  // STATE
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [serviceCharge, setServiceCharge] = useState<number>(10);

  // MUHIM: Yuklash tugaganini bilish uchun flag
  const [isLoaded, setIsLoaded] = useState(false);

  // Form states
  const [newUserName, setNewUserName] = useState("");
  const [itemName, setItemName] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [quantityInput, setQuantityInput] = useState("1");
  const [distType, setDistType] = useState<DistributionType>("ALL");
  const [participation, setParticipation] = useState<Record<string, number>>(
    {},
  );

  // Edit mode state
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- LOCAL STORAGE: 1. YUKLASH (LOAD) ---
  useEffect(() => {
    // Bu faqat bir marta, sahifa ochilganda ishlaydi
    const savedUsers = localStorage.getItem("hissa_users");
    const savedItems = localStorage.getItem("hissa_items");
    const savedService = localStorage.getItem("hissa_service");

    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers));
      } catch (e) {
        console.error("Userlarni o'qishda xatolik", e);
      }
    }

    if (savedItems) {
      try {
        setItems(JSON.parse(savedItems));
      } catch (e) {
        console.error("Itemlarni o'qishda xatolik", e);
      }
    }

    if (savedService) {
      setServiceCharge(Number(savedService));
    }

    // Yuklash tugadi deb belgilaymiz
    setIsLoaded(true);
  }, []);

  // --- LOCAL STORAGE: 2. SAQLASH (SAVE) ---
  useEffect(() => {
    // MUHIM: Agar hali yuklanib bo'lmagan bo'lsa, saqlama!
    // Aks holda bo'sh arrayni saqlab, eski ma'lumotni o'chirib yuboradi.
    if (isLoaded) {
      localStorage.setItem("hissa_users", JSON.stringify(users));
      localStorage.setItem("hissa_items", JSON.stringify(items));
      localStorage.setItem("hissa_service", serviceCharge.toString());
    }
  }, [users, items, serviceCharge, isLoaded]);

  // --- ACTIONS ---

  const shareReceipt = () => {
    // Chek matnini yaratish
    let text = `📊 *HISSA - Hisob-kitob cheki*\n`;
    text += `📅 ${new Date().toISOString().slice(0, 16).replace('T', ' ')}\n\n`;

    users.forEach((u) => {
      const total = results.userTotals[u.id];
      if (total === 0 && !results.userDetails[u.id]?.length) return;

      const service = total * (serviceCharge / 100);
      const finalTotal = total + service;

      text += `━━━━━━━━━━━━━━━━━\n`;
      text += `👤 *${u.name}*\n`;
      text += `💰 To'lov: *${Math.round(finalTotal).toLocaleString()} so'm*\n\n`;

      results.userDetails[u.id].forEach((detail) => {
        text += `  • ${detail.item} (${detail.desc})\n`;
        text += `    ${Math.round(detail.cost).toLocaleString()} so'm\n`;
      });

      text += `\n  Asosiy: ${Math.round(total).toLocaleString()} so'm\n`;
      text += `  Xizmat (${serviceCharge}%): +${Math.round(service).toLocaleString()} so'm\n`;
    });

    text += `\n━━━━━━━━━━━━━━━━━\n`;
    text += `📦 Jami mahsulot: ${results.subTotal.toLocaleString()} so'm\n`;
    text += `🔧 Xizmat haqi: ${results.serviceAmt.toLocaleString()} so'm\n`;
    text += `💵 *UMUMIY: ${Math.round(results.grandTotal).toLocaleString()} so'm*\n\n`;
    text += `✅ Hisob avtomatik taqsimlandi`;

    // Share via Web Share API (agar mavjud bo'lsa)
    if (navigator.share) {
      navigator.share({
        title: 'Hissa - Hisob-kitob',
        text: text,
      }).catch(() => {
        // Agar share ishlamasa, clipboard ga nusxalash
        copyToClipboard(text);
      });
    } else {
      // Web Share mavjud bo'lmasa, clipboard ga nusxalash
      copyToClipboard(text);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('✅ Chek nusxalandi! Endi istalgan joyga yuborishingiz mumkin.');
    }).catch(() => {
      alert('❌ Nusxalashda xatolik yuz berdi.');
    });
  };

  const resetAll = () => {
    if (confirm("Barcha ma'lumotlar o'chib, yangi hisob boshlanadi. Davom etasizmi?")) {
      setUsers([]);
      setItems([]);
      setServiceCharge(10);
      setEditingId(null);
      resetInputs();
      localStorage.removeItem("hissa_users");
      localStorage.removeItem("hissa_items");
      localStorage.removeItem("hissa_service");
    }
  };

  const addUser = () => {
    if (!newUserName.trim()) return;
    setUsers([...users, { id: crypto.randomUUID(), name: newUserName.trim() }]);
    setNewUserName("");
  };

  const removeUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (confirm(`${user?.name}ni ro'yxatdan olib tashlaysizmi?`)) {
      setUsers(users.filter((u) => u.id !== userId));
    }
  };

  const handleUnitChange = (userId: string, delta: number) => {
    setParticipation((prev) => ({
      ...prev,
      [userId]: Math.max(0, (prev[userId] || 0) + delta),
    }));
  };

  const toggleParticipation = (userId: string) => {
    setParticipation((prev) => ({
      ...prev,
      [userId]: prev[userId] ? 0 : 1,
    }));
  };

  const resetInputs = () => {
    setItemName("");
    setPriceInput("");
    setQuantityInput("1");
    setParticipation({});
    setDistType("ALL");
    setEditingId(null);
  };

  const handleSaveItem = () => {
    const price = parseFloat(priceInput);
    const qty = parseFloat(quantityInput);

    if (!itemName || isNaN(price) || isNaN(qty) || qty <= 0) {
      alert("Iltimos, nom, narx va sonini to'g'ri kiriting.");
      return;
    }

    // Validatsiya
    if (distType === "BY_UNIT") {
      const totalUnits = Object.values(participation).reduce(
        (a, b) => a + b,
        0,
      );
      if (totalUnits === 0) {
        alert("Iltimos, har bir ishtirokchiga miqdor kiriting.");
        return;
      }
    } else if (distType === "SPLIT_BY_PERSON") {
      const selectedCount = Object.values(participation).filter(
        (x) => x > 0,
      ).length;
      if (selectedCount === 0) {
        alert("Iltimos, kamida bitta ishtirokchini tanlang.");
        return;
      }
    }

    const newItem: Item = {
      id: editingId || crypto.randomUUID(),
      name: itemName,
      unitPrice: price,
      quantity: qty,
      type: distType,
      details: { ...participation },
    };

    if (editingId) {
      setItems(items.map((item) => (item.id === editingId ? newItem : item)));
    } else {
      setItems([...items, newItem]);
    }

    resetInputs();
  };

  const editItem = (item: Item) => {
    setEditingId(item.id);
    setItemName(item.name);
    setPriceInput(item.unitPrice.toString());
    setQuantityInput(item.quantity.toString());
    setDistType(item.type);
    setParticipation(item.details);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (confirm(`"${item?.name}" xarajatini o'chirib tashlaysizmi?`)) {
      setItems(items.filter((i) => i.id !== id));
      if (editingId === id) resetInputs();
    }
  };

  // --- CALCULATION LOGIC ---
  const results = useMemo(() => {
    const userDetails: Record<
      string,
      { item: string; cost: number; desc: string }[]
    > = {};
    const userTotals: Record<string, number> = {};

    // Init
    users.forEach((u) => {
      userDetails[u.id] = [];
      userTotals[u.id] = 0;
    });

    let subTotal = 0;

    items.forEach((item) => {
      const totalItemCost = item.unitPrice * item.quantity;

      if (item.type === "ALL") {
        if (users.length > 0) {
          const costPerPerson = totalItemCost / users.length;
          subTotal += totalItemCost;
          users.forEach((u) => {
            userTotals[u.id] += costPerPerson;
            userDetails[u.id].push({
              item: item.name,
              cost: costPerPerson,
              desc: `${item.quantity} ta (teng)`,
            });
          });
        }
      } else if (item.type === "SPLIT_BY_PERSON") {
        const participantIds = Object.keys(item.details).filter((id) => {
          const userExists = users.find((u) => u.id === id);
          return userExists && item.details[id] > 0;
        });

        const count = participantIds.length;

        if (count > 0) {
          const costPerPerson = totalItemCost / count;
          subTotal += totalItemCost;
          participantIds.forEach((uid) => {
            userTotals[uid] += costPerPerson;
            userDetails[uid].push({
              item: item.name,
              cost: costPerPerson,
              desc: `${item.quantity} ta (${count} kishi)`,
            });
          });
        }
      } else if (item.type === "BY_UNIT") {
        Object.entries(item.details).forEach(([uid, qty]) => {
          if (users.find((u) => u.id === uid)) {
            if (qty > 0) {
              const cost = qty * item.unitPrice;
              subTotal += cost;
              userTotals[uid] += cost;
              userDetails[uid].push({
                item: item.name,
                cost: cost,
                desc: `${qty} dona`,
              });
            }
          }
        });
      }
    });

    return {
      userDetails,
      userTotals,
      subTotal,
      serviceAmt: subTotal * (serviceCharge / 100),
      grandTotal: subTotal * (1 + serviceCharge / 100),
    };
  }, [users, items, serviceCharge]);

  // Agar yuklanmagan bo'lsa (serverda yoki birinchi renderda) oq ekran ko'rsatmaslik uchun
  if (!isLoaded && typeof window !== "undefined") {
    // return null; // yoki loading spinner
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* HEADER */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm px-3 sm:px-4 py-3 backdrop-blur-sm bg-white/95">
        <div className="max-w-5xl mx-auto flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 sm:p-2.5 rounded-lg shadow-md shadow-blue-200/50">
              <PieChart className="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-none">
                Hissa
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                Adolatli taqsimlash
              </p>
            </div>
          </div>

          <button
            onClick={resetAll}
            className="flex items-center gap-1 text-slate-600 hover:bg-slate-100 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition border border-slate-200 hover:border-slate-300 active:scale-95"
          >
            <RefreshCcw className="w-3 h-3" /> <span className="hidden sm:inline">Qayta boshlash</span><span className="sm:hidden">Yangi</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-3 sm:p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-2">
        {/* LEFT SIDE: INPUTS */}
        <div className="space-y-4 sm:space-y-6">
          {/* 1. USERS */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3 sm:space-y-4">
            <h2 className="font-bold text-[10px] sm:text-xs text-slate-500 uppercase flex items-center gap-2 tracking-wide">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-blue-50 flex items-center justify-center">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
              </div>
              Ishtirokchilar
            </h2>

            <div className="flex gap-2">
              <input
                placeholder="Ism kiriting..."
                className="flex-1 border border-slate-200 bg-slate-50/50 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition placeholder:text-slate-400"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addUser()}
              />
              <button
                onClick={addUser}
                className="bg-blue-600 text-white px-4 sm:px-5 py-2 rounded-lg hover:bg-blue-700 active:scale-95 transition shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {users.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="group flex items-center gap-1.5 sm:gap-2 pl-3 sm:pl-3.5 pr-1 py-1.5 bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-700 rounded-full text-[11px] sm:text-xs font-semibold border border-blue-100 hover:border-blue-200 transition"
                  >
                    {u.name}
                    <button
                      onClick={() => removeUser(u.id)}
                      className="w-5 h-5 flex items-center justify-center bg-white/80 rounded-full hover:bg-red-50 hover:text-red-600 active:scale-90 transition shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. ADD ITEM FORM */}
          {users.length > 0 && (
            <div
              className={`bg-white p-4 sm:p-5 rounded-xl border shadow-sm hover:shadow-md space-y-3 sm:space-y-4 relative transition-all duration-300 ${editingId ? "border-amber-300 bg-amber-50/30" : "border-slate-200"}`}
            >
              {editingId && (
                <div className="absolute top-[-8px] sm:top-[-10px] right-3 sm:right-5 bg-amber-500 text-white text-[9px] sm:text-[10px] font-bold px-2.5 sm:px-3 py-1 rounded-md shadow-sm">
                  ✏️ Tahrirlash
                </div>
              )}

              <h2 className="font-bold text-[10px] sm:text-xs text-slate-500 uppercase flex items-center gap-2 tracking-wide">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-green-50 flex items-center justify-center">
                  <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600" />
                </div>
                Xarajat qo'shish
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-12 gap-2 sm:gap-3">
                  <div className="col-span-12">
                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase ml-1 sm:ml-2 mb-1 block">
                      Nomi
                    </label>
                    <input
                      placeholder="Masalan: Osh, Choy..."
                      className="w-full border border-slate-200 bg-slate-50/50 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:border-blue-500 focus:bg-white outline-none font-medium transition placeholder:text-slate-400"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                    />
                  </div>
                  <div className="col-span-8">
                    <label className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase ml-1 sm:ml-2 mb-1 block">
                      Narxi (dona)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="10000"
                      className="w-full border border-slate-200 bg-slate-50/50 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:border-blue-500 focus:bg-white outline-none transition placeholder:text-slate-400"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                    />
                  </div>
                  <div
                    className={`col-span-4 transition-opacity ${distType === "BY_UNIT" ? "opacity-30 pointer-events-none" : "opacity-100"}`}
                  >
                    <label className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase ml-1 sm:ml-2 mb-1 block">
                      Miqdori
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="w-full border border-slate-200 bg-slate-50/50 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:border-blue-500 focus:bg-white outline-none text-center font-bold text-blue-600 transition placeholder:text-slate-400"
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-slate-100/80 p-1 rounded-lg flex gap-1 border border-slate-200">
                  {[
                    { id: "ALL", label: "Hammaga", icon: Users },
                    { id: "BY_UNIT", label: "Donalab", icon: Calculator },
                    { id: "SPLIT_BY_PERSON", label: "Bo'lishib", icon: Split },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setDistType(type.id as DistributionType);
                        if (!editingId) setParticipation({});
                      }}
                      className={`flex-1 flex flex-col items-center gap-1 py-2 sm:py-2.5 rounded-md text-[9px] sm:text-[10px] font-semibold transition active:scale-95 ${
                        distType === type.id
                          ? "bg-white shadow-sm text-blue-600 border border-blue-100"
                          : "text-slate-500 hover:bg-white/50 hover:text-slate-700"
                      }`}
                    >
                      <type.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {type.label}
                    </button>
                  ))}
                </div>

                {/* DYNAMIC SELECTION AREA */}
                <div className="min-h-[100px] bg-gradient-to-br from-slate-50 to-slate-50/50 rounded-lg border border-slate-200 p-2.5 sm:p-3">
                  {distType === "ALL" && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
                      <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-3 border border-blue-100">
                        <Users className="w-6 h-6 text-blue-500" />
                      </div>
                      <p className="text-xs sm:text-sm font-medium mb-2">
                        Jami: <span className="font-bold text-blue-600 text-base">
                          {(Number(priceInput) * Number(quantityInput) || 0).toLocaleString()}
                        </span> so'm
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Barcha ishtirokchilarga teng miqdorda bo'linadi
                      </p>
                    </div>
                  )}

                  {distType === "BY_UNIT" && (
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase px-1 sm:px-2">
                        <span>Kim</span>
                        <span>Nechta?</span>
                      </div>
                      {users.map((u) => (
                        <div
                          key={u.id}
                          className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm hover:shadow transition"
                        >
                          <span className="text-sm font-semibold text-slate-700 pl-1 sm:pl-2">
                            {u.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUnitChange(u.id, -1)}
                              className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-600 transition font-bold shadow-sm"
                            >
                              −
                            </button>
                            <span className="min-w-[2rem] text-center font-bold text-base text-blue-600">
                              {participation[u.id] || 0}
                            </span>
                            <button
                              onClick={() => handleUnitChange(u.id, 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-500 hover:bg-blue-600 active:scale-90 text-white transition font-bold shadow-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {distType === "SPLIT_BY_PERSON" && (
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase px-1 sm:px-2">
                        <span>Kimlar sherik bo'ldi?</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {users.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => toggleParticipation(u.id)}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs sm:text-sm font-semibold transition active:scale-95 ${
                              participation[u.id]
                                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-md shadow-blue-200/50"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                          >
                            {u.name}
                            {participation[u.id] ? (
                              <Check className="w-4 h-4" />
                            ) : <div className="w-4 h-4 rounded border-2 border-slate-300"></div>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ACTION BUTTON */}
                <div className="flex gap-2 pt-2">
                  {editingId && (
                    <button
                      onClick={resetInputs}
                      className="px-5 py-3 rounded-lg font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition text-sm border border-slate-200"
                    >
                      Bekor qilish
                    </button>
                  )}
                  <button
                    onClick={handleSaveItem}
                    className={`flex-1 py-3 rounded-lg font-semibold text-white shadow-md transition flex justify-center items-center gap-2 active:scale-95 ${
                      editingId
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-200"
                        : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-200"
                    }`}
                  >
                    {editingId ? (
                      <>
                        <Save className="w-4 h-4" /> O'zgarishlarni saqlash
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" /> Ro'yxatga qo'shish
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ITEM LIST */}
          {items.length > 0 && (
            <div className="space-y-2 sm:space-y-2.5 pb-4 sm:pb-6">
              <div className="flex items-center justify-between pl-1 pr-1">
                <h3 className="font-semibold text-slate-500 text-xs uppercase tracking-wide">
                  Qo'shilgan xarajatlar
                </h3>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                  {items.length}
                </span>
              </div>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3 sm:p-3.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition group flex justify-between items-center gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm sm:text-base text-slate-800 flex items-center gap-2 flex-wrap">
                      <span className="truncate">{item.name}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-gradient-to-r from-slate-100 to-slate-50 text-slate-600 font-semibold uppercase tracking-wide whitespace-nowrap border border-slate-200">
                        {item.type === "ALL"
                          ? "Hamma"
                          : item.type === "BY_UNIT"
                            ? "Donalab"
                            : "Bo'lishib"}
                      </span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium">
                      {item.type === "BY_UNIT"
                        ? `${item.unitPrice.toLocaleString()} so'm/dona`
                        : `${item.quantity} × ${item.unitPrice.toLocaleString()} = ${(item.quantity * item.unitPrice).toLocaleString()} so'm`}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => editItem(item)}
                      className="p-2 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 active:scale-90 transition border border-amber-100"
                    >
                      <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 active:scale-90 transition border border-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDE: RESULTS */}
        <div className="space-y-4 sm:space-y-6">
          {items.length > 0 && users.length > 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden lg:sticky lg:top-24">
              {/* Header - Receipt Style */}
              <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white p-4 relative overflow-hidden border-b-2 border-blue-500">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                        <PieChart className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold tracking-tight">HISSA</h2>
                        <p className="text-blue-200 text-[10px] font-medium">Hisob-kitob cheki</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/20">
                      <Percent className="w-3 h-3 text-blue-200" />
                      <span className="text-[10px] font-semibold text-blue-100">Xizmat:</span>
                      <input
                        type="number"
                        className="w-8 bg-transparent font-bold text-white focus:outline-none text-right text-sm"
                        value={serviceCharge}
                        onChange={(e) => setServiceCharge(Number(e.target.value))}
                      />
                      <span className="font-bold text-white text-sm">%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-300 pt-2 border-t border-white/10">
                    <span>{new Date().toISOString().slice(0, 16).replace('T', ' ')}</span>
                  </div>
                </div>
              </div>

              {/* User Bills */}
              <div className="divide-y divide-slate-100 max-h-[400px] sm:max-h-[500px] overflow-y-auto custom-scrollbar">
                {users.map((u) => {
                  const total = results.userTotals[u.id];
                  if (total === 0 && !results.userDetails[u.id]?.length)
                    return null;

                  const service = total * (serviceCharge / 100);
                  const finalTotal = total + service;

                  return (
                    <div
                      key={u.id}
                      className="p-4 sm:p-5 hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-transparent transition duration-200"
                    >
                      {/* User Header */}
                      <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-dashed border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                            {u.name}
                          </h3>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">To'lov</div>
                          <span className="font-mono font-bold text-xl sm:text-2xl text-blue-600 block">
                            {Math.round(finalTotal).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-1.5 mb-3">
                        {results.userDetails[u.id].map((detail, i) => (
                          <div
                            key={i}
                            className="flex justify-between text-[11px] sm:text-xs text-slate-600 border-b border-dotted border-slate-200 pb-1.5 last:border-0 gap-2"
                          >
                            <span className="flex items-center gap-1.5 font-medium flex-1 min-w-0">
                              <span className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0"></span>
                              <span className="truncate">{detail.item}</span>
                              <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-wide whitespace-nowrap flex-shrink-0">
                                {detail.desc}
                              </span>
                            </span>
                            <span className="flex-shrink-0 font-mono font-semibold">
                              {Math.round(detail.cost).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Subtotal */}
                      <div className="flex justify-between text-[10px] sm:text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                        <div className="space-y-0.5 text-slate-500 font-semibold">
                          <div>Asosiy:</div>
                          <div>Xizmat ({serviceCharge}%):</div>
                        </div>
                        <div className="space-y-0.5 text-right font-mono font-bold text-slate-700">
                          <div>{Math.round(total).toLocaleString()}</div>
                          <div>+{Math.round(service).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer - Total Summary */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-3 sm:p-4 border-t-2 border-slate-200 space-y-2">
                <div className="space-y-1.5 text-xs sm:text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Jami mahsulot</span>
                    <span className="font-mono font-bold text-slate-800">
                      {results.subTotal.toLocaleString()} <span className="text-[10px] text-slate-500">so'm</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Xizmat ({serviceCharge}%)</span>
                    <span className="font-mono font-bold text-slate-800">
                      {results.serviceAmt.toLocaleString()} <span className="text-[10px] text-slate-500">so'm</span>
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-300">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-4 py-3 rounded-lg shadow-md relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div className="relative flex justify-between items-center">
                      <div>
                        <div className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide opacity-90">
                          Umumiy to'lov
                        </div>
                        <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight">
                          {Math.round(results.grandTotal).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-blue-200">so'm</div>
                      </div>
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                        <PieChart className="w-6 h-6 sm:w-7 sm:h-7 text-white/80" />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={shareReceipt}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold text-sm transition active:scale-95 shadow-sm"
                >
                  <Share2 className="w-4 h-4" />
                  Chekni ulashish
                </button>

                <div className="text-center text-[9px] text-slate-400 pt-1">
                  Avtomatik taqsimlandi
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 sm:h-64 lg:h-full flex flex-col items-center justify-center text-slate-300 p-6 sm:p-8 border-2 border-dashed border-slate-300 rounded-xl text-center bg-gradient-to-br from-slate-50/50 to-white">
              <div className="bg-gradient-to-br from-slate-100 to-white p-4 sm:p-5 rounded-xl mb-4 shadow-sm border border-slate-200">
                <PieChart className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300" />
              </div>
              <p className="font-bold text-slate-500 text-lg sm:text-xl mb-2">Hissa</p>
              <p className="text-xs sm:text-sm text-slate-400 max-w-[220px] leading-relaxed">
                {items.length === 0 ? "Yuqoridan" : "Chap tomondan"} ishtirokchi va xarajatlarni qo'shib, hisob-kitobni boshlang
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
