// src/services/authService.ts
import axios from 'axios';

// Use ONE base URL (no /api)
const API = 'https://smart-homecare-backend.onrender.com/api';

export const loginWithEmail = (email: string, password: string) =>
  axios.post(`${API}/login`, { email, password }).then(r => r.data);

export const loginWithKakao = async (accessToken: string) => {
  console.log('↗︎ sending token:', accessToken.slice(0,10), '…');
  return axios
    .post(`${API}/api/kakao/login`, { accessToken })
    .then(res => res.data);
};