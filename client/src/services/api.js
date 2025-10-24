import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const getServerInfo = async () => {
  const { data } = await api.get('/server-info');
  return data;
};

export const getMeetingInfo = async (roomId) => {
  const { data } = await api.get(`/meeting/${roomId}`);
  return data;
};

export default api;
