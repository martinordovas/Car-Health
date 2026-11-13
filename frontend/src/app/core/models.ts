export interface User {
  id: number;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type FuelType =
  | 'GASOLINE_95'
  | 'GASOLINE_98'
  | 'DIESEL'
  | 'HYBRID'
  | 'PLUG_IN_HYBRID'
  | 'ELECTRIC'
  | 'LPG'
  | 'OTHER';

export interface Vehicle {
  id: number;
  name: string;
  nickname?: string | null;
  brand: string;
  model: string;
  year: number;
  engineCode?: string | null;
  vin?: string | null;
  licensePlate?: string | null;
  currentOdometer: number;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  fuelType: FuelType;
  color?: string | null;
  photoData?: string | null;
  createdAt: string;
}

export interface VehicleInput {
  brand: string;
  model: string;
  year: number;
  nickname?: string | null;
  engineCode?: string | null;
  vin?: string | null;
  licensePlate?: string | null;
  currentOdometer: number;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  fuelType: FuelType;
  color?: string | null;
  photoData?: string | null;
}

export interface SavingsSummary {
  referencePrice: number;
  currentPrice: number;
  unitSavings: number;
  savingsAmount: number;
  percentCheaper: number;
  comparisonType: 'STATION_AVERAGE' | 'PREVIOUS_FILL' | string;
  message: string;
}

export interface FuelLog {
  id: number;
  date: string;
  odometer: number;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  stationName?: string | null;
  stationLocation?: string | null;
  fullTank: boolean;
  boardComputerAvg?: number | null;
  consumption?: number | null;
  savings?: SavingsSummary | null;
  createdAt: string;
  pending?: boolean;
  failed?: boolean;
}

export interface FuelLogInput {
  date: string;
  odometer: number;
  liters: number;
  pricePerLiter: number;
  totalCost?: number | null;
  stationName?: string | null;
  stationLocation?: string | null;
  fullTank: boolean;
  boardComputerAvg?: number | null;
}

export type ServiceCategory = 'PREVENTIVE' | 'CORRECTIVE' | 'MODIFICATION' | 'LEGAL';
export type PerformedBy = 'DIY' | 'WORKSHOP';

export interface PartItem {
  id?: number;
  partName: string;
  oemReference?: string | null;
  brand?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
}

export interface ServiceRecord {
  id: number;
  date: string;
  odometer: number;
  category: ServiceCategory;
  title: string;
  ruleId?: number | null;
  ruleName?: string | null;
  totalCost: number;
  laborCost: number;
  partsCost: number;
  performedBy: PerformedBy;
  notes?: string | null;
  invoiceFilePath?: string | null;
  parts: PartItem[];
  createdAt: string;
  pending?: boolean;
  failed?: boolean;
}

export interface PartInput {
  partName: string;
  oemReference?: string | null;
  brand?: string | null;
  quantity: number;
  unitPrice: number;
}

export interface ServiceRecordInput {
  date: string;
  odometer: number;
  category: ServiceCategory;
  title: string;
  ruleId?: number | null;
  totalCost?: number | null;
  laborCost: number;
  performedBy: PerformedBy;
  notes?: string | null;
  invoiceFilePath?: string | null;
  parts: PartInput[];
}

export type MaintenanceStatus = 'OVERDUE' | 'DUE_SOON' | 'OK' | 'UNKNOWN';

export interface MaintenanceRule {
  id: number;
  name: string;
  category: ServiceCategory;
  intervalKm?: number | null;
  intervalMonths?: number | null;
  baselineOdometer?: number | null;
  baselineDate?: string | null;
  lastServiceDate?: string | null;
  lastServiceOdometer?: number | null;
  lastServiceTitle?: string | null;
  nextServiceDate?: string | null;
  nextServiceKm?: number | null;
  remainingKm?: number | null;
  remainingDays?: number | null;
  status: MaintenanceStatus;
}

export interface DashboardKpis {
  avgConsumption?: number | null;
  lastConsumption?: number | null;
  spentThisMonth: number;
  spentLast30Days: number;
  savingsThisYear: number;
  totalSpent: number;
  totalFuelSpent: number;
  totalServiceSpent: number;
  costPerKm?: number | null;
  totalLiters: number;
  avgFuelPrice?: number | null;
  totalFuelLogs: number;
  totalServiceRecords: number;
}

export interface ActivityItem {
  type: 'FUEL' | 'SERVICE';
  id: number;
  date: string;
  title: string;
  subtitle: string;
  amount: number;
}

export interface Dashboard {
  vehicle: Vehicle;
  kpis: DashboardKpis;
  upcomingMaintenance: MaintenanceRule[];
  recentActivity: ActivityItem[];
}

export interface MonthlyPoint {
  month: string;
  label: string;
  fuelSpent: number;
  serviceSpent: number;
  totalSpent: number;
  liters: number;
  savings: number;
  consumption?: number | null;
}

export interface ConsumptionPoint {
  date: string;
  odometer: number;
  value: number;
}

export interface PricePoint {
  date: string;
  value: number;
}

export interface StationStats {
  name: string;
  location?: string | null;
  fills: number;
  avgPrice: number;
  bestPrice: number;
  lastPrice: number;
  totalSpent: number;
  totalSavings: number;
}

export interface CategoryStat {
  category: ServiceCategory;
  total: number;
  count: number;
}

export interface StatsTotals {
  fuelSpent: number;
  serviceSpent: number;
  totalSpent: number;
  totalLiters: number;
  avgFuelPrice?: number | null;
  avgConsumption?: number | null;
  lastConsumption?: number | null;
  totalSavings: number;
  costPerKm?: number | null;
  fillCount: number;
  serviceCount: number;
}

export interface VehicleStats {
  totals: StatsTotals;
  monthly: MonthlyPoint[];
  consumption: ConsumptionPoint[];
  prices: PricePoint[];
  stations: StationStats[];
  categories: CategoryStat[];
}

export type MutationKind = 'fuel' | 'service';

export interface QueuedMutation {
  id: string;
  userId: number;
  kind: MutationKind;
  vehicleId: number;
  url: string;
  method: 'POST';
  body: unknown;
  preview: FuelLog | ServiceRecord;
  label: string;
  createdAt: number;
  status: 'pending' | 'failed';
  error?: string;
}
