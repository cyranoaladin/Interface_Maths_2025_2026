<template>
  <div id="app" class="bg-gray-900">
    <nav class="p-4 text-white bg-gray-800">
      <router-link to="/" class="mr-4">Accueil</router-link>
      <router-link v-if="!authStore.isAuthenticated" to="/login" class="mr-4">Connexion</router-link>
      <router-link v-if="authStore.isAuthenticated" to="/dashboard">Dashboard</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/store/auth'
const authStore = useAuthStore()
</script>
