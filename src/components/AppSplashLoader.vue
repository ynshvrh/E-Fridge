<script setup lang="ts">
import { Refrigerator, Sparkles } from 'lucide-vue-next'
</script>

<template>
  <div class="splash-screen">
    <div class="splash-content">
      <div class="logo-pulse">
        <div class="pulse-ring"></div>
        <div class="pulse-ring delay-1"></div>
        <div class="icon-bubble">
          <Refrigerator class="w-9 h-9 fridge-icon" />
          <div class="sparkle-badge">
            <Sparkles class="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
      <div class="brand-text">
        <h1 class="brand-title">E-Fridge</h1>
        <p class="brand-subtitle">Розумний та свіжий простір продуктів</p>
      </div>
      <div class="loading-bar">
        <div class="loading-progress"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.splash-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image:
    radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.14) 0%, transparent 55%),
    radial-gradient(circle at 60% 60%, rgba(99, 102, 241, 0.12) 0%, transparent 50%);
}

:global(.dark) .splash-screen {
  background-color: #09090b;
  background-image:
    radial-gradient(circle at 50% 35%, rgba(124, 58, 237, 0.22) 0%, transparent 55%),
    radial-gradient(circle at 60% 60%, rgba(79, 70, 229, 0.18) 0%, transparent 50%);
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  animation: fadeIn 0.3s ease-out;
}

.logo-pulse {
  position: relative;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(139, 92, 246, 0.25);
  animation: ringPulse 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

:global(.dark) .pulse-ring {
  background: rgba(139, 92, 246, 0.3);
}

.pulse-ring.delay-1 {
  animation-delay: 0.6s;
}

.icon-bubble {
  position: relative;
  width: 72px;
  height: 72px;
  background: #ffffff;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px -4px rgba(124, 58, 237, 0.25), 0 4px 12px rgba(0, 0, 0, 0.04);
  border: 1.5px solid rgba(139, 92, 246, 0.2);
  z-index: 1;
}

:global(.dark) .icon-bubble {
  background: #121217;
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: 0 10px 30px -4px rgba(124, 58, 237, 0.4), 0 4px 12px rgba(0, 0, 0, 0.4);
}

.fridge-icon {
  color: #7c3aed;
  animation: floatBounce 2.4s ease-in-out infinite;
}

:global(.dark) .fridge-icon {
  color: #a78bfa;
}

.sparkle-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  color: #f59e0b;
  background: #fef3c7;
  padding: 4px;
  border-radius: 50%;
  border: 1.5px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: sparkleTwinkle 1.8s ease-in-out infinite alternate;
}

:global(.dark) .sparkle-badge {
  background: #78350f;
  color: #fbbf24;
  border-color: #121217;
}

.brand-text {
  text-align: center;
}

.brand-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #18181b;
  letter-spacing: -0.02em;
  margin: 0;
}

:global(.dark) .brand-title {
  color: #f4f4f5;
}

.brand-subtitle {
  font-size: 0.82rem;
  color: #71717a;
  margin-top: 4px;
}

:global(.dark) .brand-subtitle {
  color: #a1a1aa;
}

.loading-bar {
  width: 140px;
  height: 4px;
  background: #e4e4e7;
  border-radius: 9999px;
  overflow: hidden;
  position: relative;
}

:global(.dark) .loading-bar {
  background: #27272a;
}

.loading-progress {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  background: linear-gradient(90deg, #8b5cf6, #6366f1);
  border-radius: 9999px;
  animation: slideLoading 1.4s ease-in-out infinite;
}

@keyframes ringPulse {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}

@keyframes floatBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes sparkleTwinkle {
  0% { transform: scale(0.85) rotate(-10deg); opacity: 0.7; }
  100% { transform: scale(1.15) rotate(15deg); opacity: 1; }
}

@keyframes slideLoading {
  0% { left: -50%; }
  50% { left: 50%; }
  100% { left: 100%; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}
</style>
