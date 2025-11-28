

export type Language = 'pt' | 'en';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'customer' | 'staff';
  avatar?: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: 'economy' | 'suv' | 'luxury' | 'van';
  transmission: 'manual' | 'automatic';
  seats: number;
  pricePerDay: number;
  image: string;
  available: boolean; // General availability (e.g. not in maintenance)
  status: 'available' | 'maintenance' | 'rented';
  rating: number;
  reviewCount: number;
  plate?: string;
}

export interface ReservationExtras {
  gps: boolean;
  childSeat: boolean;
  insurance: boolean;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
export type PaymentMethod = 'vinti4' | 'card' | 'cash' | 'stripe' | 'paypal';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface Reservation {
  id: string;
  vehicleId?: string; // Optional for tours
  tourId?: string;    // New for tours
  type?: 'vehicle' | 'tour'; // Distinguish types
  userId: string;
  customerName: string;
  startDate: string;
  endDate: string; // Same as startDate for single-day tours
  status: ReservationStatus;
  total: number;
  discount?: number;
  paidAmount?: number;
  pickupType?: 'office' | 'delivery';
  pickupLocation?: string; 
  pickupAddress?: string; 
  flightNumber?: string;
  numberOfPassengers?: number;
  extras?: ReservationExtras;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  transactionId?: string;
  dateCreated: string;
}

export interface Review {
  id: string;
  vehicleId: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'maintenance' | 'fuel' | 'office' | 'marketing' | 'other';
  date: string;
}

export interface Tour {
  id: string;
  title: string;
  description: string;
  image: string;
  duration: string;
  price: number;
  features: string[];
}

export interface Translation {
  nav: {
    home: string;
    fleet: string;
    tours: string;
    admin: string;
    login: string;
    logout: string;
    my_reservations: string;
    welcome: string;
  };
  hero: {
    title: string;
    subtitle: string;
    search_placeholder: string;
    search_btn: string;
    pickup_date: string;
    dropoff_date: string;
    error_dates: string;
  };
  filters: {
    all: string;
    economy: string;
    suv: string;
    luxury: string;
    automatic: string;
    manual: string;
    van: string;
  };
  vehicle: {
    day: string;
    seats: string;
    book_now: string;
    unavailable: string;
    reviews: string;
    maintenance: string;
  };
  booking: {
    title: string;
    step_details: string;
    step_extras: string;
    step_docs: string;
    step_payment: string;
    total: string;
    discount_applied: string; 
    pay_now: string;
    pay_later: string;
    delivery_opt: string;
    delivery_placeholder: string;
    upload_id: string;
    upload_license: string;
    upload_success: string; 
    confirm_pay: string;
    payment_method: string;
    pay_vinti4: string;
    pay_card: string;
    pay_stripe: string;
    pay_paypal: string;
    success_title: string;
    success_msg: string;
    download_contract: string;
    close: string;
    reviews_title: string;
    no_reviews: string;
    write_review: string;
    submit_review: string;
    your_rating: string;
    your_comment: string;
    extras_title: string;
    extra_gps: string;
    extra_child_seat: string;
    extra_insurance: string;
    error_dates_invalid: string;
    about_company_title: string;
    about_company_desc: string;
    useful_info_title: string;
    info_cancellation: string;
    info_no_credit_card: string;
    info_insurance: string;
    info_deposit: string;
    pickup_location_title: string;
    loc_airport: string;
    loc_city: string;
    loc_port: string;
    loc_custom: string;
    free: string;
    flight_number: string;
    flight_hint: string;
    num_passengers: string;
    payment_processing: string;
    payment_success: string;
    card_holder: string;
    card_number: string;
    card_expiry: string;
    card_cvc: string;
    vinti4_phone: string;
    vinti4_instr: string;
    stripe_instr: string;
    paypal_instr: string;
  };
  tour_booking: {
    title: string;
    select_date: string;
    guests: string;
    total_price: string;
    confirm_purchase: string;
    success_title: string;
    success_msg: string;
    email_sent: string;
    download_ticket: string;
  };
  tours: {
    title: string;
    subtitle: string;
    book_tour: string;
    duration: string;
    included: string;
    view_details: string;
    buy_now: string;
  };
  admin: {
    dashboard: string;
    revenue: string;
    active_rentals: string;
    fleet_status: string;
    recent_reservations: string;
    reviews_moderation: string;
    approve: string;
    reject: string;
    status: string;
    tabs_overview: string;
    tabs_fleet: string;
    tabs_reservations: string;
    tabs_deliveries: string;
    tabs_reviews: string;
    tabs_settings: string;
    tabs_finance: string; 
    tabs_tours: string; 
    tabs_reports: string;
    filter_pending: string;
    filter_all: string;
    add_vehicle: string;
    add_tour: string;
    edit: string;
    delete: string;
    plate: string;
    price: string;
    actions: string;
    save: string;
    cancel: string;
    mark_active: string;
    mark_completed: string;
    mark_cancelled: string;
    confirm: string;
    confirm_delete: string;
    api_key_label: string;
    api_key_placeholder: string;
    vinti4_section: string;
    vinti4_pos_id: string;
    vinti4_api_key: string;
    vinti4_doc_link: string;
    stripe_section: string;
    stripe_key: string;
    paypal_section: string;
    paypal_client: string;
    save_settings: string;
    settings_saved: string;
    payment_status: string;
    paid: string;
    pending_payment: string;
    fin_total_income: string;
    fin_total_expenses: string;
    fin_net_profit: string;
    fin_add_expense: string;
    fin_desc: string;
    fin_amount: string;
    fin_category: string;
    fin_date: string;
    fin_recent_transactions: string;
    fin_type_income: string;
    fin_type_expense: string;
    settings_general: string;
    settings_integrations: string;
    settings_payments: string;
    comp_name: string;
    comp_email: string;
    comp_phone: string;
    comp_address: string;
    tour_title: string;
    tour_price: string;
    tour_features: string;
    tour_features_help: string;
    rep_occupancy: string;
    rep_avg_ticket: string;
    rep_rev_by_cat: string;
    rep_monthly_growth: string;
    rep_export_csv: string;
    rep_export_pdf: string;
    rep_statement: string;
    rep_avg_duration: string;
    rep_days_rented: string;
    rep_status_dist: string;
    rep_vehicle_perf: string;
    rep_top_vehicles: string;
    rep_perf_days: string;
    rep_perf_revenue: string;
    // Filters
    rep_filter_date_start: string;
    rep_filter_date_end: string;
    rep_filter_vehicle: string;
    rep_filter_category: string;
    rep_filter_type: string;
    rep_filter_clear: string;
    rep_filter_apply: string;
  };
  customer: {
    dashboard: string;
    status: string;
    leave_review: string;
    review_submitted: string;
    download_contract: string;
    cancel_booking: string;
    confirm_cancel: string; 
    tabs_reservations: string;
    tabs_profile: string;
    profile_settings: string;
    personal_details: string;
    save_changes: string;
    profile_updated: string;
  };
  auth: {
    login_title: string;
    login_admin: string;
    login_customer: string;
    email: string;
    password: string;
  };
  footer: {
    about: string;
    about_text: string;
    links: string;
    contact: string;
    address: string;
    phone: string;
    email: string;
    rights: string;
    privacy: string;
    terms: string;
  };
  pagination: {
    prev: string;
    next: string;
    page: string;
    of: string;
  }
}