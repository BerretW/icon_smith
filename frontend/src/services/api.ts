import { AuthState, User } from '../types';

/**
 * Konfigurace URL API.
 * 
 * Logika:
 * 1. Pokud existuje proměnná prostředí VITE_API_URL, použije se (priorita).
 * 2. Pokud jsme ve vývojovém režimu (npm run dev), předpokládáme Flask na localhost:5000.
 * 3. V produkci (Docker/Nginx) necháme prázdné, aby se volalo relativně (např. /api/login),
 *    což Nginx zachytí a pošle do backend kontejneru.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

// Klíče pro LocalStorage
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// --- Pomocné funkce pro Token a User Data ---

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Volitelně: přesměrování na login nebo reload stránky
  // window.location.reload(); 
};

// --- Hlavní wrapper pro Fetch ---

/**
 * Univerzální funkce pro volání API.
 * Automaticky přidává Authorization header, pokud máme token.
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  // Sestavení hlaviček
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers as any, // Sloučení s vlastními hlavičkami
  };

  // Přidání Bearer tokenu, pokud existuje
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Sestavení plné URL (např. http://localhost:5000/api/neco nebo /api/neco)
  // Ujistíme se, že endpoint začíná lomítkem, pokud ho tam nedáme my
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Globální ošetření 401 (Vypršený token)
    if (response.status === 401) {
      console.warn("Neautorizovaný přístup - token pravděpodobně vypršel.");
      logout();
      // Zde bys mohl vyvolat event pro zobrazení login modalu v UI
      // Pro teď jen vrátíme chybu, kterou UI zpracuje
    }

    return response;
  } catch (error) {
    console.error(`API Error (${url}):`, error);
    throw error;
  }
};

// --- Konkrétní API služby ---

/**
 * Přihlášení uživatele
 */
export const loginUser = async (credentials: { username: string; password: string }) => {
  // Backend očekává POST na /api/login
  const response = await apiFetch('/api/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Přihlášení se nezdařilo.');
  }

  // Uložení session
  if (data.token && data.user) {
    setAuthToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  return data; // Vrací { token: string, user: User }
};

/**
 * Kontrola dostupnosti backendu (Health check)
 */
export const checkHealth = async () => {
  try {
    const response = await apiFetch('/api/health');
    return response.ok;
  } catch (e) {
    return false;
  }
};