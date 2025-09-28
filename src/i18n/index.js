import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      "allCategories": "All Categories",
      "becomeAgent": "Become an Agent",
      "topRanking": "Top Ranking Product",
      "app": "App",
      "help": "Help",
      "sourceRequest": "Source Request",
      "english": "English",
      "german": "German",
      "french": "French",
      "spanish": "Spanish",
      "russian": "Russian",
      
      // Header
      "searchPlaceholder": "Enter keyword to search Product...",
      "messages": "Messages",
      "productRequests": "Product Requests",
      "videoChannel": "Video Channel",
      "account": "Account",
      "dashboard": "Dashboard",
      "logout": "Logout",
      "signIn": "Sign In",
      "signUp": "Sign Up",
      "guestUser": "Guest User",
      "atlasId": "ATLAS ID",
      
      // Categories
      "categories": "Categories",
      "loadingCategories": "Loading categories…",
      
      // Slider
      "shopLatest": "Shop the latest",
      "exploreNow": "Explore Now",
      "previousSlide": "Previous slide",
      "nextSlide": "Next slide",
      
      // App Store
      "downloadAppStore": "Download on the App Store",
      "getGooglePlay": "Get it on Google Play",
      
      // Login requirement
      "loginRequired": "(Login Required)",
      
      // Navigation actions
      "backToHome": "Back To Home",
      
      // Slider
      "shopLatest": "Shop the latest",
      "freshArrivals": "Fresh arrivals from top brands",
      "featuredSelection": "Featured selection",
      "curatedPicks": "Curated picks for you",
      "efficientWarehousing": "Efficient warehousing",
      "seamlessFulfillment": "Seamless fulfillment and logistics",
      "exploreNow": "Explore Now",
      
      // Sidebar
      "categories": "Categories",
      "youMayLike": "You May Like",
      "postProductRequest": "Post Your Product Request Now",
      
      // Main content
      "trendingProducts": "Trending Products",
      "findOnlineProduct": "Find our online product that best for everyone",
      "loadMore": "Load More",
      "loading": "Loading…",
      "viewTopRanking": "View Top Ranking Products",
      
      // Newsletter
      "subscribeNewsletter": "Subscribe to Our Newsletter",
      "yourEmailAddress": "Your Email Address",
      "subscribe": "Subscribe",
      "subscribing": "Subscribing...",
      "stayUpdated": "Stay updated with our latest news and offers",
      "enterYourEmail": "Enter your email",
      
      // Footer
      "yourBestOnlineMarket": "Your best online market",
      "features": "Features",
      "sourcingGuide": "Sourcing Guide",
      "trendingProductsFooter": "Trending products",
      "supplierRanking": "Supplier Ranking",
      "productDesign": "Product Design",
      "support": "Support",
      "customerService": "Customer Service",
      "helpCenter": "Help Center",
      "submitDispute": "Submit a Dispute",
      "reportIPR": "Report IPR",
      "company": "Company",
      "tradeAssurance": "Trade Assurance",
      "businessIdentity": "Business Identity",
      "logisticsService": "Logistics Service",
      "securePayment": "Secure Payment",
      "resources": "Resources",
      "getMobileApp": "Get mobile app",
      "productMonitoring": "Product Monitoring",
      "tradeAlert": "Trade Alert",
      "productionFlow": "Production Flow",
      "newsletter": "Newsletter",
      "copyright": "Copyright ©2022 ATLAS-WD. Trade Alert | All rights reserved.",
      
      // App Store
      "downloadOnThe": "Download on the",
      "appStore": "App Store",
      "getItOn": "GET IT ON",
      "googlePlay": "Google Play",
      
      // Search
      "enterKeywords": "Enter keywords to search Products",
      "loadingCategories": "Loading categories…",
      "allCategories": "All Categories",
      
      // Business Types
      "allBusinessTypes": "All Business Types",
      "association": "Association",
      "retailer": "Retailer",
      "manufacturer": "Manufacturer",
      "distributor": "Distributor",
      "agent": "Agent",
      
      // Empty States
      "noProductsAvailable": "No products available",
      "noProductsForBusinessType": "No products available for this business type",
      "tryDifferentBusinessType": "Try selecting a different business type or clear the filter to see all products.",
      "checkBackLater": "Check back later for new products or try adjusting your search criteria.",
      "clearFilter": "Clear Filter"
    }
  },
  de: {
    translation: {
      // Navigation
      "allCategories": "Alle Kategorien",
      "becomeAgent": "Agent werden",
      "topRanking": "Top-Ranking-Produkt",
      "app": "App",
      "help": "Hilfe",
      "sourceRequest": "Quellenanfrage",
      "english": "Englisch",
      "german": "Deutsch",
      "french": "Französisch",
      "spanish": "Spanisch",
      "russian": "Russisch",
      
      // Header
      "searchPlaceholder": "Stichwort eingeben, um Produkt zu suchen...",
      "messages": "Nachrichten",
      "productRequests": "Produktanfragen",
      "videoChannel": "Video-Kanal",
      "account": "Konto",
      "dashboard": "Dashboard",
      "logout": "Abmelden",
      "signIn": "Anmelden",
      "signUp": "Registrieren",
      "guestUser": "Gastbenutzer",
      "atlasId": "ATLAS ID",
      
      // Categories
      "categories": "Kategorien",
      "loadingCategories": "Kategorien werden geladen…",
      
      // Slider
      "shopLatest": "Das Neueste kaufen",
      "exploreNow": "Jetzt erkunden",
      "previousSlide": "Vorherige Folie",
      "nextSlide": "Nächste Folie",
      
      // App Store
      "downloadAppStore": "Im App Store herunterladen",
      "getGooglePlay": "Bei Google Play herunterladen",
      
      // Login requirement
      "loginRequired": "(Anmeldung erforderlich)",
      
      // Navigation actions
      "backToHome": "Zurück Zur Startseite",
      
      // Slider
      "shopLatest": "Das Neueste kaufen",
      "freshArrivals": "Neue Artikel von Top-Marken",
      "featuredSelection": "Empfohlene Auswahl",
      "curatedPicks": "Kuratierte Auswahl für Sie",
      "efficientWarehousing": "Effiziente Lagerhaltung",
      "seamlessFulfillment": "Nahtlose Erfüllung und Logistik",
      "exploreNow": "Jetzt erkunden",
      
      // Sidebar
      "categories": "Kategorien",
      "youMayLike": "Das könnte Ihnen gefallen",
      "postProductRequest": "Jetzt Ihre Produktanfrage posten",
      
      // Main content
      "trendingProducts": "Trendprodukte",
      "findOnlineProduct": "Finden Sie unser Online-Produkt, das für jeden am besten ist",
      "loadMore": "Mehr laden",
      "loading": "Laden…",
      "viewTopRanking": "Top-Ranking-Produkte anzeigen",
      
      // Newsletter
      "subscribeNewsletter": "Abonnieren Sie unseren Newsletter",
      "yourEmailAddress": "Ihre E-Mail-Adresse",
      "subscribe": "Abonnieren",
      "subscribing": "Abonnieren...",
      "stayUpdated": "Bleiben Sie über unsere neuesten Nachrichten und Angebote auf dem Laufenden",
      "enterYourEmail": "Geben Sie Ihre E-Mail ein",
      
      // Footer
      "yourBestOnlineMarket": "Ihr bester Online-Markt",
      "features": "Funktionen",
      "sourcingGuide": "Beschaffungsleitfaden",
      "trendingProductsFooter": "Trendprodukte",
      "supplierRanking": "Lieferanten-Ranking",
      "productDesign": "Produktdesign",
      "support": "Support",
      "customerService": "Kundenservice",
      "helpCenter": "Hilfezentrum",
      "submitDispute": "Streit einreichen",
      "reportIPR": "IPR melden",
      "company": "Unternehmen",
      "tradeAssurance": "Handelsversicherung",
      "businessIdentity": "Geschäftsidentität",
      "logisticsService": "Logistikservice",
      "securePayment": "Sichere Zahlung",
      "resources": "Ressourcen",
      "getMobileApp": "Mobile App erhalten",
      "productMonitoring": "Produktüberwachung",
      "tradeAlert": "Handelsalarm",
      "productionFlow": "Produktionsablauf",
      "newsletter": "Newsletter",
      "copyright": "Copyright ©2022 ATLAS-WD. Handelsalarm | Alle Rechte vorbehalten.",
      
      // App Store
      "downloadOnThe": "Herunterladen im",
      "appStore": "App Store",
      "getItOn": "ERHÄLTLICH BEI",
      "googlePlay": "Google Play",
      
      // Search
      "enterKeywords": "Stichwörter eingeben, um Produkte zu suchen",
      "loadingCategories": "Kategorien werden geladen…",
      "allCategories": "Alle Kategorien",
      
      // Business Types
      "allBusinessTypes": "Alle Geschäftstypen",
      "association": "Verband",
      "retailer": "Einzelhändler",
      "manufacturer": "Hersteller",
      "distributor": "Vertrieb",
      "agent": "Agent",
      
      // Empty States
      "noProductsAvailable": "Keine Produkte verfügbar",
      "noProductsForBusinessType": "Keine Produkte für diesen Geschäftstyp verfügbar",
      "tryDifferentBusinessType": "Versuchen Sie einen anderen Geschäftstyp zu wählen oder löschen Sie den Filter, um alle Produkte zu sehen.",
      "checkBackLater": "Schauen Sie später nach neuen Produkten oder passen Sie Ihre Suchkriterien an.",
      "clearFilter": "Filter löschen"
    }
  },
  fr: {
    translation: {
      // Navigation
      "allCategories": "Toutes les catégories",
      "becomeAgent": "Devenir agent",
      "topRanking": "Produit le mieux classé",
      "app": "App",
      "help": "Aide",
      "sourceRequest": "Demande de source",
      "english": "Anglais",
      "german": "Allemand",
      "french": "Français",
      "spanish": "Espagnol",
      "russian": "Russe",
      
      // Header
      "searchPlaceholder": "Entrez un mot-clé pour rechercher un produit...",
      "messages": "Messages",
      "productRequests": "Demandes de produits",
      "videoChannel": "Chaîne vidéo",
      "account": "Compte",
      "dashboard": "Tableau de bord",
      "logout": "Déconnexion",
      "signIn": "Se connecter",
      "signUp": "S'inscrire",
      "guestUser": "Utilisateur invité",
      "atlasId": "ATLAS ID",
      
      // Categories
      "categories": "Catégories",
      "loadingCategories": "Chargement des catégories…",
      
      // Slider
      "shopLatest": "Achetez les dernières nouveautés",
      "exploreNow": "Explorer maintenant",
      "previousSlide": "Diapositive précédente",
      "nextSlide": "Diapositive suivante",
      
      // App Store
      "downloadAppStore": "Télécharger sur l'App Store",
      "getGooglePlay": "Obtenir sur Google Play",
      
      // Login requirement
      "loginRequired": "(Connexion requise)",
      
      // Navigation actions
      "backToHome": "Retour À L'accueil",
      
      // Slider
      "shopLatest": "Achetez les dernières nouveautés",
      "freshArrivals": "Nouvelles arrivées des meilleures marques",
      "featuredSelection": "Sélection en vedette",
      "curatedPicks": "Choix sélectionnés pour vous",
      "efficientWarehousing": "Entreposage efficace",
      "seamlessFulfillment": "Exécution et logistique transparentes",
      "exploreNow": "Explorer maintenant",
      
      // Sidebar
      "categories": "Catégories",
      "youMayLike": "Vous pourriez aimer",
      "postProductRequest": "Postez votre demande de produit maintenant",
      
      // Main content
      "trendingProducts": "Produits tendance",
      "findOnlineProduct": "Trouvez notre produit en ligne qui convient le mieux à tous",
      "loadMore": "Charger plus",
      "loading": "Chargement…",
      "viewTopRanking": "Voir les produits les mieux classés",
      
      // Newsletter
      "subscribeNewsletter": "Abonnez-vous à notre newsletter",
      "yourEmailAddress": "Votre adresse e-mail",
      "subscribe": "S'abonner",
      "subscribing": "Abonnement...",
      "stayUpdated": "Restez informé de nos dernières nouvelles et offres",
      "enterYourEmail": "Entrez votre e-mail",
      
      // Footer
      "yourBestOnlineMarket": "Votre meilleur marché en ligne",
      "features": "Fonctionnalités",
      "sourcingGuide": "Guide d'approvisionnement",
      "trendingProductsFooter": "Produits tendance",
      "supplierRanking": "Classement des fournisseurs",
      "productDesign": "Conception de produits",
      "support": "Support",
      "customerService": "Service client",
      "helpCenter": "Centre d'aide",
      "submitDispute": "Soumettre un litige",
      "reportIPR": "Signaler IPR",
      "company": "Entreprise",
      "tradeAssurance": "Assurance commerciale",
      "businessIdentity": "Identité d'entreprise",
      "logisticsService": "Service logistique",
      "securePayment": "Paiement sécurisé",
      "resources": "Ressources",
      "getMobileApp": "Obtenir l'application mobile",
      "productMonitoring": "Surveillance des produits",
      "tradeAlert": "Alerte commerciale",
      "productionFlow": "Flux de production",
      "newsletter": "Newsletter",
      "copyright": "Copyright ©2022 ATLAS-WD. Alerte commerciale | Tous droits réservés.",
      
      // App Store
      "downloadOnThe": "Télécharger sur l'",
      "appStore": "App Store",
      "getItOn": "OBTENIR SUR",
      "googlePlay": "Google Play",
      
      // Search
      "enterKeywords": "Entrez des mots-clés pour rechercher des produits",
      "loadingCategories": "Chargement des catégories…",
      "allCategories": "Toutes les catégories",
      
      // Business Types
      "allBusinessTypes": "Tous les types d'entreprises",
      "association": "Association",
      "retailer": "Détaillant",
      "manufacturer": "Fabricant",
      "distributor": "Distributeur",
      "agent": "Agent",
      
      // Empty States
      "noProductsAvailable": "Aucun produit disponible",
      "noProductsForBusinessType": "Aucun produit disponible pour ce type d'entreprise",
      "tryDifferentBusinessType": "Essayez de sélectionner un autre type d'entreprise ou effacez le filtre pour voir tous les produits.",
      "checkBackLater": "Revenez plus tard pour de nouveaux produits ou ajustez vos critères de recherche.",
      "clearFilter": "Effacer le filtre"
    }
  },
  es: {
    translation: {
      // Navigation
      "allCategories": "Todas las categorías",
      "becomeAgent": "Convertirse en agente",
      "topRanking": "Producto mejor clasificado",
      "app": "App",
      "help": "Ayuda",
      "sourceRequest": "Solicitud de fuente",
      "english": "Inglés",
      "german": "Alemán",
      "french": "Francés",
      "spanish": "Español",
      "russian": "Ruso",
      
      // Header
      "searchPlaceholder": "Ingrese palabra clave para buscar producto...",
      "messages": "Mensajes",
      "productRequests": "Solicitudes de productos",
      "videoChannel": "Canal de video",
      "account": "Cuenta",
      "dashboard": "Panel de control",
      "logout": "Cerrar sesión",
      "signIn": "Iniciar sesión",
      "signUp": "Registrarse",
      "guestUser": "Usuario invitado",
      "atlasId": "ATLAS ID",
      
      // Categories
      "categories": "Categorías",
      "loadingCategories": "Cargando categorías…",
      
      // Slider
      "shopLatest": "Compra lo último",
      "exploreNow": "Explorar ahora",
      "previousSlide": "Diapositiva anterior",
      "nextSlide": "Siguiente diapositiva",
      
      // App Store
      "downloadAppStore": "Descargar en App Store",
      "getGooglePlay": "Obtener en Google Play",
      
      // Login requirement
      "loginRequired": "(Inicio de sesión requerido)",
      
      // Navigation actions
      "backToHome": "Volver Al Inicio",
      
      // Slider
      "shopLatest": "Compra lo último",
      "freshArrivals": "Nuevas llegadas de las mejores marcas",
      "featuredSelection": "Selección destacada",
      "curatedPicks": "Selecciones curadas para ti",
      "efficientWarehousing": "Almacenamiento eficiente",
      "seamlessFulfillment": "Cumplimiento y logística sin problemas",
      "exploreNow": "Explorar ahora",
      
      // Sidebar
      "categories": "Categorías",
      "youMayLike": "Te puede gustar",
      "postProductRequest": "Publica tu solicitud de producto ahora",
      
      // Main content
      "trendingProducts": "Productos en tendencia",
      "findOnlineProduct": "Encuentra nuestro producto en línea que es mejor para todos",
      "loadMore": "Cargar más",
      "loading": "Cargando…",
      "viewTopRanking": "Ver productos mejor clasificados",
      
      // Newsletter
      "subscribeNewsletter": "Suscríbete a nuestro boletín",
      "yourEmailAddress": "Tu dirección de correo",
      "subscribe": "Suscribirse",
      "subscribing": "Suscribiendo...",
      "stayUpdated": "Mantente actualizado con nuestras últimas noticias y ofertas",
      "enterYourEmail": "Ingresa tu correo",
      
      // Footer
      "yourBestOnlineMarket": "Tu mejor mercado en línea",
      "features": "Características",
      "sourcingGuide": "Guía de abastecimiento",
      "trendingProductsFooter": "Productos en tendencia",
      "supplierRanking": "Clasificación de proveedores",
      "productDesign": "Diseño de productos",
      "support": "Soporte",
      "customerService": "Servicio al cliente",
      "helpCenter": "Centro de ayuda",
      "submitDispute": "Enviar una disputa",
      "reportIPR": "Reportar IPR",
      "company": "Empresa",
      "tradeAssurance": "Garantía comercial",
      "businessIdentity": "Identidad empresarial",
      "logisticsService": "Servicio logístico",
      "securePayment": "Pago seguro",
      "resources": "Recursos",
      "getMobileApp": "Obtener aplicación móvil",
      "productMonitoring": "Monitoreo de productos",
      "tradeAlert": "Alerta comercial",
      "productionFlow": "Flujo de producción",
      "newsletter": "Boletín",
      "copyright": "Copyright ©2022 ATLAS-WD. Alerta comercial | Todos los derechos reservados.",
      
      // App Store
      "downloadOnThe": "Descargar en",
      "appStore": "App Store",
      "getItOn": "OBTENER EN",
      "googlePlay": "Google Play",
      
      // Search
      "enterKeywords": "Ingresa palabras clave para buscar productos",
      "loadingCategories": "Cargando categorías…",
      "allCategories": "Todas las categorías",
      
      // Business Types
      "allBusinessTypes": "Todos los tipos de negocio",
      "association": "Asociación",
      "retailer": "Minorista",
      "manufacturer": "Fabricante",
      "distributor": "Distribuidor",
      "agent": "Agente",
      
      // Empty States
      "noProductsAvailable": "No hay productos disponibles",
      "noProductsForBusinessType": "No hay productos disponibles para este tipo de negocio",
      "tryDifferentBusinessType": "Intenta seleccionar un tipo de negocio diferente o borra el filtro para ver todos los productos.",
      "checkBackLater": "Vuelve más tarde para nuevos productos o ajusta tus criterios de búsqueda.",
      "clearFilter": "Borrar filtro"
    }
  },
  ru: {
    translation: {
      // Navigation
      "allCategories": "Все категории",
      "becomeAgent": "Стать агентом",
      "topRanking": "Топ-рейтинг продуктов",
      "app": "Приложение",
      "help": "Помощь",
      "sourceRequest": "Запрос источника",
      "english": "Английский",
      "german": "Немецкий",
      "french": "Французский",
      "spanish": "Испанский",
      "russian": "Русский",
      
      // Header
      "searchPlaceholder": "Введите ключевое слово для поиска продукта...",
      "messages": "Сообщения",
      "productRequests": "Запросы продуктов",
      "videoChannel": "Видеоканал",
      "account": "Аккаунт",
      "dashboard": "Панель управления",
      "logout": "Выйти",
      "signIn": "Войти",
      "signUp": "Регистрация",
      "guestUser": "Гостевой пользователь",
      "atlasId": "ATLAS ID",
      
      // Categories
      "categories": "Категории",
      "loadingCategories": "Загрузка категорий…",
      
      // Slider
      "shopLatest": "Покупайте новинки",
      "exploreNow": "Исследовать сейчас",
      "previousSlide": "Предыдущий слайд",
      "nextSlide": "Следующий слайд",
      
      // App Store
      "downloadAppStore": "Скачать в App Store",
      "getGooglePlay": "Скачать в Google Play",
      
      // Login requirement
      "loginRequired": "(Требуется вход)",
      
      // Navigation actions
      "backToHome": "Вернуться На Главную",
      
      // Slider
      "shopLatest": "Покупайте новинки",
      "freshArrivals": "Свежие поступления от топ-брендов",
      "featuredSelection": "Рекомендуемая подборка",
      "curatedPicks": "Отобранные товары для вас",
      "efficientWarehousing": "Эффективное складирование",
      "seamlessFulfillment": "Бесшовное выполнение и логистика",
      "exploreNow": "Исследовать сейчас",
      
      // Sidebar
      "categories": "Категории",
      "youMayLike": "Вам может понравиться",
      "postProductRequest": "Разместите запрос на продукт сейчас",
      
      // Main content
      "trendingProducts": "Популярные продукты",
      "findOnlineProduct": "Найдите наш онлайн-продукт, который лучше всего подходит для всех",
      "loadMore": "Загрузить еще",
      "loading": "Загрузка…",
      "viewTopRanking": "Посмотреть топ-рейтинг продуктов",
      
      // Newsletter
      "subscribeNewsletter": "Подпишитесь на нашу рассылку",
      "yourEmailAddress": "Ваш адрес электронной почты",
      "subscribe": "Подписаться",
      "subscribing": "Подписка...",
      "stayUpdated": "Будьте в курсе наших последних новостей и предложений",
      "enterYourEmail": "Введите ваш email",
      
      // Footer
      "yourBestOnlineMarket": "Ваш лучший онлайн-рынок",
      "features": "Функции",
      "sourcingGuide": "Руководство по поиску поставщиков",
      "trendingProductsFooter": "Популярные продукты",
      "supplierRanking": "Рейтинг поставщиков",
      "productDesign": "Дизайн продукта",
      "support": "Поддержка",
      "customerService": "Служба поддержки клиентов",
      "helpCenter": "Центр помощи",
      "submitDispute": "Подать спор",
      "reportIPR": "Сообщить о нарушении IPR",
      "company": "Компания",
      "tradeAssurance": "Торговые гарантии",
      "businessIdentity": "Деловая идентичность",
      "logisticsService": "Логистические услуги",
      "securePayment": "Безопасная оплата",
      "resources": "Ресурсы",
      "getMobileApp": "Получить мобильное приложение",
      "productMonitoring": "Мониторинг продуктов",
      "tradeAlert": "Торговое оповещение",
      "productionFlow": "Производственный поток",
      "newsletter": "Рассылка",
      "copyright": "Copyright ©2022 ATLAS-WD. Торговое оповещение | Все права защищены.",
      
      // App Store
      "downloadOnThe": "Скачать в",
      "appStore": "App Store",
      "getItOn": "СКАЧАТЬ В",
      "googlePlay": "Google Play",
      
      // Search
      "enterKeywords": "Введите ключевые слова для поиска продуктов",
      "loadingCategories": "Загрузка категорий…",
      "allCategories": "Все категории",
      
      // Business Types
      "allBusinessTypes": "Все типы бизнеса",
      "association": "Ассоциация",
      "retailer": "Розничный торговец",
      "manufacturer": "Производитель",
      "distributor": "Дистрибьютор",
      "agent": "Агент",
      
      // Empty States
      "noProductsAvailable": "Нет доступных продуктов",
      "noProductsForBusinessType": "Нет продуктов для данного типа бизнеса",
      "tryDifferentBusinessType": "Попробуйте выбрать другой тип бизнеса или очистите фильтр, чтобы увидеть все продукты.",
      "checkBackLater": "Зайдите позже для новых продуктов или скорректируйте критерии поиска.",
      "clearFilter": "Очистить фильтр"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    }
  });

export default i18n;
