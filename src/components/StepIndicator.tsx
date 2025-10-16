'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  // Sur desktop : afficher toutes les étapes
  // Sur mobile : afficher seulement l'étape actuelle et la suivante
  const stepsToShow: number[] = [];
  
  // Desktop : toutes les étapes
  const allSteps = Array.from({ length: totalSteps }, (_, index) => index + 1);
  
  // Mobile : étape actuelle + suivante
  if (currentStep <= totalSteps) {
    stepsToShow.push(currentStep);
    if (currentStep < totalSteps) {
      stepsToShow.push(currentStep + 1);
    }
  }

  const renderStep = (step: number) => {
    const isCompleted = step < currentStep;
    const isCurrent = step === currentStep;
    
    return (
      <div key={step} className="flex items-center">
        <div
          className={`flex items-center justify-center text-sm font-bold transition-colors ${
            isCompleted
              ? ''
              : isCurrent
              ? ''
              : 'bg-white'
          } ${step < totalSteps ? 'w-8 h-8 sm:w-10 sm:h-10 rounded-full' : ''}`}
          style={{
            backgroundColor: isCompleted || isCurrent ? '#dbb572' : undefined,
            color: '#10214b',
            border: '1px solid white',
            ...(step >= totalSteps && {
              padding: '10px',
              borderRadius: '20px'
            })
          }}
        >
          {step < totalSteps ? (
            step
          ) : (
            <div className="flex items-center gap-1">
              <CheckCircle size={16} className="sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm">validation</span>
            </div>
          )}
        </div>
        {step < totalSteps && (
          <div
            className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 transition-colors ${
              isCompleted ? '#dbb572' : '#EBE7E1'
            }`}
            style={{
              backgroundColor: isCompleted ? '#dbb572' : '#EBE7E1'
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center mb-8 px-4">
      {/* Desktop : toutes les étapes */}
      <div className="hidden md:flex items-center">
        {allSteps.map(renderStep)}
      </div>

      {/* Mobile : étape actuelle + suivante */}
      <div className="md:hidden flex items-center">
        {stepsToShow.map(renderStep)}
      </div>
    </div>
  );
};

export default StepIndicator;

