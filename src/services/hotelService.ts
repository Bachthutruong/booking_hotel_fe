import api from './api';
import type { Hotel, Room, Review, ApiResponse, HotelSearchParams, Pagination } from '@/types';

interface HotelsResponse extends ApiResponse<Hotel[]> {
  pagination: Pagination;
}

interface RoomsResponse extends ApiResponse<Room[]> {
  pagination: Pagination;
}

interface ReviewsResponse extends ApiResponse<Review[]> {
  pagination: Pagination;
}

export const hotelService = {
  // Hotels
  async getHotels(params?: HotelSearchParams): Promise<HotelsResponse> {
    const { data } = await api.get<HotelsResponse>('/hotels', { params });
    return data;
  },

  async getHotel(id: string): Promise<ApiResponse<Hotel>> {
    const { data } = await api.get<ApiResponse<Hotel>>(`/hotels/${id}`);
    return data;
  },

  async getFeaturedHotels(): Promise<ApiResponse<Hotel[]>> {
    const { data } = await api.get<ApiResponse<Hotel[]>>('/hotels/featured');
    return data;
  },

  async getPopularCities(): Promise<ApiResponse<{ city: string; count: number }[]>> {
    const { data } = await api.get<ApiResponse<{ city: string; count: number }[]>>('/hotels/cities');
    return data;
  },

  async createHotel(hotelData: Partial<Hotel>): Promise<ApiResponse<Hotel>> {
    const { data } = await api.post<ApiResponse<Hotel>>('/hotels', hotelData);
    return data;
  },

  async updateHotel(id: string, hotelData: Partial<Hotel>): Promise<ApiResponse<Hotel>> {
    const { data } = await api.put<ApiResponse<Hotel>>(`/hotels/${id}`, hotelData);
    return data;
  },

  async deleteHotel(id: string): Promise<ApiResponse> {
    const { data } = await api.delete<ApiResponse>(`/hotels/${id}`);
    return data;
  },

  async uploadHotelImages(id: string, images: File[]): Promise<ApiResponse<Hotel>> {
    const formData = new FormData();
    images.forEach((image) => formData.append('images', image));
    const { data } = await api.post<ApiResponse<Hotel>>(`/hotels/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // Rooms
  async getRooms(hotelId: string, params?: { page?: number; limit?: number }): Promise<RoomsResponse> {
    const { data } = await api.get<RoomsResponse>(`/hotels/${hotelId}/rooms`, { params });
    return data;
  },

  async getAvailableRooms(
    hotelId: string,
    checkIn: string,
    checkOut: string,
    adults?: number,
    children?: number
  ): Promise<ApiResponse<Room[]>> {
    const { data } = await api.get<ApiResponse<Room[]>>(`/hotels/${hotelId}/rooms/available`, {
      params: { checkIn, checkOut, adults, children },
    });
    return data;
  },

  async getRoom(id: string): Promise<ApiResponse<Room>> {
    const { data } = await api.get<ApiResponse<Room>>(`/rooms/${id}`);
    return data;
  },

  async createRoom(hotelId: string, roomData: Partial<Room>): Promise<ApiResponse<Room>> {
    const { data } = await api.post<ApiResponse<Room>>(`/hotels/${hotelId}/rooms`, roomData);
    return data;
  },

  async updateRoom(id: string, roomData: Partial<Room>): Promise<ApiResponse<Room>> {
    const { data } = await api.put<ApiResponse<Room>>(`/rooms/${id}`, roomData);
    return data;
  },

  async deleteRoom(id: string): Promise<ApiResponse> {
    const { data } = await api.delete<ApiResponse>(`/rooms/${id}`);
    return data;
  },

  async uploadRoomImages(id: string, images: File[]): Promise<ApiResponse<Room>> {
    const formData = new FormData();
    images.forEach((image) => formData.append('images', image));
    const { data } = await api.post<ApiResponse<Room>>(`/rooms/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // Reviews
  async getReviews(hotelId: string, params?: { page?: number; limit?: number }): Promise<ReviewsResponse> {
    const { data } = await api.get<ReviewsResponse>(`/hotels/${hotelId}/reviews`, { params });
    return data;
  },

  async createReview(
    hotelId: string,
    reviewData: { bookingId: string; rating: number; comment: string }
  ): Promise<ApiResponse<Review>> {
    const { data } = await api.post<ApiResponse<Review>>(`/hotels/${hotelId}/reviews`, reviewData);
    return data;
  },
};
