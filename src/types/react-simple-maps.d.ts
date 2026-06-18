declare module 'react-simple-maps' {
  import { ComponentType, ReactNode, CSSProperties } from 'react'

  export interface GeoFeature {
    rsmKey: string
    id: string | number
    type: string
    properties: Record<string, unknown>
    geometry: object
  }

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: { scale?: number; center?: [number, number]; [k: string]: unknown }
    style?: CSSProperties
    width?: number
    height?: number
    children?: ReactNode
  }

  export interface GeographiesProps {
    geography: string | object
    children: (props: { geographies: GeoFeature[] }) => ReactNode
  }

  export interface GeographyProps {
    geography: GeoFeature
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: { outline?: string; fill?: string }
      hover?: { outline?: string; fill?: string }
      pressed?: { outline?: string; fill?: string }
    }
    key?: string
  }

  export const ComposableMap: ComponentType<ComposableMapProps>
  export const Geographies: ComponentType<GeographiesProps>
  export const Geography: ComponentType<GeographyProps>
}
