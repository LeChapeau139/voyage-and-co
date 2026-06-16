export type ActivityType = 'food' | 'culture' | 'transport' | 'hotel' | 'nature' | 'other'

export interface Trip {
  id: string
  user_id: string
  name: string
  description: string | null
  destination: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  cover_url: string | null
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  trip_id: string
  user_id: string
  title: string
  description: string | null
  activity_type: ActivityType
  scheduled_at: string
  location_name: string | null
  location_lat: number | null
  location_lng: number | null
  photos: string[]
  created_at: string
  updated_at: string
}
