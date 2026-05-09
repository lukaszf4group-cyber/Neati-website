declare module "react-simple-maps" {
  import * as React from "react";

  export interface ProjectionConfig {
    center?: [number, number];
    scale?: number;
    rotate?: [number, number, number];
  }

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: ProjectionConfig;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }
  export const ComposableMap: React.FC<ComposableMapProps>;

  export interface GeographiesProps {
    geography: string | object;
    children: (props: { geographies: Geography[] }) => React.ReactNode;
  }
  export const Geographies: React.FC<GeographiesProps>;

  export interface Geography {
    rsmKey: string;
    id: string;
    type: string;
    properties: Record<string, unknown>;
  }

  export interface GeographyProps {
    geography: Geography;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeLinejoin?: "round" | "miter" | "bevel";
    strokeLinecap?: "round" | "butt" | "square";
    vectorEffect?: string;
    shapeRendering?: string;
    paintOrder?: string;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
  }
  export const Geography: React.FC<GeographyProps>;

  export interface MarkerProps {
    coordinates: [number, number];
    children?: React.ReactNode;
  }
  export const Marker: React.FC<MarkerProps>;
}
