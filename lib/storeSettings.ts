export interface StoreSettings {
  storeName: string;
  pixKey: string;
  logoUrl?: string;
}

export const getStoreSettings = (): StoreSettings => {
  if (typeof window === "undefined") return { storeName: "", pixKey: "" };
  const settings = localStorage.getItem("storeSettings");
  return settings ? JSON.parse(settings) : { storeName: "", pixKey: "" };
};

export const saveStoreSettings = (settings: StoreSettings) => {
  localStorage.setItem("storeSettings", JSON.stringify(settings));
};
