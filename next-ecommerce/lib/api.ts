'use client';

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export function setAuthToken(token?: string) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export async function get<T>(path: string) {
  const response = await api.get<T>(path);
  return response.data;
}

export async function post<T>(path: string, payload?: any) {
  const response = await api.post<T>(path, payload);
  return response.data;
}

export async function put<T>(path: string, payload?: any) {
  const response = await api.put<T>(path, payload);
  return response.data;
}

export async function del<T>(path: string) {
  const response = await api.delete<T>(path);
  return response.data;
}
