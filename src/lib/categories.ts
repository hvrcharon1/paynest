import type { ServiceCategory, CategoryMeta } from '@/types'

export const CATEGORY_META: Record<ServiceCategory, CategoryMeta> = {
  loan: { label: 'Loan / Debt', icon: 'Landmark', color: '#8B5CF6' },
  rent: { label: 'Rent', icon: 'Home', color: '#34D399' },
  water: { label: 'Water Bill', icon: 'Droplet', color: '#38BDF8' },
  electricity: { label: 'Electricity', icon: 'Zap', color: '#FBBF24' },
  internet: { label: 'Internet', icon: 'Wifi', color: '#60A5FA' },
  health_insurance: { label: 'Health Insurance', icon: 'HeartPulse', color: '#F87171' },
  dental_insurance: { label: 'Dental Insurance', icon: 'Smile', color: '#F472B6' },
  car_insurance: { label: 'Car Insurance', icon: 'Car', color: '#FB923C' },
  citation: { label: 'Citation / Fine', icon: 'Siren', color: '#EF4444' },
  school_fee: { label: 'School Fee', icon: 'GraduationCap', color: '#A78BFA' },
  p2p: { label: 'Pay a Friend', icon: 'Users', color: '#2DD4BF' },
  vehicle_rental: { label: 'Vehicle Rental', icon: 'CarFront', color: '#FCD34D' },
  other: { label: 'Other', icon: 'CircleDollarSign', color: '#94A3B8' },
}

export const CATEGORY_LIST = Object.entries(CATEGORY_META) as [ServiceCategory, CategoryMeta][]
