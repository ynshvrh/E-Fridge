<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  mode?: 'login' | 'register'
}>()

const router = useRouter()
const authStore = useAuthStore()
const buttonRef = ref<HTMLDivElement | null>(null)
const errorMessage = ref('')

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '941333995278-pgiki8amquhfbac7f72ca3dvjspppceo.apps.googleusercontent.com'

type GoogleCredentialResponse = { credential: string }

type GoogleAccountsId = {
  initialize(config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
  }): void
  renderButton(
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon'
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'small' | 'medium' | 'large'
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
      shape?: 'rectangular' | 'pill' | 'circle' | 'square'
      width?: number
    }
  ): void
}

declare global {
  interface Window {
    google?: {
      accounts?: { id?: GoogleAccountsId }
    }
  }
}

async function handleCredentialResponse(response: GoogleCredentialResponse) {
  if (!response.credential) return
  errorMessage.value = ''
  try {
    await authStore.signInWithGoogle(response.credential)
    router.push({ name: 'home' })
  } catch (err: any) {
    errorMessage.value = err.message || 'Помилка авторизації через Google'
  }
}

function initGoogleSignIn() {
  if (!clientId || !buttonRef.value) return

  const gsi = window.google?.accounts?.id
  if (gsi) {
    gsi.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
    })

    gsi.renderButton(buttonRef.value, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: props.mode === 'register' ? 'signup_with' : 'signin_with',
      shape: 'pill',
      width: 320,
    })
  }
}

onMounted(() => {
  if (!clientId) return

  if (window.google?.accounts?.id) {
    initGoogleSignIn()
  } else {
    const existingScript = document.getElementById('google-gsi-script')
    if (!existingScript) {
      const script = document.createElement('script')
      script.id = 'google-gsi-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        initGoogleSignIn()
      }
      document.head.appendChild(script)
    } else {
      existingScript.addEventListener('load', initGoogleSignIn)
    }
  }
})
</script>

<template>
  <div v-if="clientId" class="mt-5 w-full">
    <div class="relative flex items-center justify-center my-4">
      <div class="border-t border-stone-200/80 w-full"></div>
      <span class="bg-white px-3 text-[11px] font-medium text-stone-400 uppercase tracking-wider absolute">
        або
      </span>
    </div>

    <div v-if="errorMessage" class="mb-3 text-xs text-rose-600 text-center">
      {{ errorMessage }}
    </div>

    <div class="flex justify-center w-full">
      <div ref="buttonRef"></div>
    </div>
  </div>
</template>
