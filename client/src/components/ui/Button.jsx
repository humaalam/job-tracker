import { buttonClass } from './buttonClass.js';

export default function Button({ className = '', type = 'button', variant = 'primary', ...props }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}
