// Adds DOM matchers to expect(), like .toBeInTheDocument() and .toHaveValue().
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom has the <dialog> element but not its showModal()/close() methods,
// which our Modal uses. These stand-ins only open and close it (no backdrop).
HTMLDialogElement.prototype.showModal ??= function showModal() {
  this.open = true;
};
HTMLDialogElement.prototype.close ??= function close() {
  this.open = false;
  this.dispatchEvent(new Event('close'));
};

// Remove what each test rendered, so the next test starts with an empty page.
afterEach(() => {
  cleanup();
});
