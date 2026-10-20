// A small text-style button (e.g. Edit / Delete in a list row), so each row
// doesn't get two big buttons. Pass the color in className.
export default function LinkButton({ className = '', type = 'button', ...props }) {
  return <button type={type} className={`text-sm hover:underline ${className}`} {...props} />;
}
