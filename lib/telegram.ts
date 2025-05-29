// Типы для Telegram WebApp
export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

export interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    query_id?: string
    user?: TelegramUser
    auth_date?: string
    hash?: string
  }
  version: string
  platform: string
  colorScheme: string
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
  }
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  headerColor: string
  backgroundColor: string
  ready(): void
  expand(): void
  close(): void
  setHeaderColor(color: string): void
  setBackgroundColor(color: string): void
  onEvent(eventType: string, eventHandler: () => void): void
  offEvent(eventType: string, eventHandler: () => void): void
  sendData(data: string): void
  openLink(url: string): void
  openTelegramLink(url: string): void
  showPopup(params: any, callback: (id: string) => void): void
  showAlert(message: string, callback: () => void): void
  showConfirm(message: string, callback: (ok: boolean) => void): void
  enableClosingConfirmation(): void
  disableClosingConfirmation(): void
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    isProgressVisible: boolean
    setText(text: string): void
    onClick(callback: () => void): void
    offClick(callback: () => void): void
    show(): void
    hide(): void
    enable(): void
    disable(): void
    showProgress(leaveActive: boolean): void
    hideProgress(): void
  }
  BackButton: {
    isVisible: boolean
    onClick(callback: () => void): void
    offClick(callback: () => void): void
    show(): void
    hide(): void
  }
  HapticFeedback: {
    impactOccurred(style: string): void
    notificationOccurred(type: string): void
    selectionChanged(): void
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }
}

// Функция для получения данных пользователя Telegram
export function getTelegramUser(): TelegramUser | null {
  if (typeof window !== "undefined" && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    return window.Telegram.WebApp.initDataUnsafe.user
  }
  return null
}

// Функция для проверки, запущено ли приложение в Telegram
export function isTelegramWebApp(): boolean {
  return typeof window !== "undefined" && !!window.Telegram?.WebApp
}

// Функция для инициализации Telegram WebApp
export function initTelegramWebApp(callback?: () => void): void {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    // Устанавливаем обработчик события ready
    window.Telegram.WebApp.ready()

    // Устанавливаем цветовую схему в зависимости от темы Telegram
    const isDarkMode = window.Telegram.WebApp.colorScheme === "dark"
    document.documentElement.classList.toggle("dark", isDarkMode)

    // Вызываем callback после инициализации
    if (callback) {
      callback()
    }
  }
}

// Функция для отправки данных в Telegram
export function sendDataToTelegram(data: any): void {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    window.Telegram.WebApp.sendData(JSON.stringify(data))
  }
}

// Функция для настройки главной кнопки Telegram
export function setupMainButton(text: string, onClick: () => void): void {
  if (typeof window !== "undefined" && window.Telegram?.WebApp?.MainButton) {
    const mainButton = window.Telegram.WebApp.MainButton
    mainButton.setText(text)
    mainButton.onClick(onClick)
    mainButton.show()
  }
}

// Функция для настройки кнопки "Назад" Telegram
export function setupBackButton(onClick: () => void): void {
  if (typeof window !== "undefined" && window.Telegram?.WebApp?.BackButton) {
    const backButton = window.Telegram.WebApp.BackButton
    backButton.onClick(onClick)
    backButton.show()
  }
}

// Функция для скрытия кнопки "Назад" Telegram
export function hideBackButton(): void {
  if (typeof window !== "undefined" && window.Telegram?.WebApp?.BackButton) {
    window.Telegram.WebApp.BackButton.hide()
  }
}
