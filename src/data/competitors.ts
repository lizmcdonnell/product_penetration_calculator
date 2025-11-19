import type { CompetitorsByRegion } from '../types';

export const PRODUCT_COMPETITORS: Record<string, CompetitorsByRegion> = {
  "Point-of-sale (stationary or mobile)": {
    uk: ["Epos Now", "Zonal (Zonal Systems)", "Toast UK"],
    germany: ["Gastrofix", "Orderbird", "PosBill"],
    france: ["Tiller (by SumUp)", "Codabox", "YUMI POS"],
    belgium: ["Storyous BE", "iKentoo BE", "Square BE"],
  },
  "Digital on-table ordering & payments": {
    uk: ["Preoday", "Veloxity", "Zonal self-ordering"],
    germany: ["TableSolution (by NextTable)", "Orderbird QR Ordering", "Resmio"],
    france: ["LivePepper", "Flipdish France", "OuestDigital"],
    belgium: ["OakyHQ", "Flipdish Belgium", "Deliverect (table module)"],
  },
  "Ordering kiosk": {
    uk: ["Zonal Self-Service Kiosk", "Aures Kiosk UK", "PepperHQ"],
    germany: ["Orderbird Kiosk", "Kiosk Europe GmbH", "Advantech Kiosk Solutions DE"],
    france: ["Eurest Kiosk Solutions", "SelfOrderingKiosk FR", "Edenred Kiosk FR"],
    belgium: ["Kiosk Solutions BE", "Storyous Self-Order BE", "NextKiosk BE"],
  },
  "Order on my website": {
    uk: ["Flipdish UK", "Preoday UK", "Deliverect UK"],
    germany: ["Orderbird WebOrdering", "Resmio WebOrder", "UpMenu DE"],
    france: ["LivePepper Web", "Flipdish France", "Zenchef WebOrder"],
    belgium: ["Deliverect BE", "Flipdish Belgium", "UpMenu BE"],
  },
  "Order via 3rd party integration": {
    uk: ["JustEat Partner", "Deliveroo Merchant", "Uber Eats for Restaurants UK"],
    germany: ["Lieferando Partner", "Uber Eats DE", "DeliveryHero B2B DE"],
    france: ["Uber Eats FR", "Deliveroo FR", "JustEat France"],
    belgium: ["Deliveroo BE", "Uber Eats BE", "Takeaway.com BE"],
  },
  "Omniboost PMS Integration": {
    uk: ["CloudBeds", "RoomRaccoon", "RMS Hospitality UK"],
    germany: ["Protel", "RoomRaccoon DE", "Clock Software DE"],
    france: ["Guestline FR", "Mews FR", "Protel FR"],
    belgium: ["RMS Belgium", "RoomRaccoon BE", "Hotelity BE"],
  },
  "Direct API Access": {
    uk: ["SumUp API", "Zonal API", "Square API"],
    germany: ["Orderbird API", "Revo POS DE API", "SumUp DE API"],
    france: ["LivePepper API", "Zenchef API", "PayPal Zettle FR API"],
    belgium: ["SumUp BE API", "Deliverect API", "Square BE API"],
  },
  "Accounting": {
    uk: ["Xero UK", "Sage UK", "QuickBooks UK"],
    germany: ["DATEV", "Lexware", "Sage DE"],
    france: ["Sage FR", "Cegid", "QuickBooks FR"],
    belgium: ["Exact Online BE", "Sage BE", "Winbooks BE"],
  },
  "Loyalty": {
    uk: ["Antavo", "LoyaltyLion UK", "Capillary Technologies UK"],
    germany: ["Loylogic DE", "Concardis Loyalty DE", "Antavo DE"],
    france: ["Swile", "Smile.io FR", "Antavo FR"],
    belgium: ["Antavo BE", "LoyaltyLion BE", "Sodexo Loyalties BE"],
  },
  "Physical Gift Cards": {
    uk: ["Blackhawk Network UK", "Edenred UK", "VoucherCart UK"],
    germany: ["Edenred DE", "Blackhawk Network DE", "Valyou DE"],
    france: ["Edenred FR", "Blackhawk Network FR", "Swile Gift Cards FR"],
    belgium: ["Edenred BE", "Blackhawk Network BE", "VoucherCart BE"],
  },
  "Digital Gift Cards": {
    uk: ["VoucherCart UK", "Blackhawk Network UK", "PayPal Gift Solutions UK"],
    germany: ["Edenred DE", "Blackhawk Network DE", "Valyou Digital DE"],
    france: ["Swile Digital FR", "Blackhawk Network FR", "Edenred FR Digital"],
    belgium: ["Edenred BE Digital", "Blackhawk Network BE", "VoucherCart BE Digital"],
  },
  "Inventory Management": {
    uk: ["StockTake Online", "BlueCart UK", "BevSpot UK (foodservice)"],
    germany: ["Foodnotify DE", "TastyCloud DE", "Stocky DE"],
    france: ["LeanGourmet FR", "Hosco Inventory FR", "Foodys Solutions FR"],
    belgium: ["StockTake BE", "BevSpot BE", "EasyStock BE"],
  },
  "KDS": {
    uk: ["Preoday Kitchen", "Zonal Kitchen Display UK", "Square Kitchen UK"],
    germany: ["KitchenDisplay.de", "Gastrofix Kitchen", "Orderbird Kitchen DE"],
    france: ["LivePepper Kitchen FR", "Zenchef Kitchen FR", "Square Kitchen FR"],
    belgium: ["Square Kitchen BE", "Storyous Kitchen BE", "Deliverect Kitchen BE"],
  },
  "DATEV & Cloud TSE": {
    germany: ["DATEV", "Lexware Cloud", "Addison Software DE"],
  },
  // Alternative mappings for product name variations
  "Point-of-sale (Stationary)": {
    uk: ["Epos Now", "Zonal (Zonal Systems)", "Toast UK"],
    germany: ["Gastrofix", "Orderbird", "PosBill"],
    france: ["Tiller (by SumUp)", "Codabox", "YUMI POS"],
    belgium: ["Storyous BE", "iKentoo BE", "Square BE"],
  },
  "Point-of-sale (Tableside mPOS)": {
    uk: ["SumUp", "iZettle/PayPal", "Zonal Mobile POS"],
    germany: ["Orderbird mPOS", "SumUp mPOS", "Gastrofix Mobile"],
    france: ["SumUp Tiller Mobile", "PayPal Zettle FR", "Codabox Mobile"],
    belgium: ["SumUp BE", "Storyous Mobile BE", "Square Mobile BE"],
  },
  "Order via 3rd-party integration": {
    uk: ["JustEat Partner", "Deliveroo Merchant", "Uber Eats for Restaurants UK"],
    germany: ["Lieferando Partner", "Uber Eats DE", "DeliveryHero B2B DE"],
    france: ["Uber Eats FR", "Deliveroo FR", "JustEat France"],
    belgium: ["Deliveroo BE", "Uber Eats BE", "Takeaway.com BE"],
  },
  "Property Management System (PMS)": {
    uk: ["CloudBeds", "RoomRaccoon", "RMS Hospitality UK"],
    germany: ["Protel", "RoomRaccoon DE", "Clock Software DE"],
    france: ["Guestline FR", "Mews FR", "Protel FR"],
    belgium: ["RMS Belgium", "RoomRaccoon BE", "Hotelity BE"],
  },
  "Accounting Integration": {
    uk: ["Xero UK", "Sage UK", "QuickBooks UK"],
    germany: ["DATEV", "Lexware", "Sage DE"],
    france: ["Sage FR", "Cegid", "QuickBooks FR"],
    belgium: ["Exact Online BE", "Sage BE", "Winbooks BE"],
  },
  "KDS (Kitchen Display System)": {
    uk: ["Preoday Kitchen", "Zonal Kitchen Display UK", "Square Kitchen UK"],
    germany: ["KitchenDisplay.de", "Gastrofix Kitchen", "Orderbird Kitchen DE"],
    france: ["LivePepper Kitchen FR", "Zenchef Kitchen FR", "Square Kitchen FR"],
    belgium: ["Square Kitchen BE", "Storyous Kitchen BE", "Deliverect Kitchen BE"],
  },
};

