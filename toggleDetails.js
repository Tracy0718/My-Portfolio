function toggleDetails(button) {
  const card = button.closest('.project-card');
  const details = card.querySelector('.project-details');
  const isOpen = details.classList.contains('active');

  // Close all other cards
  document.querySelectorAll('.project-details.active').forEach(d => {
    d.classList.remove('active');
    const btn = d.closest('.project-card').querySelector('.project-toggle-btn');
    if (btn) btn.textContent = 'View Details';
  });

  // Toggle this one
  if (!isOpen) {
    details.classList.add('active');
    button.textContent = 'Hide Details';
  } else {
    details.classList.remove('active');
    button.textContent = 'View Details';
  }
}