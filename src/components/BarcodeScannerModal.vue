<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from 'vue'
import { BrowserMultiFormatReader, type Result } from '@zxing/library'
import {
  Camera,
  Loader2,
  RefreshCw,
  ScanBarcode,
  X,
  AlertCircle
} from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'scanned', barcode: string): void
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const readerRef = ref<BrowserMultiFormatReader | null>(null)
const locked = ref(false)
const status = ref<'scanning' | 'detected' | 'error'>('scanning')
const errorMessage = ref<string | null>(null)

const startScanning = async () => {
  await nextTick()
  if (!videoRef.value) return

  locked.value = false
  status.value = 'scanning'
  errorMessage.value = null

  try {
    const reader = new BrowserMultiFormatReader()
    readerRef.value = reader

    // Try starting rear camera first
    reader.decodeFromVideoDevice(
      null, // default / environment camera
      videoRef.value,
      (result: Result | undefined, err) => {
        if (locked.value) return
        if (err && err.name !== 'NotFoundException') return
        if (!result) return

        const text = result.getText()
        if (!text || !/^[0-9]{6,14}$/.test(text)) return

        locked.value = true
        status.value = 'detected'

        // Haptic feedback if available on mobile
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(80)
          } catch {
            // ignore
          }
        }

        reader.reset()
        setTimeout(() => {
          emit('scanned', text)
          emit('close')
        }, 150)
      }
    ).catch((err: any) => {
      status.value = 'error'
      errorMessage.value =
        err?.name === 'NotAllowedError'
          ? 'Доступ до камери відхилено. Будь ласка, дозвольте доступ до камери у налаштуваннях браузера.'
          : err?.message || 'Не вдалося запустити відеопотік з камери.'
    })
  } catch (err: any) {
    status.value = 'error'
    errorMessage.value = err?.message || 'Помилка ініціалізації сканера штрих-кодів.'
  }
}

const stopScanning = () => {
  if (readerRef.value) {
    try {
      readerRef.value.reset()
    } catch {
      // ignore
    }
    readerRef.value = null
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      setTimeout(() => {
        startScanning()
      }, 150)
    } else {
      stopScanning()
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  stopScanning()
})

const retry = () => {
  stopScanning()
  startScanning()
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs"
        @click.self="emit('close')"
      >
        <div
          class="relative w-full max-w-md bg-white dark:bg-[#121217] rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800/80">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <ScanBarcode class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Сканер штрих-коду
                </h3>
                <p class="text-xs text-zinc-500 dark:text-zinc-400">
                  Наведіть камеру на штрих-код упаковки
                </p>
              </div>
            </div>
            <button
              type="button"
              @click="emit('close')"
              class="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Video viewport container -->
          <div class="relative w-full aspect-4/3 bg-black overflow-hidden flex items-center justify-center">
            <video
              ref="videoRef"
              class="w-full h-full object-cover"
              autoplay
              muted
              playsinline
            />

            <!-- Scan target overlay box -->
            <div
              v-if="status === 'scanning'"
              class="absolute inset-x-12 inset-y-8 border-2 border-violet-400/80 rounded-2xl pointer-events-none shadow-sm flex items-center justify-center"
            >
              <!-- Animated laser scanning line -->
              <div class="w-full h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-pulse" />

              <!-- Corner accents -->
              <div class="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-violet-500 rounded-tl-sm" />
              <div class="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-violet-500 rounded-tr-sm" />
              <div class="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-violet-500 rounded-bl-sm" />
              <div class="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-violet-500 rounded-br-sm" />
            </div>

            <!-- Scanning status pill -->
            <div
              v-if="status === 'scanning'"
              class="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-xs flex items-center gap-1.5 pointer-events-none"
            >
              <Camera class="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              <span>Пошук коду...</span>
            </div>

            <!-- Detected state overlay -->
            <div
              v-if="status === 'detected'"
              class="absolute inset-0 bg-violet-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2"
            >
              <Loader2 class="w-8 h-8 animate-spin text-violet-300" />
              <span class="text-sm font-medium">Штрих-код розпізнано!</span>
            </div>

            <!-- Error message overlay -->
            <div
              v-if="status === 'error'"
              class="absolute inset-0 bg-zinc-950/90 p-4 flex flex-col items-center justify-center text-center gap-3 text-white"
            >
              <AlertCircle class="w-10 h-10 text-rose-500" />
              <p class="text-xs sm:text-sm text-zinc-300 max-w-xs leading-relaxed">
                {{ errorMessage }}
              </p>
              <button
                type="button"
                @click="retry"
                class="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw class="w-3.5 h-3.5" />
                <span>Спробувати знову</span>
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Підтримуються стандартні EAN-13, EAN-8 та UPC</span>
            <button
              type="button"
              @click="emit('close')"
              class="px-3 py-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer font-medium"
            >
              Закрити
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
