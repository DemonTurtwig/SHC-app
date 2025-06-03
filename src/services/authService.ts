// src/services/authService.ts
import axios from 'axios';

const API = 'https://smart-homecare-backend.onrender.com/api';

/* ---------- e-mail ---------- */
export const loginWithEmail = (email: string, password: string) =>
  axios.post(`${API}/login`, { email, password }).then(r => r.data);

/* ---------- kakao ---------- */
export const loginWithKakao = (
  accessToken: string,
  shippingAddr?: { baseAddress?: string; detailAddress?: string } | null,
) => {
  console.log(
    '↗︎ sending token:', accessToken.slice(0, 10), '…',
    'shippingAddr →', shippingAddr,
  );

  // 🔑  IMPORTANT:  return only the payload
  return axios
    .post(`${API}/kakao/login`, { accessToken, shippingAddr })
    .then(r => r.data); 
};
