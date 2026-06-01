import React, { useState, useCallback } from 'react'
import StepProgress from '../../components/StepProgress/StepProgress'
import StepSelectMaterials from './StepSelectMaterials'
import StepEditMetadata from './StepEditMetadata'
import StepAssignPublish from './StepAssignPublish'
import './ImportWizard.css'

const TOTAL_STEPS = 3

const ImportWizard = ({ onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedMaterials, setSelectedMaterials] = useState([])
  const [editedMaterials, setEditedMaterials] = useState([])

  const handleMaterialsSelected = useCallback((materials) => {
    setSelectedMaterials(materials)
    setEditedMaterials(materials.map(m => ({
      ...m,
      editedTitle: m.title,
      editedCategory: m.category || 'practice',
      editedDifficulty: m.difficulty || 'beginner',
      editedTags: m.tags ? (Array.isArray(m.tags) ? m.tags : String(m.tags).split(',').map(t => t.trim())) : [],
      estimatedTime: 25,
    })))
    setCurrentStep(2)
  }, [])

  const handleMetadataEdited = useCallback((edited) => {
    setEditedMaterials(edited)
    setCurrentStep(3)
  }, [])

  const handleAssignComplete = useCallback(async (assigns) => {
    if (onComplete) {
      await onComplete({ editedMaterials, assignments: assigns })
    }
  }, [editedMaterials, onComplete])

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1))
  }, [])

  return (
    <div className="import-wizard-overlay" onClick={onClose}>
      <div className="import-wizard" onClick={e => e.stopPropagation()}>
        <div className="import-wizard-header">
          <h2 className="import-wizard-title">从素材库导入</h2>
          <button className="import-wizard-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>

        <StepProgress
          tutorialSlug="import-wizard"
          totalSteps={TOTAL_STEPS}
          currentStep={currentStep - 1}
        />

        <div className="import-wizard-body">
          {currentStep === 1 && (
            <StepSelectMaterials onNext={handleMaterialsSelected} onCancel={onClose} />
          )}
          {currentStep === 2 && (
            <StepEditMetadata materials={editedMaterials} onNext={handleMetadataEdited} onBack={handleBack} />
          )}
          {currentStep === 3 && (
            <StepAssignPublish materials={editedMaterials} onComplete={handleAssignComplete} onBack={handleBack} />
          )}
        </div>
      </div>
    </div>
  )
}

export default ImportWizard
