import { parkingRepository } from '@/repositories/parkingRepository';
import { ParkingLot, TimeSlot } from '@/domain/models';

export const parkingService = {
  async getAllWithAvailability(): Promise<(ParkingLot & { availableSlots: number })[]> {
    const lots = await parkingRepository.getAll();
    const results = await Promise.all(
      lots.map(async (lot) => ({
        ...lot,
        availableSlots: await parkingRepository.getAvailableSlots(lot.id),
      }))
    );
    return results;
  },

  async getById(id: string): Promise<ParkingLot | null> {
    return parkingRepository.getById(id);
  },

  async getTimeSlots(parkingLotId: string, date: string): Promise<TimeSlot[]> {
    return parkingRepository.getTimeSlots(parkingLotId, date);
  },
};
