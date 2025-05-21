import axios from 'axios';

const API = 'https://smart-homecare-backend.onrender.com/api';

export const searchAddress = async (query: string) => {
  const res = await axios.get('/api/kakao/address', {
    baseURL: 'https://smart-homecare-backend.onrender.com',
    params: { query },
  });
  return res.data.documents ?? res.data;
};