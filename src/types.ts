export interface Racer {
  id: string;
  country: string;
  flag: string;
  giftIcon: string;
  vehicleIcon: string;
  progress: number;
  wins: number;
  speed: number;
  boostEndTime?: number;
  isBoosting?: boolean;
}
