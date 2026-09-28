// KhelSetu — AI Analysis & Processing UI Logic

document.addEventListener('DOMContentLoaded', () => {

  const analysisProgressBar = document.getElementById('analysisProgressBar');
  const stepProcessingVideo = document.getElementById('stepProcessingVideo');
  const stepExtractingLandmarks = document.getElementById('stepExtractingLandmarks');
  const stepCalculatingMetrics = document.getElementById('stepCalculatingMetrics');
  const stepGeneratingReport = document.getElementById('stepGeneratingReport');
  const btnViewResults = document.getElementById('btnViewResults');
  const progressText = document.getElementById('progressPercentage');

  function navigateToResults() {
    window.location.href = 'test-results.html';
  }

  if (btnViewResults) {
    btnViewResults.addEventListener('click', navigateToResults);
  }

  function updateStepStatus(element, status, statusText) {
    if (!element) return;
    element.classList.remove('status-pending', 'status-active', 'status-done');
    element.classList.add('status-' + status);
    const statusSpan = element.querySelector('.test-analyzing-step-status');
    if (statusSpan && statusText) {
      statusSpan.textContent = statusText;
    }
  }

  function updateOverallProgress(percent) {
    if (analysisProgressBar) {
      analysisProgressBar.style.width = percent + '%';
    }
    if (progressText) {
      progressText.textContent = percent + '%';
    }
  }

  // ---------------------------------------------------------
  // MOCK SIMULATION (For UI Demonstration Only)
  // CORE TEAM: Replace with real Web Worker / API progress callbacks
  // ---------------------------------------------------------
  
  setTimeout(() => {
    updateStepStatus(stepProcessingVideo, 'active', '45%');
    updateOverallProgress(45);
  }, 500);

  setTimeout(() => {
    updateStepStatus(stepProcessingVideo, 'done', 'Done');
    updateStepStatus(stepExtractingLandmarks, 'active', 'In Progress');
    updateOverallProgress(60);
  }, 2000);

  setTimeout(() => {
    updateStepStatus(stepExtractingLandmarks, 'done', 'Done');
    updateStepStatus(stepCalculatingMetrics, 'active', 'In Progress');
    updateOverallProgress(80);
  }, 4000);

  setTimeout(() => {
    updateStepStatus(stepCalculatingMetrics, 'done', 'Done');
    updateStepStatus(stepGeneratingReport, 'active', 'In Progress');
    updateOverallProgress(95);
  }, 6000);

  setTimeout(() => {
    updateStepStatus(stepGeneratingReport, 'done', 'Done');
    updateOverallProgress(100);
    
    if (btnViewResults) {
      btnViewResults.disabled = false;
      btnViewResults.textContent = "View Results";
    }
  }, 7500);

});
