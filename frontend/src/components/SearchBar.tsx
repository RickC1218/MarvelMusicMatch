import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, type FormEvent } from 'react';

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  className?: string;
}

export const SearchBar = ({
  defaultValue = '',
  placeholder = 'Busca qué escuchan tus héroes o villanos',
  onSubmit,
  className = '',
}: SearchBarProps) => {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(value.trim());
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={`flex w-full items-stretch ${className}`}
    >
      <button
        type="submit"
        aria-label="Buscar"
        className="flex h-12 w-14 shrink-0 items-center justify-center rounded-l-xl bg-primary text-background transition-opacity hover:opacity-90"
      >
        <FontAwesomeIcon icon="magnifying-glass" className="h-5 w-5" />
      </button>
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-12 w-full rounded-r-xl border border-l-0 border-primary bg-white px-4 text-secondary text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-success"
      />
    </form>
  );
};
