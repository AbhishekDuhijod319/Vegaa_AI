// UI Styles for consistent theming across create-trip and edit-trip pages

// Currency options for the select dropdown
export const currencyOptions = [
  { value: 'INR', label: 'INR (₹)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'CHF', label: 'CHF (Fr)' },
  { value: 'CNY', label: 'CNY (¥)' },
];

// Transport options for the select dropdown
export const transportOptions = [
  { value: 'flight', label: '✈️ Flight' },
  { value: 'train', label: '🚂 Train' },
  { value: 'car', label: '🚗 Car' },
];

const blurredSurface = {
  backgroundColor: 'hsl(var(--background) / 0.9)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

// Helper: compute dark/light mode at runtime for dropdown surfaces
const isDarkMode = () => {
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark');
  }
  return false;
};
const dropdownSurface = () => ({
  backgroundColor: isDarkMode() ? '#000000' : '#ffffff',
  color: isDarkMode() ? '#ffffff' : '#111111',
});

// Google Places Autocomplete styles - consistent with theme + blur
export const placesAutocompleteStyles = {
  control: (provided) => ({
    ...provided,
    ...blurredSurface,
    border: 'none',
    boxShadow: 'none',
    minHeight: '44px',
    borderRadius: '6px',
    '&:hover': { border: 'none' },
  }),
  valueContainer: (provided) => ({ ...provided, padding: '0 12px' }),
  input: (provided) => ({ ...provided, color: 'hsl(var(--foreground))', margin: '0' }),
  placeholder: (provided) => ({ ...provided, color: 'hsl(var(--muted-foreground))' }),
  singleValue: (provided) => ({ ...provided, color: 'hsl(var(--foreground))' }),
  menu: (provided) => ({
    ...provided,
    ...dropdownSurface(),
    border: '1px solid hsl(var(--border))',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    zIndex: 9999,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? 'hsl(var(--accent))'
      : state.isFocused
      ? 'hsl(var(--accent) / 0.1)'
      : 'transparent',
    color: isDarkMode() ? '#ffffff' : '#111111',
    cursor: 'pointer',
    '&:hover': { backgroundColor: 'hsl(var(--accent) / 0.2)' },
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: 'hsl(var(--muted-foreground))',
    '&:hover': { color: 'hsl(var(--foreground))' },
  }),
};

// Currency select styles - compact for inline use + blur
export const currencySelectStyles = {
  control: (provided) => ({
    ...provided,
    ...blurredSurface,
    border: 'none',
    boxShadow: 'none',
    minHeight: '44px',
    borderRadius: '6px',
    '&:hover': { border: 'none' },
  }),
  valueContainer: (provided) => ({ ...provided, padding: '0 8px' }),
  input: (provided) => ({ ...provided, color: 'hsl(var(--foreground))', margin: '0' }),
  placeholder: (provided) => ({ ...provided, color: 'hsl(var(--muted-foreground))', fontSize: '14px' }),
  singleValue: (provided) => ({ ...provided, color: 'hsl(var(--foreground))', fontSize: '14px' }),
  menu: (provided) => ({
    ...provided,
    ...dropdownSurface(),
    border: '1px solid hsl(var(--border))',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    zIndex: 9999,
    minWidth: '120px',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? 'hsl(var(--accent))'
      : state.isFocused
      ? 'hsl(var(--accent) / 0.1)'
      : 'transparent',
    color: isDarkMode() ? '#ffffff' : '#111111',
    cursor: 'pointer',
    fontSize: '14px',
    '&:hover': { backgroundColor: 'hsl(var(--accent) / 0.2)' },
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: 'hsl(var(--muted-foreground))',
    padding: '4px',
    '&:hover': { color: 'hsl(var(--foreground))' },
  }),
};

// Transport select styles - similar to currency but with icons + blur
export const transportSelectStyles = {
  control: (provided) => ({
    ...provided,
    ...blurredSurface,
    border: 'none',
    boxShadow: 'none',
    minHeight: '44px',
    borderRadius: '6px',
    '&:hover': { border: 'none' },
  }),
  valueContainer: (provided) => ({ ...provided, padding: '0 12px' }),
  input: (provided) => ({ ...provided, color: 'hsl(var(--foreground))', margin: '0' }),
  placeholder: (provided) => ({ ...provided, color: 'hsl(var(--muted-foreground))' }),
  singleValue: (provided) => ({ ...provided, color: 'hsl(var(--foreground))' }),
  menu: (provided) => ({
    ...provided,
    ...dropdownSurface(),
    border: '1px solid hsl(var(--border))',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    zIndex: 9999,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? 'hsl(var(--accent))'
      : state.isFocused
      ? 'hsl(var(--accent) / 0.1)'
      : 'transparent',
    color: isDarkMode() ? '#ffffff' : '#111111',
    cursor: 'pointer',
    '&:hover': { backgroundColor: 'hsl(var(--accent) / 0.2)' },
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: 'hsl(var(--muted-foreground))',
    '&:hover': { color: 'hsl(var(--foreground))' },
  }),
};