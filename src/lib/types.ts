export type ActivityType = 'food' | 'culture' | 'transport' | 'hotel' | 'nature' | 'other'
export type TravelStyle = 'solo' | 'couple' | 'friends' | 'family'
export type EntryType = 'memory' | 'planned'

export interface Trip {
  id: string
  user_id: string
  name: string
  description: string | null
  destination: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  is_public: boolean
  cover_url: string | null
  travel_style: TravelStyle | null
  created_at: string
  updated_at: string
}

export interface TripMember {
  id: string
  trip_id: string
  user_id: string
  invited_by: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  profile?: Profile
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_emoji: string
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export interface PlaceFolder {
  id: string
  user_id: string
  name: string
  emoji: string
  parent_id: string | null
  created_at: string
}

export interface Place {
  id: string
  user_id: string
  title: string
  description: string | null
  activity_type: ActivityType
  location_name: string | null
  is_favorite: boolean
  photos: string[]
  folder_id: string | null
  created_at: string
  updated_at: string
}

export interface PhotoDetail {
  url: string
  caption: string | null
}

export interface Activity {
  id: string
  trip_id: string
  user_id: string
  title: string
  description: string | null
  activity_type: ActivityType
  entry_type: EntryType
  scheduled_at: string
  location_name: string | null
  location_lat: number | null
  location_lng: number | null
  photos: string[]
  cost: number | null
  is_expandable: boolean
  photo_details: PhotoDetail[]
  created_at: string
  updated_at: string
}
