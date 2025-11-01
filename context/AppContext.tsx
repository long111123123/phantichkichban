import React, { createContext, useCallback, useEffect, useContext, ReactNode, useReducer, useRef } from 'react';
import { analyzeScript, generatePrompts } from '../services/geminiService';
import type { Entity, Settings, ArtStyle, StateUpdate, Action, AppState } from '../types';

const defaultArtStyles: ArtStyle[] = [
  { id: 'default', name: 'Default', tags: 'digital art, detailed, high quality, sharp focus' },
  { id: 'cinematic', name: 'Cinematic', tags: 'cinematic lighting, epic composition, movie still, ultra realistic, 8k' },
  { id: 'anime', name: 'Anime', tags: 'anime style, ghibli inspired, vibrant colors, detailed background, charming characters' },
  { id: 'cyb-ghibli', name: 'Cyberpunk Ghibli', tags: 'charming anime style, Ghibli inspired, detailed background, cyberpunk city, neon lights, cinematic lighting' },
  { id: 'watercolor', name: 'Watercolor', tags: 'watercolor painting, soft gradients, pastel colors, ink outlines, textured paper, dreamy atmosphere' },
  { id: 'dong-ho', name: 'Dong Ho Painting', tags: 'vietnamese dong ho woodblock print, folk art style, simple bold outlines, flat natural colors on shimmering textured seashell paper, rustic village life depiction' },
  { id: 'silk-painting', name: 'Vietnamese Silk Painting', tags: 'vietnamese silk painting style, delicate and flowing ink washes, soft ethereal translucent colors on a fine silk canvas, poetic and atmospheric, in the style of Nguyen Phan Chanh' },
];

const initialState: AppState = {
  apiKeys: [],
  script: '',
  settings: {
    wordsPerSecond: 3,
    imageIntervalSeconds: 20,
    selectedStyleId: 'default',
    batchSize: 5,
    safetyLevel: 'maximum',
  },
  artStyles: defaultArtStyles,
  characters: [],
  environments: [],
  prompts: [],
  isLoading: false,
  error: null,
  generationProgress: null,
  recentlyUpdatedEntityIds: [],
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_API_KEYS':
      return { ...state, apiKeys: action.payload };
    case 'SET_SCRIPT':
      return { ...state, script: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SET_ART_STYLES':
      return { ...state, artStyles: action.payload };
    case 'START_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'STOP_LOADING':
      return { ...state, isLoading: false };
    case 'SET_ERROR':
      return { ...state, isLoading: false, error: action.payload, generationProgress: null };
    case 'ANALYZE_START':
      return { ...state, isLoading: true, error: null, characters: [], environments: [] };
    case 'ANALYZE_SUCCESS':
      return { ...state, isLoading: false, characters: action.payload.characters, environments: action.payload.environments };
    case 'UPDATE_CHARACTERS':
      return { ...state, characters: action.payload };
    case 'UPDATE_ENVIRONMENTS':
      return { ...state, environments: action.payload };
    case 'GENERATE_START':
      return { ...state, isLoading: true, error: null, prompts: [], generationProgress: { current: 0, total: 0 } };
    case 'SET_GENERATION_TOTAL':
      return { ...state, generationProgress: { current: 0, total: action.payload } };
    case 'GENERATE_PROGRESS':
      const newPrompts = [...state.prompts, action.payload.prompt];
      return {
        ...state,
        prompts: newPrompts,
        generationProgress: state.generationProgress ? { ...state.generationProgress, current: newPrompts.length } : null,
      };
    case 'GENERATE_COMPLETE':
      return { ...state, isLoading: false, generationProgress: null };
    case 'SET_RECENTLY_UPDATED_IDS':
      return { ...state, recentlyUpdatedEntityIds: action.payload };
    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  handleAnalyze: () => Promise<void>;
  handleGenerate: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const activeControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const storedKeys = localStorage.getItem('apiKeys');
      if (storedKeys) {
        dispatch({ type: 'SET_API_KEYS', payload: JSON.parse(storedKeys) });
      }
      const savedCustomStyles = localStorage.getItem('customArtStyles');
      if (savedCustomStyles) {
        dispatch({ type: 'SET_ART_STYLES', payload: [...defaultArtStyles, ...JSON.parse(savedCustomStyles)] });
      }
      const savedSettings = localStorage.getItem('appSettings');
       if (savedSettings) {
        dispatch({ type: 'SET_SETTINGS', payload: { ...initialState.settings, ...JSON.parse(savedSettings) } });
      }
    } catch (e) {
      console.error("Không thể tải trạng thái từ localStorage:", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('apiKeys', JSON.stringify(state.apiKeys));
    } catch (e) {
      console.error("Không thể lưu API keys vào localStorage:", e);
    }
  }, [state.apiKeys]);
  
  useEffect(() => {
    try {
      const customStyles = state.artStyles.filter(style => style.name === 'Custom');
      localStorage.setItem('customArtStyles', JSON.stringify(customStyles));
    } catch (e) {
      console.error("Không thể lưu các phong cách tùy chỉnh vào localStorage:", e);
    }
  }, [state.artStyles]);

  useEffect(() => {
    try {
      localStorage.setItem('appSettings', JSON.stringify(state.settings));
    } catch (e) {
      console.error("Không thể lưu cài đặt vào localStorage:", e);
    }
  }, [state.settings]);


  const cancelCurrentTask = () => {
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
      console.log("Hủy bỏ tác vụ trước đó.");
    }
    activeControllerRef.current = new AbortController();
    return activeControllerRef.current.signal;
  };

  const handleAnalyze = useCallback(async () => {
    if (state.apiKeys.length === 0) {
      dispatch({ type: 'SET_ERROR', payload: "Vui lòng cung cấp ít nhất một khóa API để phân tích." });
      return;
    }
    if (!state.script) {
      dispatch({ type: 'SET_ERROR', payload: "Vui lòng cung cấp kịch bản để phân tích." });
      return;
    }
    const signal = cancelCurrentTask();
    dispatch({ type: 'ANALYZE_START' });

    try {
      const { characters, environments } = await analyzeScript(state.script, state.apiKeys, signal);
      if (signal.aborted) return;
      dispatch({ type: 'ANALYZE_SUCCESS', payload: { characters, environments } });
    } catch (e: any) {
      if (!signal.aborted) {
        dispatch({ type: 'SET_ERROR', payload: e.message || "Đã xảy ra lỗi không xác định trong quá trình phân tích." });
      }
    }
  }, [state.apiKeys, state.script]);

  const handleGenerate = useCallback(async () => {
    if (state.apiKeys.length === 0) {
      dispatch({ type: 'SET_ERROR', payload: "Vui lòng cung cấp ít nhất một khóa API để tạo gợi ý." });
      return;
    }
    if (!state.script) {
      dispatch({ type: 'SET_ERROR', payload: "Vui lòng cung cấp kịch bản để tạo gợi ý." });
      return;
    }
    
    const signal = cancelCurrentTask();
    dispatch({ type: 'GENERATE_START' });

    try {
      const selectedStyle = state.artStyles.find(s => s.id === state.settings.selectedStyleId) || state.artStyles[0];
      
      const onProgress = (progress: { newPrompt: string; updates: StateUpdate[] }) => {
        dispatch({ type: 'GENERATE_PROGRESS', payload: { prompt: progress.newPrompt, updates: progress.updates } });
        handleStateUpdates(progress.updates);
      };

      const onSetTotal = (total: number) => {
        dispatch({ type: 'SET_GENERATION_TOTAL', payload: total });
      };

      await generatePrompts(
        state.script, state.characters, state.environments, selectedStyle,
        state.settings, state.apiKeys, signal, onProgress, onSetTotal
      );
      if (signal.aborted) return;

    } catch (e: any) {
       if (!signal.aborted) {
        dispatch({ type: 'SET_ERROR', payload: e.message || "Đã xảy ra lỗi không xác định trong quá trình tạo gợi ý." });
      }
    } finally {
      if (!signal.aborted) {
         dispatch({ type: 'GENERATE_COMPLETE' });
      }
    }
  }, [state]);

  const handleStateUpdates = (updates: StateUpdate[]) => {
      if (!updates || updates.length === 0) return;
      
      let updatedChars = state.characters;
      let updatedEnvs = state.environments;
      const updatedIds: string[] = [];

      updates.forEach(update => {
        if (update.entityType === 'character') {
          const match = update.entityName.match(/^CHARACTER_(\d+)$/);
          if (match) {
            const index = parseInt(match[1], 10) - 1;
            if (index >= 0 && index < updatedChars.length) {
              const entityToUpdate = updatedChars[index];
              if (!entityToUpdate.isLocked) {
                updatedChars = [...updatedChars];
                updatedChars[index] = {
                  ...entityToUpdate,
                  description: `${entityToUpdate.description}, ${update.newDescriptionDetail}`
                };
                updatedIds.push(entityToUpdate.id);
              }
            }
          }
        } else if (update.entityType === 'environment') {
           const match = update.entityName.match(/^ENVIRONMENT_(\d+)$/);
           if (match) {
            const index = parseInt(match[1], 10) - 1;
            if (index >= 0 && index < updatedEnvs.length) {
              const entityToUpdate = updatedEnvs[index];
              if (!entityToUpdate.isLocked) {
                updatedEnvs = [...updatedEnvs];
                updatedEnvs[index] = {
                  ...entityToUpdate,
                  description: `${entityToUpdate.description}, ${update.newDescriptionDetail}`
                };
                updatedIds.push(entityToUpdate.id);
              }
            }
          }
        }
      });
      
      if (updatedChars !== state.characters) dispatch({ type: 'UPDATE_CHARACTERS', payload: updatedChars });
      if (updatedEnvs !== state.environments) dispatch({ type: 'UPDATE_ENVIRONMENTS', payload: updatedEnvs });

      if (updatedIds.length > 0) {
        dispatch({ type: 'SET_RECENTLY_UPDATED_IDS', payload: updatedIds });
        setTimeout(() => dispatch({ type: 'SET_RECENTLY_UPDATED_IDS', payload: [] }), 1500);
      }
    };

  const value = {
    state,
    dispatch,
    handleAnalyze,
    handleGenerate,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext phải được sử dụng trong một AppProvider');
  }
  return context;
};