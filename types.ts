export interface Entity {
  id: string;
  name: string;
  description: string;
  aliases: string[]; // Thêm: để theo dõi các tên hoặc đại từ thay thế
  isLocked: boolean;
}

export interface ArtStyle {
  id: string;
  name: "Default" | "Cinematic" | "Anime" | "Cyberpunk Ghibli" | "Watercolor" | "Dong Ho Painting" | "Vietnamese Silk Painting" | "Custom";
  tags: string;
}

export interface Settings {
  wordsPerSecond: number;
  imageIntervalSeconds: number;
  selectedStyleId: string;
  batchSize: number; // MỚI: Kiểm soát số lượng phân đoạn trên mỗi lệnh gọi API
  safetyLevel: 'maximum' | 'cinematic_action' | 'indirect_suggestion'; // MỚI: Mức độ an toàn
}

// Kiểu mới để theo dõi các thay đổi trạng thái được AI xác định
export interface StateUpdate {
  entityName: string;
  entityType: 'character' | 'environment';
  newDescriptionDetail: string;
}

// CÁC LOẠI HÀNH ĐỘNG CHO BỘ GIẢM TỐC
export type Action =
  | { type: 'SET_API_KEYS'; payload: string[] }
  | { type: 'SET_SCRIPT'; payload: string }
  | { type: 'SET_SETTINGS'; payload: Partial<Settings> }
  | { type: 'SET_ART_STYLES'; payload: ArtStyle[] }
  | { type: 'START_LOADING' }
  | { type: 'STOP_LOADING' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ANALYZE_START' }
  | { type: 'ANALYZE_SUCCESS'; payload: { characters: Entity[]; environments: Entity[] } }
  | { type: 'UPDATE_CHARACTERS'; payload: Entity[] }
  | { type: 'UPDATE_ENVIRONMENTS'; payload: Entity[] }
  | { type: 'GENERATE_START' }
  | { type: 'GENERATE_PROGRESS'; payload: { prompt: string; updates: StateUpdate[] } }
  | { type: 'GENERATE_COMPLETE' }
  | { type: 'SET_GENERATION_TOTAL'; payload: number }
  | { type: 'SET_RECENTLY_UPDATED_IDS'; payload: string[] };

// TRẠNG THÁI TOÀN CỤC
export interface AppState {
    apiKeys: string[];
    script: string;
    settings: Settings;
    artStyles: ArtStyle[];
    characters: Entity[];
    environments: Entity[];
    prompts: string[];
    isLoading: boolean;
    error: string | null;
    generationProgress: { current: number; total: number } | null;
    recentlyUpdatedEntityIds: string[];
}