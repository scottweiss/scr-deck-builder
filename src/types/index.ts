/**
 * Main index file for all type definitions
 */

export * from './Card';
export * from './Deck';
export * from './GameEvent';
export * from './game-types';
export * from './card-types';

/**
 * Common utility types
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Generic result type for operations that may fail
 */
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Performance timing information
 */
export interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}

/**
 * Configuration options for the deck building system
 */
export interface SystemConfig {
  dataSets: string[];
  preferredElement?: string;
  exportJson: boolean;
  showRules: boolean;
  debug: boolean;
  cacheEnabled: boolean;
  maxDeckSize: number;
  minDeckSize: number;
}
