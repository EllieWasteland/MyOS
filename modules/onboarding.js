// --- Módulo de Onboarding ---
import {
    goToLoginStep
} from './ui.js';

export function initOnboarding() {
    const onboardingScreen = document.getElementById('onboarding-screen');
    const loginScreen = document.getElementById('login-screen');
    const finishOnboardingBtn = document.getElementById('finish-onboarding-btn');
    const onboardingNextBtns = document.querySelectorAll('.onboarding-next-btn');

    onboardingNextBtns.forEach(btn => btn.addEventListener('click', () => {
        const currentStep = btn.closest('.onboarding-step');
        const nextStep = document.getElementById(`onboarding-step-${btn.dataset.nextStep}`);
        if (currentStep && nextStep) {
            currentStep.style.opacity = '0';
            currentStep.style.pointerEvents = 'none';
            nextStep.style.opacity = '1';
            nextStep.style.pointerEvents = 'auto';
        }
    }));

    finishOnboardingBtn.addEventListener('click', () => {
        onboardingScreen.style.opacity = '0';
        loginScreen.classList.remove('opacity-0', 'pointer-events-none');
        goToLoginStep('1');
        onboardingScreen.addEventListener('transitionend', () => onboardingScreen.style.display = 'none', {
            once: true
        });
    });
}
