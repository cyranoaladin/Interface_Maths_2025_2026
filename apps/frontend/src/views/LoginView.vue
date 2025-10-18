<template>
  <div class="min-h-screen bg-gray-900 text-white flex items-center justify-center">
    <div class="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
      <h1 class="text-3xl font-bold text-center">Connexion</h1>
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium">Email</label>
          <input v-model="email" type="email" id="email" required class="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
        </div>
        <div>
          <label for="password" class="block text-sm font-medium">Mot de passe</label>
          <input v-model="password" type="password" id="password" required class="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
        </div>
        <button type="submit" class="w-full py-2 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
          Se connecter
        </button>
        <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const authStore = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  try {
    await authStore.login(email.value, password.value)
    router.push('/dashboard')
  } catch (err) {
    error.value = 'Email ou mot de passe incorrect.'
  }
}
</script>
