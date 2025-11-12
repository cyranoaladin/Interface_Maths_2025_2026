import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'));
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

  const isAuthenticated = computed(() => !!token.value);

  function setToken(newToken: string) {
    token.value = newToken;
    localStorage.setItem('token', newToken);
  }

  function setUser(newUser: any) {
    user.value = newUser;
    localStorage.setItem('user', JSON.stringify(newUser));
  }

  async function login(email: string, password: string) {
    const response = await fetch('/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        username: email,
        password: password
      })
    });

    if (response.ok) {
      const data = await response.json();
      setToken(data.access_token);
      // Fetch user info
      await fetchMe();
    } else {
      throw new Error('Failed to login');
    }
  }

  async function fetchMe() {
    const response = await fetch('/auth/me', {
      headers: { Authorization: `Bearer ${token.value}` }
    });
    if (response.ok) {
      const me = await response.json();
      setUser(me);
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  return { token, user, isAuthenticated, login, logout, fetchMe };
});
