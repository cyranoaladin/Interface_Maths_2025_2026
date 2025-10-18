<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <header class="bg-gray-800 shadow-md p-4 flex justify-between items-center">
      <h1 class="text-xl font-bold">Dashboard</h1>
      <div v-if="authStore.user">
        <span>Bonjour, {{ authStore.user.full_name }} ({{ authStore.user.role }})</span>
        <button @click="handleLogout" class="ml-4 px-4 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">
          Déconnexion
        </button>
      </div>
    </header>
    <main class="p-8">
      <h2 class="text-2xl font-semibold">Bienvenue sur votre tableau de bord</h2>
      <!-- Le contenu du dashboard viendra ici -->
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
