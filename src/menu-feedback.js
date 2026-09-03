// Delegation keeps feedback working when language changes rebuild circuit cards.
export function installMenuFeedback(menu) {
  const timers = new WeakMap();
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function flash(element) {
    clearTimeout(timers.get(element));
    element.classList.remove('selection-feedback');
    void element.offsetWidth;
    element.classList.add('selection-feedback');
    timers.set(
      element,
      setTimeout(() => element.classList.remove('selection-feedback'), 550),
    );
  }
  menu.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !menu.contains(button) || button.disabled) return;
    flash(button);
    if (reduced()) return;
    button.querySelectorAll('.selection-ripple').forEach((node) => node.remove());
    const rect = button.getBoundingClientRect(),
      ripple = document.createElement('i');
    ripple.className = 'selection-ripple';
    ripple.setAttribute('aria-hidden', 'true');
    const diameter = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = `width:${diameter}px;height:${diameter}px;left:${(event.detail ? event.clientX - rect.left : rect.width / 2) - diameter / 2}px;top:${(event.detail ? event.clientY - rect.top : rect.height / 2) - diameter / 2}px`;
    button.append(ripple);
    setTimeout(() => ripple.remove(), 550);
  });
  menu.addEventListener('change', (event) => {
    if (event.target.matches('select,input')) {
      flash(event.target);
      const setup = event.target.closest('.setup');
      if (setup) flash(setup);
    }
  });
}
