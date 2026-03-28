import axios from 'axios';
import type { ApiError } from '../../types/models';

const stringifyUnknown = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object') {
    if ('message' in value && typeof value.message === 'string') {
      return value.message;
    }

    if ('error' in value && typeof value.error === 'string') {
      return value.error;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return 'Неизвестная ошибка';
    }
  }

  return 'Неизвестная ошибка';
};

export const normalizeApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const fallbackMessage = stringifyUnknown(error.response?.data ?? error.message);
    const message =
      status === 409
        ? 'Действие недоступно для текущего режима проекта. Проверьте режим: stages или flat.'
        : fallbackMessage;

    return {
      status,
      message,
      details: error.response?.data,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: stringifyUnknown(error),
  };
};
